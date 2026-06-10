/**
 * WebRTC Data Channel Manager
 * Star topology: teacher (hub) ↔ students (spokes)
 * Uses existing WebSocket for signaling, data channels for low-latency messaging
 */

export class WebRTCManager {
  /**
   * @param {Object} config
   * @param {Object} config.wsClient - WebSocketClient instance (has .send() method)
   * @param {'teacher'|'student'} config.role
   * @param {string} config.username
   * @param {Function} config.onMessage - (fromUsername, type, payload) => void
   * @param {Function} config.onConnectionChange - (username, state) => void  // state: 'connecting'|'connected'|'disconnected'|'failed'
   * @param {Function} config.onLatencyUpdate - (username, latencyMs) => void
   */
  constructor({ wsClient, role, username, onMessage, onConnectionChange, onLatencyUpdate }) {
    this.wsClient = wsClient;
    this.role = role;
    this.username = username;
    this.onMessage = onMessage || (() => {});
    this.onConnectionChange = onConnectionChange || (() => {});
    this.onLatencyUpdate = onLatencyUpdate || (() => {});

    this._active = false;
    this._peers = new Map(); // username -> { pc, dc, state, latency, iceCandidateBuffer, pingInterval }
    this._destroyed = false;

    this._iceConfig = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    this._PING_INTERVAL = 5000;
    this._STALE_TIMEOUT = 15000;
  }

  // ==================== LIFECYCLE ====================

  /** Teacher: broadcast activation, set active */
  activate() {
    if (this.role !== 'teacher') return;
    this._active = true;
    this.wsClient.send({
      type: 'webrtc_activate',
      teacherUsername: this.username,
      teacherPassword: this.wsClient.teacherPassword || ''
    });
  }

  /** Teacher: close all peer connections, broadcast deactivation */
  deactivate() {
    if (this.role !== 'teacher') return;
    this._active = false;
    // Close all connections
    for (const [username] of this._peers) {
      this._closePeer(username);
    }
    this._peers.clear();
    this.wsClient.send({
      type: 'webrtc_deactivate',
      teacherUsername: this.username,
      teacherPassword: this.wsClient.teacherPassword || ''
    });
  }

  /** Student: create offer and start handshake with teacher */
  connectToTeacher(teacherUsername) {
    if (this.role !== 'student') return;
    if (this._peers.has(teacherUsername)) return;
    this._active = true;
    this._createOfferConnection(teacherUsername);
  }

  /** Student: close connection to teacher */
  disconnectFromTeacher() {
    if (this.role !== 'student') return;
    this._active = false;
    for (const [username] of this._peers) {
      this._closePeer(username);
    }
    this._peers.clear();
  }

  /** Cleanup everything */
  destroy() {
    this._destroyed = true;
    this._active = false;
    for (const [username] of this._peers) {
      this._closePeer(username);
    }
    this._peers.clear();
  }

  // ==================== SIGNALING ====================

  /** Called from WS handler when a signaling message arrives */
  handleSignalingMessage(msg) {
    if (this._destroyed) return;

    switch (msg.subtype) {
      case 'offer':
        this._handleOffer(msg.fromUsername, msg.payload);
        break;
      case 'answer':
        this._handleAnswer(msg.fromUsername, msg.payload);
        break;
      case 'ice_candidate':
        this._handleIceCandidate(msg.fromUsername, msg.payload);
        break;
    }
  }

  // ==================== MESSAGING ====================

  /** Send to specific peer via data channel */
  sendTo(username, type, payload) {
    const peer = this._peers.get(username);
    if (!peer || !peer.dc || peer.dc.readyState !== 'open') return false;

    try {
      peer.dc.send(JSON.stringify({
        type,
        payload,
        ts: Date.now(),
        msgId: this._generateMsgId()
      }));
      return true;
    } catch (err) {
      console.warn(`[WebRTC] Failed to send to ${username}:`, err);
      return false;
    }
  }

  /** Teacher: send to all connected students */
  broadcast(type, payload) {
    if (this.role !== 'teacher') return;
    for (const [username] of this._peers) {
      this.sendTo(username, type, payload);
    }
  }

  /** Send via WebRTC, fall back to WS callback if not connected */
  sendWithFallback(targetUsername, type, payload, wsFallbackFn) {
    const sent = this.sendTo(targetUsername, type, payload);
    if (!sent && wsFallbackFn) {
      wsFallbackFn();
    }
    return sent;
  }

  // ==================== STATE ====================

  get isActive() {
    return this._active;
  }

  getConnectedPeers() {
    const peers = [];
    for (const [username, peer] of this._peers) {
      if (peer.state === 'connected') {
        peers.push(username);
      }
    }
    return peers;
  }

  getLatency(username) {
    const peer = this._peers.get(username);
    return peer?.latency ?? null;
  }

  isConnectedTo(username) {
    const peer = this._peers.get(username);
    return peer?.state === 'connected';
  }

  // ==================== INTERNAL: Connection Setup ====================

  /** Student creates offer (avoids race conditions with multiple students) */
  _createOfferConnection(targetUsername) {
    const pc = new RTCPeerConnection(this._iceConfig);
    const peer = {
      pc,
      dc: null,
      state: 'connecting',
      latency: null,
      iceCandidateBuffer: [],
      pingInterval: null,
      lastPong: Date.now()
    };
    this._peers.set(targetUsername, peer);
    this.onConnectionChange(targetUsername, 'connecting');

    // Student creates the data channel
    const dc = pc.createDataChannel('driller', { ordered: true });
    peer.dc = dc;
    this._setupDataChannel(dc, targetUsername);

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wsClient.send({
          type: 'webrtc_signal',
          subtype: 'ice_candidate',
          targetUsername,
          fromUsername: this.username,
          payload: event.candidate.toJSON()
        });
      }
    };

    pc.onconnectionstatechange = () => {
      this._handleConnectionStateChange(targetUsername, pc);
    };

    // Create and send offer
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        this.wsClient.send({
          type: 'webrtc_signal',
          subtype: 'offer',
          targetUsername,
          fromUsername: this.username,
          payload: pc.localDescription.toJSON()
        });
      })
      .catch(err => {
        console.error(`[WebRTC] Failed to create offer for ${targetUsername}:`, err);
        this._closePeer(targetUsername);
        this.onConnectionChange(targetUsername, 'failed');
      });
  }

  /** Teacher handles incoming offer from student */
  async _handleOffer(fromUsername, offerPayload) {
    // Teacher should accept offers; student ignores
    if (this.role !== 'teacher' || !this._active) return;

    const pc = new RTCPeerConnection(this._iceConfig);
    const peer = {
      pc,
      dc: null,
      state: 'connecting',
      latency: null,
      iceCandidateBuffer: [],
      pingInterval: null,
      lastPong: Date.now()
    };
    this._peers.set(fromUsername, peer);
    this.onConnectionChange(fromUsername, 'connecting');

    // Teacher receives data channel
    pc.ondatachannel = (event) => {
      peer.dc = event.channel;
      this._setupDataChannel(event.channel, fromUsername);
    };

    // ICE handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.wsClient.send({
          type: 'webrtc_signal',
          subtype: 'ice_candidate',
          targetUsername: fromUsername,
          fromUsername: this.username,
          payload: event.candidate.toJSON()
        });
      }
    };

    pc.onconnectionstatechange = () => {
      this._handleConnectionStateChange(fromUsername, pc);
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offerPayload));

      // Flush buffered ICE candidates
      this._flushIceCandidates(fromUsername);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.wsClient.send({
        type: 'webrtc_signal',
        subtype: 'answer',
        targetUsername: fromUsername,
        fromUsername: this.username,
        payload: pc.localDescription.toJSON()
      });
    } catch (err) {
      console.error(`[WebRTC] Failed to handle offer from ${fromUsername}:`, err);
      this._closePeer(fromUsername);
      this.onConnectionChange(fromUsername, 'failed');
    }
  }

  /** Student handles incoming answer from teacher */
  async _handleAnswer(fromUsername, answerPayload) {
    const peer = this._peers.get(fromUsername);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answerPayload));
      // Flush buffered ICE candidates
      this._flushIceCandidates(fromUsername);
    } catch (err) {
      console.error(`[WebRTC] Failed to handle answer from ${fromUsername}:`, err);
    }
  }

  /** Handle ICE candidate from either side */
  async _handleIceCandidate(fromUsername, candidatePayload) {
    const peer = this._peers.get(fromUsername);
    if (!peer) return;

    // Buffer if remote description not set yet
    if (!peer.pc.remoteDescription) {
      peer.iceCandidateBuffer.push(candidatePayload);
      return;
    }

    try {
      await peer.pc.addIceCandidate(new RTCIceCandidate(candidatePayload));
    } catch (err) {
      console.warn(`[WebRTC] Failed to add ICE candidate from ${fromUsername}:`, err);
    }
  }

  /** Flush buffered ICE candidates after remote description is set */
  async _flushIceCandidates(username) {
    const peer = this._peers.get(username);
    if (!peer || peer.iceCandidateBuffer.length === 0) return;

    for (const candidate of peer.iceCandidateBuffer) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`[WebRTC] Failed to add buffered ICE candidate:`, err);
      }
    }
    peer.iceCandidateBuffer = [];
  }

  // ==================== INTERNAL: Data Channel ====================

  _setupDataChannel(dc, peerUsername) {
    dc.onopen = () => {
      console.log(`[WebRTC] Data channel open with ${peerUsername}`);
      const peer = this._peers.get(peerUsername);
      if (peer) {
        peer.state = 'connected';
        peer.lastPong = Date.now();
        // Start ping/pong health check
        peer.pingInterval = setInterval(() => {
          this._sendPing(peerUsername);
          this._checkStale(peerUsername);
        }, this._PING_INTERVAL);
      }
      this.onConnectionChange(peerUsername, 'connected');

      // Send channel_ready
      this.sendTo(peerUsername, 'channel_ready', {
        username: this.username,
        role: this.role
      });
    };

    dc.onclose = () => {
      console.log(`[WebRTC] Data channel closed with ${peerUsername}`);
      const peer = this._peers.get(peerUsername);
      if (peer) {
        peer.state = 'disconnected';
        clearInterval(peer.pingInterval);
      }
      this.onConnectionChange(peerUsername, 'disconnected');
    };

    dc.onerror = (err) => {
      console.warn(`[WebRTC] Data channel error with ${peerUsername}:`, err);
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Handle internal ping/pong
        if (msg.type === 'ping') {
          this.sendTo(peerUsername, 'pong', { sentAt: msg.payload.sentAt, receivedAt: Date.now() });
          return;
        }
        if (msg.type === 'pong') {
          const peer = this._peers.get(peerUsername);
          if (peer) {
            peer.lastPong = Date.now();
            const latency = Date.now() - msg.payload.sentAt;
            peer.latency = latency;
            this.onLatencyUpdate(peerUsername, latency);
          }
          return;
        }

        // Dispatch to consumer
        this.onMessage(peerUsername, msg.type, msg.payload, msg.msgId);
      } catch (err) {
        console.warn(`[WebRTC] Failed to parse message from ${peerUsername}:`, err);
      }
    };
  }

  _sendPing(username) {
    this.sendTo(username, 'ping', { sentAt: Date.now() });
  }

  _checkStale(username) {
    const peer = this._peers.get(username);
    if (!peer) return;
    if (Date.now() - peer.lastPong > this._STALE_TIMEOUT) {
      console.warn(`[WebRTC] Connection to ${username} is stale, closing`);
      this._closePeer(username);
      this.onConnectionChange(username, 'disconnected');
    }
  }

  // ==================== INTERNAL: Cleanup ====================

  _handleConnectionStateChange(username, pc) {
    const state = pc.connectionState;
    console.log(`[WebRTC] Connection state with ${username}: ${state}`);

    if (state === 'failed' || state === 'closed') {
      const peer = this._peers.get(username);
      if (peer) {
        peer.state = state === 'failed' ? 'failed' : 'disconnected';
        clearInterval(peer.pingInterval);
      }
      this.onConnectionChange(username, state === 'failed' ? 'failed' : 'disconnected');
    }
  }

  _closePeer(username) {
    const peer = this._peers.get(username);
    if (!peer) return;

    clearInterval(peer.pingInterval);

    try {
      if (peer.dc) peer.dc.close();
    } catch (e) { /* ignore */ }

    try {
      peer.pc.close();
    } catch (e) { /* ignore */ }

    this._peers.delete(username);
  }

  _generateMsgId() {
    return `${this.username}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}

export default WebRTCManager;

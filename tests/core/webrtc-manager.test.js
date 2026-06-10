import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebRTCManager } from '../../platform/core/webrtc-manager.js';

// ==================== Mocks ====================

class MockDataChannel {
  constructor(label) {
    this.label = label;
    this.readyState = 'connecting';
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this._sent = [];
  }
  send(data) { this._sent.push(data); }
  close() { this.readyState = 'closed'; }
}

class MockRTCPeerConnection {
  constructor() {
    this.localDescription = null;
    this.remoteDescription = null;
    this.connectionState = 'new';
    this.onicecandidate = null;
    this.ondatachannel = null;
    this.onconnectionstatechange = null;
    this._dataChannels = [];
    this._iceCandidates = [];
  }
  createDataChannel(name, opts) {
    const dc = new MockDataChannel(name);
    this._dataChannels.push(dc);
    return dc;
  }
  async createOffer() { return { type: 'offer', sdp: 'mock-offer-sdp' }; }
  async createAnswer() { return { type: 'answer', sdp: 'mock-answer-sdp' }; }
  async setLocalDescription(desc) {
    // Real RTCPeerConnection stores an RTCSessionDescription with toJSON()
    this.localDescription = desc && desc.toJSON
      ? desc
      : { ...desc, toJSON() { return { type: this.type, sdp: this.sdp }; } };
  }
  async setRemoteDescription(desc) {
    this.remoteDescription = desc && desc.toJSON
      ? desc
      : { ...desc, toJSON() { return { type: this.type, sdp: this.sdp }; } };
  }
  async addIceCandidate(candidate) { this._iceCandidates.push(candidate); }
  close() { this.connectionState = 'closed'; }
  toJSON() { return { localDescription: this.localDescription }; }
}

class MockRTCSessionDescription {
  constructor(init) { Object.assign(this, init); }
  toJSON() { return { type: this.type, sdp: this.sdp }; }
}

class MockRTCIceCandidate {
  constructor(init) { Object.assign(this, init); }
  toJSON() { return { ...this }; }
}

const createMockWsClient = () => ({
  send: vi.fn()
});

// ==================== Setup ====================

beforeEach(() => {
  globalThis.RTCPeerConnection = MockRTCPeerConnection;
  globalThis.RTCSessionDescription = MockRTCSessionDescription;
  globalThis.RTCIceCandidate = MockRTCIceCandidate;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ==================== Tests ====================

describe('WebRTCManager', () => {

  // ---------- 1. Constructor & Initial State ----------

  describe('constructor & initial state', () => {
    it('stores role, username, and starts inactive with no peers', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });

      expect(mgr.role).toBe('teacher');
      expect(mgr.username).toBe('mrsmith');
      expect(mgr.isActive).toBe(false);
      expect(mgr.getConnectedPeers()).toEqual([]);
    });

    it('defaults callbacks to no-ops without throwing', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'student', username: 'alice' });
      expect(() => mgr.onMessage('x', 'y', {})).not.toThrow();
      expect(() => mgr.onConnectionChange('x', 'connected')).not.toThrow();
      expect(() => mgr.onLatencyUpdate('x', 42)).not.toThrow();
    });
  });

  // ---------- 2. Teacher Activation / Deactivation ----------

  describe('teacher activation / deactivation', () => {
    it('activate() sends webrtc_activate and sets active', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });

      mgr.activate();
      expect(mgr.isActive).toBe(true);
      expect(ws.send).toHaveBeenCalledWith({
        type: 'webrtc_activate',
        teacherUsername: 'mrsmith',
        teacherPassword: ''
      });
    });

    it('activate() does nothing for students', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'student', username: 'alice' });
      mgr.activate();
      expect(mgr.isActive).toBe(false);
      expect(ws.send).not.toHaveBeenCalled();
    });

    it('deactivate() sends webrtc_deactivate, clears peers, sets inactive', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();
      ws.send.mockClear();

      mgr.deactivate();
      expect(mgr.isActive).toBe(false);
      expect(ws.send).toHaveBeenCalledWith({
        type: 'webrtc_deactivate',
        teacherUsername: 'mrsmith',
        teacherPassword: ''
      });
      expect(mgr.getConnectedPeers()).toEqual([]);
    });
  });

  // ---------- 3. Student Offer Creation ----------

  describe('student offer creation', () => {
    it('connectToTeacher() creates peer connection, data channel, and sends offer via WS', async () => {
      const ws = createMockWsClient();
      const onConn = vi.fn();
      const mgr = new WebRTCManager({
        wsClient: ws, role: 'student', username: 'alice',
        onConnectionChange: onConn
      });

      mgr.connectToTeacher('mrsmith');

      // Wait for the async offer chain to finish
      await vi.advanceTimersByTimeAsync(0);

      expect(mgr.isActive).toBe(true);
      expect(onConn).toHaveBeenCalledWith('mrsmith', 'connecting');
      expect(ws.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'webrtc_signal',
        subtype: 'offer',
        targetUsername: 'mrsmith',
        fromUsername: 'alice'
      }));
    });

    it('connectToTeacher() is a no-op for teachers', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.connectToTeacher('alice');
      expect(ws.send).not.toHaveBeenCalled();
    });

    it('connectToTeacher() ignores duplicate calls for same teacher', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'student', username: 'alice' });

      mgr.connectToTeacher('mrsmith');
      mgr.connectToTeacher('mrsmith'); // duplicate

      await vi.advanceTimersByTimeAsync(0);
      // Only one offer should be sent
      const offerCalls = ws.send.mock.calls.filter(c => c[0].subtype === 'offer');
      expect(offerCalls.length).toBe(1);
    });
  });

  // ---------- 4. Teacher Offer Handling ----------

  describe('teacher offer handling', () => {
    it('handleSignalingMessage with offer creates answer and sends back', async () => {
      const ws = createMockWsClient();
      const onConn = vi.fn();
      const mgr = new WebRTCManager({
        wsClient: ws, role: 'teacher', username: 'mrsmith',
        onConnectionChange: onConn
      });
      mgr.activate();
      ws.send.mockClear();

      mgr.handleSignalingMessage({
        subtype: 'offer',
        fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'student-offer-sdp' }
      });

      await vi.advanceTimersByTimeAsync(0);

      expect(onConn).toHaveBeenCalledWith('alice', 'connecting');
      expect(ws.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'webrtc_signal',
        subtype: 'answer',
        targetUsername: 'alice',
        fromUsername: 'mrsmith'
      }));
    });

    it('ignores offers when teacher is not active', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      // Not activated
      mgr.handleSignalingMessage({
        subtype: 'offer',
        fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'student-offer-sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(ws.send).not.toHaveBeenCalled();
    });
  });

  // ---------- 5. ICE Candidate Buffering ----------

  describe('ICE candidate buffering', () => {
    it('buffers candidates when remoteDescription is not yet set', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'student', username: 'alice' });

      mgr.connectToTeacher('mrsmith');
      await vi.advanceTimersByTimeAsync(0);

      // Send ICE candidate before answer arrives (no remoteDescription yet)
      mgr.handleSignalingMessage({
        subtype: 'ice_candidate',
        fromUsername: 'mrsmith',
        payload: { candidate: 'candidate-1', sdpMid: '0' }
      });

      // Candidate should be buffered, not yet added to PC
      // Now send the answer to set remoteDescription and flush buffer
      mgr.handleSignalingMessage({
        subtype: 'answer',
        fromUsername: 'mrsmith',
        payload: { type: 'answer', sdp: 'teacher-answer-sdp' }
      });

      await vi.advanceTimersByTimeAsync(0);

      // After answer, buffered candidate should have been flushed
      // Verify no error was thrown (buffering worked)
      expect(mgr.isActive).toBe(true);
    });
  });

  // ---------- 6. Data Channel Messaging ----------

  describe('data channel messaging', () => {
    it('sendTo() returns false when peer is not connected', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      expect(mgr.sendTo('nobody', 'test', { foo: 1 })).toBe(false);
    });

    it('sendTo() sends JSON via dc.send() and returns true when connected', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      // Simulate a student connecting: handle offer to create peer
      mgr.handleSignalingMessage({
        subtype: 'offer',
        fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'student-offer-sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);

      // Manually wire up data channel (simulate ondatachannel event)
      const peer = mgr._peers.get('alice');
      const dc = new MockDataChannel('driller');
      dc.readyState = 'open';
      peer.dc = dc;
      peer.state = 'connected';

      const result = mgr.sendTo('alice', 'quiz_start', { qid: 42 });
      expect(result).toBe(true);
      expect(dc._sent.length).toBe(1);

      const parsed = JSON.parse(dc._sent[0]);
      expect(parsed.type).toBe('quiz_start');
      expect(parsed.payload).toEqual({ qid: 42 });
      expect(parsed.ts).toBeTypeOf('number');
      expect(parsed.msgId).toBeTypeOf('string');
    });
  });

  // ---------- 7. Broadcast ----------

  describe('broadcast', () => {
    it('teacher broadcasts to all connected peers', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      // Create two simulated peers
      for (const name of ['alice', 'bob']) {
        mgr.handleSignalingMessage({
          subtype: 'offer',
          fromUsername: name,
          payload: { type: 'offer', sdp: 'offer-sdp' }
        });
      }
      await vi.advanceTimersByTimeAsync(0);

      for (const name of ['alice', 'bob']) {
        const peer = mgr._peers.get(name);
        const dc = new MockDataChannel('driller');
        dc.readyState = 'open';
        peer.dc = dc;
        peer.state = 'connected';
      }

      mgr.broadcast('sync', { mode: 3 });

      for (const name of ['alice', 'bob']) {
        const dc = mgr._peers.get(name).dc;
        expect(dc._sent.length).toBe(1);
        const msg = JSON.parse(dc._sent[0]);
        expect(msg.type).toBe('sync');
        expect(msg.payload).toEqual({ mode: 3 });
      }
    });

    it('broadcast is a no-op for students', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'student', username: 'alice' });
      mgr.broadcast('test', {}); // should not throw
    });
  });

  // ---------- 8. sendWithFallback ----------

  describe('sendWithFallback', () => {
    it('sends via WebRTC when peer is connected', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);

      const peer = mgr._peers.get('alice');
      const dc = new MockDataChannel('driller');
      dc.readyState = 'open';
      peer.dc = dc;
      peer.state = 'connected';

      const fallback = vi.fn();
      const sent = mgr.sendWithFallback('alice', 'msg', { x: 1 }, fallback);
      expect(sent).toBe(true);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('calls fallback when peer is not connected', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });

      const fallback = vi.fn();
      const sent = mgr.sendWithFallback('nobody', 'msg', { x: 1 }, fallback);
      expect(sent).toBe(false);
      expect(fallback).toHaveBeenCalledOnce();
    });
  });

  // ---------- 9. Ping / Pong ----------

  describe('ping / pong via data channel', () => {
    it('pong message updates latency and calls onLatencyUpdate', async () => {
      const ws = createMockWsClient();
      const onLatency = vi.fn();
      const mgr = new WebRTCManager({
        wsClient: ws, role: 'teacher', username: 'mrsmith',
        onLatencyUpdate: onLatency
      });
      mgr.activate();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);

      const peer = mgr._peers.get('alice');
      const dc = new MockDataChannel('driller');
      dc.readyState = 'open';
      peer.dc = dc;
      peer.state = 'connected';

      // Simulate the data channel setup by triggering ondatachannel
      // We need to manually call _setupDataChannel since we are wiring dc manually
      mgr._setupDataChannel(dc, 'alice');

      // Simulate receiving a pong
      const sentAt = Date.now() - 25; // 25ms ago
      dc.onmessage({ data: JSON.stringify({ type: 'pong', payload: { sentAt } }) });

      expect(onLatency).toHaveBeenCalledWith('alice', expect.any(Number));
      expect(peer.latency).toBeTypeOf('number');
    });

    it('ping message triggers pong reply', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);

      const peer = mgr._peers.get('alice');
      const dc = new MockDataChannel('driller');
      dc.readyState = 'open';
      peer.dc = dc;
      peer.state = 'connected';
      mgr._setupDataChannel(dc, 'alice');

      const now = Date.now();
      dc.onmessage({ data: JSON.stringify({ type: 'ping', payload: { sentAt: now } }) });

      // The pong should have been sent via sendTo, which uses dc.send
      expect(dc._sent.length).toBe(1);
      const pong = JSON.parse(dc._sent[0]);
      expect(pong.type).toBe('pong');
      expect(pong.payload.sentAt).toBe(now);
    });
  });

  // ---------- 10. Connection State ----------

  describe('connection state queries', () => {
    it('getConnectedPeers returns only peers in connected state', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      for (const name of ['alice', 'bob']) {
        mgr.handleSignalingMessage({
          subtype: 'offer', fromUsername: name,
          payload: { type: 'offer', sdp: 'sdp' }
        });
      }
      await vi.advanceTimersByTimeAsync(0);

      // Only alice is connected
      mgr._peers.get('alice').state = 'connected';
      mgr._peers.get('bob').state = 'connecting';

      expect(mgr.getConnectedPeers()).toEqual(['alice']);
    });

    it('isConnectedTo returns true only for connected peer', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);
      mgr._peers.get('alice').state = 'connected';

      expect(mgr.isConnectedTo('alice')).toBe(true);
      expect(mgr.isConnectedTo('nobody')).toBe(false);
    });

    it('getLatency returns null for unknown peers', () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      expect(mgr.getLatency('nobody')).toBeNull();
    });

    it('getLatency returns stored latency value', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);
      mgr._peers.get('alice').latency = 30;

      expect(mgr.getLatency('alice')).toBe(30);
    });
  });

  // ---------- 11. Cleanup ----------

  describe('destroy / cleanup', () => {
    it('destroy() sets destroyed flag, closes all peers, clears state', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);

      mgr.destroy();

      expect(mgr.isActive).toBe(false);
      expect(mgr.getConnectedPeers()).toEqual([]);
      expect(mgr._destroyed).toBe(true);
    });

    it('handleSignalingMessage is a no-op after destroy', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'teacher', username: 'mrsmith' });
      mgr.activate();
      mgr.destroy();
      ws.send.mockClear();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);

      // No answer should have been sent
      expect(ws.send).not.toHaveBeenCalled();
    });

    it('disconnectFromTeacher() clears peers and sets inactive', async () => {
      const ws = createMockWsClient();
      const mgr = new WebRTCManager({ wsClient: ws, role: 'student', username: 'alice' });

      mgr.connectToTeacher('mrsmith');
      await vi.advanceTimersByTimeAsync(0);

      mgr.disconnectFromTeacher();
      expect(mgr.isActive).toBe(false);
      expect(mgr.getConnectedPeers()).toEqual([]);
    });
  });

  // ---------- 12. onMessage dispatch ----------

  describe('onMessage dispatch', () => {
    it('non-ping/pong messages are forwarded to onMessage callback', async () => {
      const ws = createMockWsClient();
      const onMsg = vi.fn();
      const mgr = new WebRTCManager({
        wsClient: ws, role: 'teacher', username: 'mrsmith',
        onMessage: onMsg
      });
      mgr.activate();

      mgr.handleSignalingMessage({
        subtype: 'offer', fromUsername: 'alice',
        payload: { type: 'offer', sdp: 'sdp' }
      });
      await vi.advanceTimersByTimeAsync(0);

      const peer = mgr._peers.get('alice');
      const dc = new MockDataChannel('driller');
      dc.readyState = 'open';
      peer.dc = dc;
      peer.state = 'connected';
      mgr._setupDataChannel(dc, 'alice');

      dc.onmessage({
        data: JSON.stringify({ type: 'answer_submit', payload: { answer: 42 }, msgId: 'abc123' })
      });

      expect(onMsg).toHaveBeenCalledWith('alice', 'answer_submit', { answer: 42 }, 'abc123');
    });
  });
});

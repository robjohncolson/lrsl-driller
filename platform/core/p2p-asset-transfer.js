/**
 * P2P Asset Transfer - WebRTC data channel file transfer
 *
 * Separate from WebRTCManager (different topology: on-demand point-to-point
 * vs. persistent star). Short-lived connections: open → transfer → close.
 *
 * Data channel protocol:
 *   Control messages: JSON strings (file_request, file_meta, file_complete, file_error)
 *   Data messages: ArrayBuffer with 8-byte header (transferId:u32 + chunkIndex:u32) + chunk bytes
 *
 * Signaling: Uses p2p_asset_signal messages relayed by Railway.
 */

import { AssetCache } from './asset-cache.js';

const CHUNK_SIZE = 16384;          // 16KB — safe across all browsers
const BACKPRESSURE_THRESHOLD = 1048576; // 1MB bufferedAmount threshold
const TRANSFER_TIMEOUT_MS = 30000; // 30 seconds per transfer
const DATA_CHANNEL_LABEL = 'asset-transfer';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

let nextTransferId = 1;

export class P2PAssetTransfer {
  constructor(wsClient, assetCache, username) {
    this._ws = wsClient;
    this._cache = assetCache;
    this._username = username;
    this._pendingRequests = new Map();  // transferId → { resolve, reject, timeout, chunks, meta }
    this._connections = new Map();      // peerUsername → RTCPeerConnection
    this._destroyed = false;
  }

  /**
   * Request a file from a peer. Returns a blob URL or throws on failure.
   */
  async requestFile(peerUsername, fileKey, expectedHash) {
    if (this._destroyed) throw new Error('P2PAssetTransfer destroyed');

    // Already cached?
    if (this._cache.has(fileKey)) {
      return this._cache.get(fileKey);
    }

    const transferId = nextTransferId++;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pendingRequests.delete(transferId);
        this._cleanupConnection(peerUsername);
        reject(new Error(`P2P transfer timeout for ${fileKey}`));
      }, TRANSFER_TIMEOUT_MS);

      this._pendingRequests.set(transferId, {
        resolve,
        reject,
        timeout,
        fileKey,
        expectedHash,
        peerUsername,
        chunks: [],
        meta: null,
        receivedBytes: 0
      });

      this._initiateConnection(peerUsername, transferId, fileKey);
    });
  }

  /**
   * Handle incoming signaling messages (from WebSocketClient).
   */
  handleSignalingMessage(msg) {
    if (this._destroyed) return;
    const { subtype, fromUsername, payload } = msg;

    switch (subtype) {
      case 'offer':
        this._handleOffer(fromUsername, payload);
        break;
      case 'answer':
        this._handleAnswer(fromUsername, payload);
        break;
      case 'ice_candidate':
        this._handleIceCandidate(fromUsername, payload);
        break;
      case 'error':
        this._handleSignalError(fromUsername, payload);
        break;
    }
  }

  /**
   * Initiate a WebRTC connection to a peer to request a file.
   */
  async _initiateConnection(peerUsername, transferId, fileKey) {
    try {
      const pc = new RTCPeerConnection(ICE_CONFIG);
      this._connections.set(peerUsername, pc);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this._sendSignal(peerUsername, 'ice_candidate', {
            candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate
          });
        }
      };

      const dc = pc.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true });
      this._setupRequesterChannel(dc, transferId, fileKey);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this._sendSignal(peerUsername, 'offer', {
        sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription,
        transferId,
        fileKey
      });
    } catch (err) {
      const req = this._pendingRequests.get(transferId);
      if (req) {
        clearTimeout(req.timeout);
        this._pendingRequests.delete(transferId);
        req.reject(err);
      }
      this._cleanupConnection(peerUsername);
    }
  }

  /**
   * Handle an incoming offer (we're the file server).
   */
  async _handleOffer(fromUsername, payload) {
    const { sdp, transferId, fileKey } = payload;

    // Check if we have the file
    if (!this._cache.has(fileKey)) {
      this._sendSignal(fromUsername, 'error', { transferId, error: 'file_not_found' });
      return;
    }

    try {
      const pc = new RTCPeerConnection(ICE_CONFIG);
      this._connections.set(fromUsername, pc);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          this._sendSignal(fromUsername, 'ice_candidate', {
            candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate
          });
        }
      };

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        if (dc.label === DATA_CHANNEL_LABEL) {
          this._setupServerChannel(dc, fileKey, transferId);
        }
      };

      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this._sendSignal(fromUsername, 'answer', {
        sdp: pc.localDescription.toJSON ? pc.localDescription.toJSON() : pc.localDescription,
        transferId
      });
    } catch (err) {
      console.warn('[P2P] Error handling offer:', err);
      this._cleanupConnection(fromUsername);
    }
  }

  /**
   * Handle an incoming answer (we're the file requester).
   */
  async _handleAnswer(fromUsername, payload) {
    const pc = this._connections.get(fromUsername);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(payload.sdp);
    } catch (err) {
      console.warn('[P2P] Error handling answer:', err);
      this._cleanupConnection(fromUsername);
    }
  }

  /**
   * Handle an incoming ICE candidate.
   */
  async _handleIceCandidate(fromUsername, payload) {
    const pc = this._connections.get(fromUsername);
    if (!pc) return;

    try {
      await pc.addIceCandidate(payload.candidate);
    } catch (err) {
      console.warn('[P2P] Error adding ICE candidate:', err);
    }
  }

  /**
   * Handle a signaling error (peer could not serve the file).
   */
  _handleSignalError(fromUsername, payload) {
    const transferId = payload?.transferId;
    const req = transferId ? this._pendingRequests.get(transferId) : null;
    if (req) {
      clearTimeout(req.timeout);
      this._pendingRequests.delete(transferId);
      req.reject(new Error(payload?.error || 'Peer reported error'));
    }
    this._cleanupConnection(fromUsername);
  }

  /**
   * Set up data channel on the requester side (receive file chunks).
   */
  _setupRequesterChannel(dc, transferId, fileKey) {
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      // Send file request
      dc.send(JSON.stringify({
        type: 'file_request',
        transferId,
        fileKey
      }));
    };

    dc.onmessage = (event) => {
      const req = this._pendingRequests.get(transferId);
      if (!req) return;

      if (typeof event.data === 'string') {
        this._handleControlMessage(transferId, JSON.parse(event.data));
      } else {
        // Binary data chunk
        const header = new DataView(event.data, 0, 8);
        const tid = header.getUint32(0);
        const chunkIndex = header.getUint32(4);
        const chunkData = event.data.slice(8);

        if (tid === transferId) {
          req.chunks[chunkIndex] = chunkData;
          req.receivedBytes += chunkData.byteLength;
        }
      }
    };

    dc.onclose = () => {
      // If we haven't resolved yet, this is an error
      const req = this._pendingRequests.get(transferId);
      if (req && !req.resolved) {
        clearTimeout(req.timeout);
        this._pendingRequests.delete(transferId);
        req.reject(new Error('Data channel closed before transfer complete'));
      }
    };

    dc.onerror = (err) => {
      const req = this._pendingRequests.get(transferId);
      if (req) {
        clearTimeout(req.timeout);
        this._pendingRequests.delete(transferId);
        req.reject(new Error('Data channel error'));
      }
    };
  }

  /**
   * Set up data channel on the server side (send file chunks).
   */
  _setupServerChannel(dc, fileKey, transferId) {
    dc.binaryType = 'arraybuffer';

    dc.onmessage = async (event) => {
      if (typeof event.data !== 'string') return;

      const msg = JSON.parse(event.data);
      if (msg.type === 'file_request' && msg.fileKey === fileKey) {
        await this._sendFile(dc, msg.transferId, fileKey);
      }
    };
  }

  /**
   * Send a file over a data channel in chunks.
   */
  async _sendFile(dc, transferId, fileKey) {
    const blob = this._cache.getBlob(fileKey);
    if (!blob) {
      dc.send(JSON.stringify({ type: 'file_error', transferId, error: 'not_found' }));
      return;
    }

    const hash = this._cache.getHash(fileKey);
    const totalSize = blob.size;
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
    console.log(`[P2P] Sending ${fileKey}: ${(totalSize / 1024).toFixed(0)}KB in ${totalChunks} chunks`);

    // Send metadata
    dc.send(JSON.stringify({
      type: 'file_meta',
      transferId,
      fileKey,
      totalSize,
      totalChunks,
      hash
    }));

    // Send chunks
    const buffer = await blob.arrayBuffer();
    for (let i = 0; i < totalChunks; i++) {
      // Backpressure check
      while (dc.bufferedAmount > BACKPRESSURE_THRESHOLD) {
        await new Promise(r => setTimeout(r, 10));
        if (dc.readyState !== 'open') return;
      }

      const offset = i * CHUNK_SIZE;
      const chunk = buffer.slice(offset, offset + CHUNK_SIZE);

      // Build header + chunk
      const msg = new ArrayBuffer(8 + chunk.byteLength);
      const header = new DataView(msg, 0, 8);
      header.setUint32(0, transferId);
      header.setUint32(4, i);
      new Uint8Array(msg, 8).set(new Uint8Array(chunk));

      dc.send(msg);
    }

    // Send completion
    dc.send(JSON.stringify({
      type: 'file_complete',
      transferId,
      totalChunks
    }));
  }

  /**
   * Handle control messages on the requester side.
   */
  async _handleControlMessage(transferId, msg) {
    const req = this._pendingRequests.get(transferId);
    if (!req) return;

    switch (msg.type) {
      case 'file_meta':
        req.meta = msg;
        console.log(`[P2P] Receiving ${msg.fileKey}: ${(msg.totalSize / 1024).toFixed(0)}KB in ${msg.totalChunks} chunks`);
        break;

      case 'file_complete': {
        // Reassemble blob
        const totalChunks = msg.totalChunks;
        const parts = [];
        for (let i = 0; i < totalChunks; i++) {
          if (!req.chunks[i]) {
            clearTimeout(req.timeout);
            this._pendingRequests.delete(transferId);
            req.reject(new Error(`Missing chunk ${i} of ${totalChunks}`));
            this._cleanupConnection(req.peerUsername);
            return;
          }
          parts.push(new Uint8Array(req.chunks[i]));
        }

        const blob = new Blob(parts, { type: 'video/mp4' });

        // Verify hash if expected
        if (req.expectedHash) {
          const actualHash = await this._cache.computeHash(blob);
          if (actualHash && actualHash !== req.expectedHash) {
            clearTimeout(req.timeout);
            this._pendingRequests.delete(transferId);
            req.reject(new Error('Hash mismatch'));
            this._cleanupConnection(req.peerUsername);
            return;
          }
        }

        // Store in cache
        const blobUrl = await this._cache.put(req.fileKey, blob);
        req.resolved = true;
        console.log(`[P2P] COMPLETE: ${req.fileKey} (${(blob.size / 1024).toFixed(0)}KB from ${req.peerUsername})`);

        clearTimeout(req.timeout);
        this._pendingRequests.delete(transferId);
        req.resolve(blobUrl);
        this._cleanupConnection(req.peerUsername);
        break;
      }

      case 'file_error':
        clearTimeout(req.timeout);
        this._pendingRequests.delete(transferId);
        req.reject(new Error(msg.error || 'Peer reported error'));
        this._cleanupConnection(req.peerUsername);
        break;
    }
  }

  /**
   * Send a signaling message via WebSocket.
   */
  _sendSignal(targetUsername, subtype, payload) {
    this._ws.send({
      type: 'p2p_asset_signal',
      subtype,
      targetUsername,
      payload
    });
  }

  /**
   * Clean up a peer connection.
   */
  _cleanupConnection(peerUsername) {
    const pc = this._connections.get(peerUsername);
    if (pc) {
      try { pc.close(); } catch { /* ignore */ }
      this._connections.delete(peerUsername);
    }
  }

  /**
   * Destroy all connections and pending transfers.
   */
  destroy() {
    this._destroyed = true;
    for (const req of this._pendingRequests.values()) {
      clearTimeout(req.timeout);
      req.reject(new Error('P2PAssetTransfer destroyed'));
    }
    this._pendingRequests.clear();

    for (const pc of this._connections.values()) {
      try { pc.close(); } catch { /* ignore */ }
    }
    this._connections.clear();
  }
}

export default P2PAssetTransfer;

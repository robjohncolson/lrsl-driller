/**
 * Ghost Orbits - Network Controller
 *
 * Client-side network handler for online multiplayer matches.
 * Manages WebSocket connection, room lifecycle, and state synchronization.
 *
 * Architecture:
 * - Clients send inputs only (spacebar presses)
 * - Server runs authoritative simulation at 60Hz
 * - Server broadcasts snapshots at 20Hz
 * - Client renders received state directly
 *
 * @version 1.0.0 (Phase 3)
 * @see ghost-orbits-spec.md sections 143-150
 */

/**
 * Network controller states
 */
export const NetworkState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  IN_LOBBY: 'in_lobby',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  RESULTS: 'results'
};

/**
 * Room states (mirrored from server)
 */
export const RoomState = {
  LOBBY: 'lobby',
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  ENDED: 'ended'
};

/**
 * OrbitsNetworkController - Client-side multiplayer network handler
 */
export class OrbitsNetworkController {
  /**
   * @param {Object} options
   * @param {string} options.serverUrl - WebSocket server URL
   * @param {string} options.username - Player's username
   * @param {Function} [options.onStateChange] - Callback when network state changes
   * @param {Function} [options.onRoomUpdate] - Callback when room state updates
   * @param {Function} [options.onSnapshot] - Callback when game snapshot received
   * @param {Function} [options.onMatchStart] - Callback when match starts
   * @param {Function} [options.onMatchEnd] - Callback when match ends
   * @param {Function} [options.onCountdown] - Callback during countdown
   * @param {Function} [options.onEvent] - Callback for game events
   * @param {Function} [options.onError] - Callback for errors
   */
  constructor(options) {
    this.serverUrl = options.serverUrl;
    this.username = options.username;

    // Callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onRoomUpdate = options.onRoomUpdate || (() => {});
    this.onSnapshot = options.onSnapshot || (() => {});
    this.onMatchStart = options.onMatchStart || (() => {});
    this.onMatchEnd = options.onMatchEnd || (() => {});
    this.onCountdown = options.onCountdown || (() => {});
    this.onEvent = options.onEvent || (() => {});
    this.onError = options.onError || (() => {});

    // State
    this.state = NetworkState.DISCONNECTED;
    this.ws = null;
    this.playerId = null;
    this.roomCode = null;
    this.isHost = false;

    // Room state
    this.roomState = null;
    this.players = [];

    // Match state
    this.lastSnapshot = null;
    this.matchResult = null;

    // Reconnection
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000;
    this._reconnectTimeout = null;

    // Heartbeat
    this._heartbeatInterval = null;
    this._identified = false;
  }

  // ----------------------------------------
  // CONNECTION MANAGEMENT
  // ----------------------------------------

  /**
   * Connect to the WebSocket server
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this._setState(NetworkState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);

        this.ws.onopen = () => {
          console.log('[OrbitsNetwork] Connected to server');
          this._setState(NetworkState.CONNECTED);
          this.reconnectAttempts = 0;
          this._startHeartbeat();
          this._identify();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(event);
        };

        this.ws.onclose = (event) => {
          console.log('[OrbitsNetwork] Connection closed', event.code);
          this._stopHeartbeat();
          this._handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[OrbitsNetwork] WebSocket error:', error);
          this.onError({ type: 'connection', message: 'WebSocket error' });
          reject(error);
        };

        // Timeout connection attempt
        setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this._setState(NetworkState.DISCONNECTED);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    this._stopHeartbeat();
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._setState(NetworkState.DISCONNECTED);
    this._resetState();
  }

  _identify() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this._send({
      type: 'identify',
      username: this.username
    });
    this._identified = true;
  }

  _startHeartbeat() {
    this._heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this._send({ type: 'heartbeat' });
      }
    }, 30000); // Every 30 seconds
  }

  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }

  _handleDisconnect() {
    this._identified = false;

    // Store reconnection context before any state changes
    const savedPlayerId = this.playerId;
    const savedRoomCode = this.roomCode;

    if (savedRoomCode && this.reconnectAttempts < this.maxReconnectAttempts) {
      // Try to reconnect
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[OrbitsNetwork] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      this._reconnectTimeout = setTimeout(async () => {
        try {
          await this.connect();
          // Rejoin room with existing playerId to resume session
          if (savedRoomCode && savedPlayerId) {
            await this.rejoinRoom(savedRoomCode, savedPlayerId);
          }
        } catch (error) {
          console.error('[OrbitsNetwork] Reconnect failed:', error);
        }
      }, delay);
    } else {
      this._setState(NetworkState.DISCONNECTED);
      this._resetState();
    }
  }

  _resetState() {
    this.playerId = null;
    this.roomCode = null;
    this.isHost = false;
    this.roomState = null;
    this.players = [];
    this.lastSnapshot = null;
    this.matchResult = null;
  }

  // ----------------------------------------
  // ROOM MANAGEMENT
  // ----------------------------------------

  /**
   * Create a new multiplayer room
   * @param {string} [mode='arena'] - Game mode
   * @returns {Promise<{roomCode: string, playerId: string}>}
   */
  async createRoom(mode = 'arena') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const handler = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'orbits_room_created') {
          this.ws.removeEventListener('message', handler);
          this.playerId = message.payload.playerId;
          this.roomCode = message.payload.roomCode;
          this.isHost = true;
          this._setState(NetworkState.IN_LOBBY);
          resolve({
            roomCode: this.roomCode,
            playerId: this.playerId
          });
        } else if (message.type === 'orbits_error') {
          this.ws.removeEventListener('message', handler);
          reject(new Error(message.payload.error));
        }
      };

      this.ws.addEventListener('message', handler);

      // Timeout
      setTimeout(() => {
        this.ws.removeEventListener('message', handler);
        reject(new Error('Create room timeout'));
      }, 10000);

      this._send({
        type: 'orbits_create_room',
        payload: { mode }
      });
    });
  }

  /**
   * Join an existing room
   * @param {string} roomCode - Room code to join
   * @returns {Promise<{roomCode: string, playerId: string}>}
   */
  async joinRoom(roomCode) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const handler = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'orbits_room_joined') {
          this.ws.removeEventListener('message', handler);
          this.playerId = message.payload.playerId;
          this.roomCode = message.payload.roomCode;
          this.isHost = false;
          this._setState(NetworkState.IN_LOBBY);
          resolve({
            roomCode: this.roomCode,
            playerId: this.playerId
          });
        } else if (message.type === 'orbits_error') {
          this.ws.removeEventListener('message', handler);
          reject(new Error(message.payload.error));
        }
      };

      this.ws.addEventListener('message', handler);

      // Timeout
      setTimeout(() => {
        this.ws.removeEventListener('message', handler);
        reject(new Error('Join room timeout'));
      }, 10000);

      this._send({
        type: 'orbits_join_room',
        payload: { roomCode: roomCode.toUpperCase() }
      });
    });
  }

  /**
   * Rejoin a room after disconnect (resume existing session)
   * @param {string} roomCode - Room code to rejoin
   * @param {string} playerId - Existing player ID to resume
   * @returns {Promise<{roomCode: string, playerId: string}>}
   */
  async rejoinRoom(roomCode, playerId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const handler = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'orbits_room_rejoined') {
          this.ws.removeEventListener('message', handler);
          this.playerId = message.payload.playerId;
          this.roomCode = message.payload.roomCode;
          this.isHost = message.payload.isHost || false;
          this._setState(NetworkState.IN_LOBBY);
          resolve({
            roomCode: this.roomCode,
            playerId: this.playerId
          });
        } else if (message.type === 'orbits_error') {
          this.ws.removeEventListener('message', handler);
          // If rejoin fails, try fresh join
          this.joinRoom(roomCode).then(resolve).catch(reject);
        }
      };

      this.ws.addEventListener('message', handler);

      // Timeout - fall back to fresh join
      setTimeout(() => {
        this.ws.removeEventListener('message', handler);
        this.joinRoom(roomCode).then(resolve).catch(reject);
      }, 5000);

      this._send({
        type: 'orbits_rejoin_room',
        payload: { roomCode: roomCode.toUpperCase(), playerId }
      });
    });
  }

  /**
   * Leave the current room
   */
  leaveRoom() {
    if (!this.roomCode) return;

    this._send({
      type: 'orbits_leave',
      payload: {}
    });

    this._resetState();
    this._setState(NetworkState.CONNECTED);
  }

  /**
   * Set ready status
   * @param {boolean} ready
   */
  setReady(ready = true) {
    this._send({
      type: 'orbits_ready',
      payload: { ready }
    });
  }

  /**
   * Start the match (host only)
   */
  startMatch() {
    if (!this.isHost) {
      console.warn('[OrbitsNetwork] Only host can start match');
      return;
    }

    this._send({
      type: 'orbits_start',
      payload: {}
    });
  }

  /**
   * Vote for rematch
   * @param {boolean} vote
   */
  voteRematch(vote = true) {
    this._send({
      type: 'orbits_vote_rematch',
      payload: { vote }
    });
  }

  // ----------------------------------------
  // INPUT HANDLING
  // ----------------------------------------

  /**
   * Send spacebar press input to server
   */
  sendSpacebarPress() {
    if (this.state !== NetworkState.PLAYING) return;

    this._send({
      type: 'orbits_input',
      payload: {
        action: 'PRESS',
        t: Date.now()
      }
    });
  }

  // ----------------------------------------
  // MESSAGE HANDLING
  // ----------------------------------------

  _handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      // console.log('[OrbitsNetwork] Received:', message.type);

      switch (message.type) {
        case 'orbits_room_state':
          this._handleRoomState(message.payload);
          break;

        case 'orbits_countdown':
          this._handleCountdown(message.payload);
          break;

        case 'orbits_match_start':
          this._handleMatchStart(message.payload);
          break;

        case 'orbits_snapshot':
          this._handleSnapshot(message.payload);
          break;

        case 'orbits_event':
          this._handleEvent(message.payload);
          break;

        case 'orbits_match_end':
          this._handleMatchEnd(message.payload);
          break;

        case 'orbits_error':
          this.onError(message.payload);
          break;

        case 'presence_snapshot':
          // Ignore presence messages in multiplayer context
          break;

        default:
          // Ignore other message types
          break;
      }
    } catch (error) {
      console.error('[OrbitsNetwork] Error parsing message:', error);
    }
  }

  _handleRoomState(payload) {
    this.roomState = payload.state;
    this.players = payload.players || [];
    this.isHost = payload.hostId === this.playerId;

    // Update state based on room state
    if (payload.state === RoomState.LOBBY) {
      this._setState(NetworkState.IN_LOBBY);
    } else if (payload.state === RoomState.COUNTDOWN) {
      this._setState(NetworkState.COUNTDOWN);
    } else if (payload.state === RoomState.PLAYING) {
      this._setState(NetworkState.PLAYING);
    } else if (payload.state === RoomState.ENDED) {
      this._setState(NetworkState.RESULTS);
    }

    this.onRoomUpdate({
      roomCode: payload.roomCode,
      state: payload.state,
      players: this.players,
      isHost: this.isHost,
      canStart: payload.canStart
    });
  }

  _handleCountdown(payload) {
    this._setState(NetworkState.COUNTDOWN);
    this.onCountdown({
      secondsRemaining: payload.secondsRemaining
    });
  }

  _handleMatchStart(payload) {
    this._setState(NetworkState.PLAYING);
    this.matchResult = null;
    this.onMatchStart({
      seed: payload.seed,
      mode: payload.mode,
      arenaSize: payload.arenaSize,
      players: payload.players,
      records: payload.records,
      dots: payload.dots,
      myPlayerId: this.playerId
    });
  }

  _handleSnapshot(payload) {
    this.lastSnapshot = payload;
    this.onSnapshot({
      tick: payload.tick,
      time: payload.time,
      ghosts: payload.ghosts,
      dots: payload.dots,
      records: payload.records,
      scores: payload.scores,
      myPlayerId: this.playerId
    });
  }

  _handleEvent(payload) {
    this.onEvent({
      event: payload.event,
      playerId: payload.playerId,
      dotId: payload.dotId,
      lives: payload.lives,
      sourceId: payload.sourceId
    });
  }

  _handleMatchEnd(payload) {
    this._setState(NetworkState.RESULTS);
    this.matchResult = payload;
    this.onMatchEnd({
      winner: payload.winner,
      winnerUsername: payload.winnerUsername,
      condition: payload.condition,
      finalScores: payload.finalScores,
      stats: payload.stats,
      isWinner: payload.winner === this.playerId
    });
  }

  // ----------------------------------------
  // UTILITY METHODS
  // ----------------------------------------

  _send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[OrbitsNetwork] Cannot send - not connected');
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  _setState(newState) {
    if (this.state === newState) return;

    const oldState = this.state;
    this.state = newState;
    this.onStateChange({ oldState, newState });
  }

  // ----------------------------------------
  // GETTERS
  // ----------------------------------------

  /**
   * Check if connected to server
   */
  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Check if in a room
   */
  get inRoom() {
    return !!this.roomCode;
  }

  /**
   * Get current player info
   */
  getMyPlayer() {
    return this.players.find(p => p.playerId === this.playerId);
  }

  /**
   * Get opponent info
   */
  getOpponent() {
    return this.players.find(p => p.playerId !== this.playerId);
  }

  /**
   * Get my ghost from last snapshot
   */
  getMyGhost() {
    if (!this.lastSnapshot) return null;
    return this.lastSnapshot.ghosts.find(g => g.playerId === this.playerId);
  }

  /**
   * Get opponent ghost from last snapshot
   */
  getOpponentGhost() {
    if (!this.lastSnapshot) return null;
    return this.lastSnapshot.ghosts.find(g => g.playerId !== this.playerId);
  }
}

export default OrbitsNetworkController;

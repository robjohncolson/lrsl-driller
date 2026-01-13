/**
 * Pong Game - Client-side game state manager
 * Handles keyboard/touch input and server message processing
 *
 * v1.0: Initial implementation
 */

import { PONG_CONFIG } from '../../shared/pong.config.js';

export class PongGame {
  constructor(config) {
    this.duelId = config.duelId;
    this.gameId = config.gameId;
    this.username = config.username;
    this.serverUrl = config.serverUrl;
    this.isAttacker = config.isAttacker;

    // Callbacks
    this.onStateChange = config.onStateChange || (() => {});
    this.onEnd = config.onEnd || (() => {});
    this.onScore = config.onScore || (() => {});
    this.onHit = config.onHit || (() => {});

    // Game state (updated from server)
    this.attacker = config.attacker || null;
    this.defender = config.defender || null;
    this.territory = config.territory || null;
    this.paddles = {
      attacker: { y: PONG_CONFIG.courtHeight / 2 - PONG_CONFIG.paddleBaseHeight / 2, height: PONG_CONFIG.paddleBaseHeight },
      defender: { y: PONG_CONFIG.courtHeight / 2 - PONG_CONFIG.paddleBaseHeight / 2, height: PONG_CONFIG.paddleBaseHeight }
    };
    this.ball = { x: PONG_CONFIG.courtWidth / 2, y: PONG_CONFIG.courtHeight / 2, vx: 0, vy: 0 };
    this.score = { attacker: 0, defender: 0 };
    this.timeRemaining = PONG_CONFIG.maxDurationSeconds;
    this.phase = 'waiting';  // waiting, countdown, active, finished
    this.countdownSeconds = PONG_CONFIG.countdownSeconds;
    this.result = null;

    // Input state
    this.input = { up: false, down: false };
    this._lastInputSent = null;
    this._inputThrottleTimeout = null;

    // Setup input listeners
    this._boundKeyDown = this._handleKeyDown.bind(this);
    this._boundKeyUp = this._handleKeyUp.bind(this);
    this._boundTouchStart = this._handleTouchStart.bind(this);
    this._boundTouchEnd = this._handleTouchEnd.bind(this);

    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
  }

  /**
   * Enable touch controls on a specific element
   * @param {HTMLElement} element - Element to attach touch listeners to
   */
  enableTouchControls(element) {
    this._touchElement = element;
    element.addEventListener('touchstart', this._boundTouchStart, { passive: false });
    element.addEventListener('touchend', this._boundTouchEnd, { passive: false });
    element.addEventListener('touchcancel', this._boundTouchEnd, { passive: false });
  }

  /**
   * Handle keyboard key down
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    if (this.phase !== 'active') return;

    if (PONG_CONFIG.upKeys.includes(e.key)) {
      e.preventDefault();
      if (!this.input.up) {
        this.input.up = true;
        this._sendInput();
      }
    }
    if (PONG_CONFIG.downKeys.includes(e.key)) {
      e.preventDefault();
      if (!this.input.down) {
        this.input.down = true;
        this._sendInput();
      }
    }
  }

  /**
   * Handle keyboard key up
   * @param {KeyboardEvent} e
   */
  _handleKeyUp(e) {
    if (PONG_CONFIG.upKeys.includes(e.key)) {
      this.input.up = false;
      this._sendInput();
    }
    if (PONG_CONFIG.downKeys.includes(e.key)) {
      this.input.down = false;
      this._sendInput();
    }
  }

  /**
   * Handle touch start - top half = up, bottom half = down
   * @param {TouchEvent} e
   */
  _handleTouchStart(e) {
    if (this.phase !== 'active' || !this._touchElement) return;
    e.preventDefault();

    const touch = e.touches[0];
    const rect = this._touchElement.getBoundingClientRect();
    const relativeY = (touch.clientY - rect.top) / rect.height;

    if (relativeY < PONG_CONFIG.touchZones.upZoneEnd) {
      this.input.up = true;
      this.input.down = false;
    } else if (relativeY >= PONG_CONFIG.touchZones.downZoneStart) {
      this.input.down = true;
      this.input.up = false;
    }

    this._sendInput();
  }

  /**
   * Handle touch end
   * @param {TouchEvent} e
   */
  _handleTouchEnd(e) {
    e.preventDefault();
    this.input.up = false;
    this.input.down = false;
    this._sendInput();
  }

  /**
   * Send input to server (throttled)
   */
  _sendInput() {
    if (this.phase !== 'active') return;

    // Throttle input sends
    const inputKey = `${this.input.up}-${this.input.down}`;
    if (inputKey === this._lastInputSent) return;

    this._lastInputSent = inputKey;

    // Fire and forget - don't wait for response
    fetch(`${this.serverUrl}/api/pong/input`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duelId: this.duelId,
        username: this.username,
        input: this.input
      })
    }).catch(() => {
      // Ignore network errors for input - next tick will correct state
    });
  }

  /**
   * Handle server WebSocket message
   * @param {Object} message - Server message
   */
  handleServerMessage(message) {
    // Only process messages for this duel
    if (message.duelId && message.duelId !== this.duelId) return;

    switch (message.type) {
      case 'pong_countdown':
        this.phase = 'countdown';
        this.countdownSeconds = message.countdownSeconds;
        this.attacker = message.attacker;
        this.defender = message.defender;
        this.territory = message.territory;
        this.paddles.attacker.height = message.attackerPaddle;
        this.paddles.defender.height = message.defenderPaddle;
        this.onStateChange();
        break;

      case 'pong_start':
        this.phase = 'active';
        this.attacker = message.attacker;
        this.defender = message.defender;
        this.territory = message.territory;
        this.paddles = message.paddles;
        this.ball = message.ball;
        this.onStateChange();
        break;

      case 'pong_tick':
        this.paddles = message.paddles;
        this.ball = message.ball;
        this.score = message.score;
        this.timeRemaining = message.timeRemaining;
        this.phase = 'active';
        this.onStateChange();
        break;

      case 'pong_score':
        this.score = message.score;
        this.onScore(message.scorer);
        this.onStateChange();
        break;

      case 'pong_hit':
        this.onHit(message.side);
        break;

      case 'pong_end':
        this.phase = 'finished';
        this.result = message;
        this.onEnd(message);
        this.onStateChange();
        break;
    }
  }

  /**
   * Update countdown timer (call from animation loop)
   * @param {number} deltaMs - Time since last update in ms
   */
  updateCountdown(deltaMs) {
    if (this.phase === 'countdown' && this.countdownSeconds > 0) {
      this.countdownSeconds -= deltaMs / 1000;
      if (this.countdownSeconds < 0) this.countdownSeconds = 0;
    }
  }

  /**
   * Check if this player is a participant
   * @returns {boolean}
   */
  isParticipant() {
    return this.username === this.attacker || this.username === this.defender;
  }

  /**
   * Get the side this player is on
   * @returns {'attacker'|'defender'|null}
   */
  getPlayerSide() {
    if (this.username === this.attacker) return 'attacker';
    if (this.username === this.defender) return 'defender';
    return null;
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);

    if (this._touchElement) {
      this._touchElement.removeEventListener('touchstart', this._boundTouchStart);
      this._touchElement.removeEventListener('touchend', this._boundTouchEnd);
      this._touchElement.removeEventListener('touchcancel', this._boundTouchEnd);
    }

    if (this._inputThrottleTimeout) {
      clearTimeout(this._inputThrottleTimeout);
    }
  }
}

export default PongGame;

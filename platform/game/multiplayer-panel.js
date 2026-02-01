/**
 * Ghost Orbits - Multiplayer Panel (HUD)
 *
 * HUD overlay for multiplayer game information.
 * Displays timer, lives, scores, and game events.
 *
 * @version 1.0.0
 */

// ============================================================================
// MULTIPLAYER PANEL
// ============================================================================

/**
 * MultiplayerPanel - HUD overlay for multiplayer games
 */
export class MultiplayerPanel {
  /**
   * Create a new multiplayer panel
   * @param {HTMLElement} container - Container element for the HUD
   */
  constructor(container) {
    this.container = container;

    // Local player info
    this.myPlayerId = null;

    // Event message queue
    this.eventMessages = [];
    this.maxEvents = 5;

    // Create HUD elements
    this._createHUD();
    this._addStyles();
  }

  /**
   * Create HUD DOM elements
   * @private
   */
  _createHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.className = 'mp-hud';
    this.hudElement.innerHTML = `
      <div class="mp-hud-top">
        <div class="mp-hud-lives">
          <span class="mp-hud-label">Lives</span>
          <div class="mp-hud-lives-icons" id="mp-lives-icons">
            <span class="mp-life-icon active"></span>
            <span class="mp-life-icon active"></span>
            <span class="mp-life-icon active"></span>
          </div>
        </div>

        <div class="mp-hud-timer">
          <span class="mp-hud-timer-value" id="mp-timer">2:00</span>
        </div>

        <div class="mp-hud-scores">
          <span class="mp-hud-label">Scores</span>
          <div class="mp-hud-scoreboard" id="mp-scoreboard">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>

      <div class="mp-hud-events" id="mp-events">
        <!-- Event messages appear here -->
      </div>

      <div class="mp-hud-bottom">
        <div class="mp-hud-controls">
          <span class="mp-control-hint">Press <kbd>SPACE</kbd> to flip enemy dots!</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.hudElement);

    // Cache element references
    this.timerEl = this.hudElement.querySelector('#mp-timer');
    this.livesEl = this.hudElement.querySelector('#mp-lives-icons');
    this.scoreboardEl = this.hudElement.querySelector('#mp-scoreboard');
    this.eventsEl = this.hudElement.querySelector('#mp-events');
  }

  /**
   * Add styles for the HUD
   * @private
   */
  _addStyles() {
    if (document.getElementById('mp-hud-styles')) return;

    const style = document.createElement('style');
    style.id = 'mp-hud-styles';
    style.textContent = `
      .mp-hud {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        font-family: 'Segoe UI', system-ui, sans-serif;
        z-index: 10;
      }

      .mp-hud-top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px 24px;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
      }

      .mp-hud-label {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #888;
        margin-bottom: 4px;
      }

      .mp-hud-lives {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
      }

      .mp-hud-lives-icons {
        display: flex;
        gap: 6px;
      }

      .mp-life-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #333;
        border: 2px solid #555;
        transition: all 0.3s ease;
      }

      .mp-life-icon.active {
        background: linear-gradient(135deg, #ff4444 0%, #cc2222 100%);
        border-color: #ff6666;
        box-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
      }

      .mp-life-icon.lost {
        animation: life-lost 0.5s ease;
      }

      @keyframes life-lost {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.5; }
        100% { transform: scale(0.8); opacity: 0.3; }
      }

      .mp-hud-timer {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .mp-hud-timer-value {
        font-size: 36px;
        font-weight: 700;
        color: #fff;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        font-variant-numeric: tabular-nums;
      }

      .mp-hud-timer-value.warning {
        color: #ffaa00;
        animation: timer-pulse 1s ease-in-out infinite;
      }

      .mp-hud-timer-value.critical {
        color: #ff4444;
        animation: timer-pulse 0.5s ease-in-out infinite;
      }

      @keyframes timer-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .mp-hud-scores {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .mp-hud-scoreboard {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 150px;
        overflow-y: auto;
      }

      .mp-score-entry {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        font-size: 12px;
      }

      .mp-score-entry.is-me {
        background: rgba(68, 136, 255, 0.3);
        border: 1px solid rgba(68, 136, 255, 0.5);
      }

      .mp-score-color {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .mp-score-name {
        color: #fff;
        min-width: 60px;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .mp-score-value {
        color: #4488ff;
        font-weight: 600;
        min-width: 30px;
        text-align: right;
      }

      .mp-hud-events {
        position: absolute;
        left: 24px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 250px;
      }

      .mp-event {
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.7);
        border-left: 3px solid #4488ff;
        border-radius: 4px;
        font-size: 12px;
        color: #fff;
        animation: event-slide-in 0.3s ease;
        opacity: 0.9;
        transition: opacity 0.3s ease;
      }

      .mp-event.fading {
        opacity: 0;
      }

      .mp-event.damage {
        border-color: #ff4444;
        background: rgba(68, 0, 0, 0.7);
      }

      .mp-event.claim {
        border-color: #44cc88;
      }

      .mp-event.flip {
        border-color: #ffaa00;
      }

      @keyframes event-slide-in {
        from {
          transform: translateX(-20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 0.9;
        }
      }

      .mp-hud-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px 24px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
      }

      .mp-hud-controls {
        text-align: center;
      }

      .mp-control-hint {
        font-size: 12px;
        color: #888;
      }

      .mp-control-hint kbd {
        display: inline-block;
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        font-family: monospace;
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Set the local player ID
   * @param {string} playerId - Local player's ID
   */
  setMyPlayerId(playerId) {
    this.myPlayerId = playerId;
  }

  /**
   * Update HUD from a game snapshot
   * @param {Object} snapshot - Server game snapshot
   */
  update(snapshot) {
    if (!snapshot) return;

    // Update timer
    this._updateTimer(snapshot.time);

    // Update lives for local player
    const myGhost = snapshot.ghosts?.find(g => g.id === this.myPlayerId);
    if (myGhost) {
      this._updateLives(myGhost.lives);
    }

    // Update scoreboard
    this._updateScoreboard(snapshot.ghosts, snapshot.scores);
  }

  /**
   * Update the timer display
   * @param {number} timeRemaining - Time remaining in seconds
   * @private
   */
  _updateTimer(timeRemaining) {
    if (timeRemaining === undefined) return;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = Math.floor(timeRemaining % 60);
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.timerEl.textContent = formatted;

    // Add warning classes
    this.timerEl.classList.remove('warning', 'critical');
    if (timeRemaining <= 10) {
      this.timerEl.classList.add('critical');
    } else if (timeRemaining <= 30) {
      this.timerEl.classList.add('warning');
    }
  }

  /**
   * Update lives display
   * @param {number} lives - Current lives count
   * @private
   */
  _updateLives(lives) {
    const icons = this.livesEl.querySelectorAll('.mp-life-icon');
    icons.forEach((icon, i) => {
      const wasActive = icon.classList.contains('active');
      const isActive = i < lives;

      icon.classList.toggle('active', isActive);

      // Trigger lost animation
      if (wasActive && !isActive) {
        icon.classList.add('lost');
        setTimeout(() => icon.classList.remove('lost'), 500);
      }
    });
  }

  /**
   * Update scoreboard display
   * @param {Array} ghosts - Array of ghost objects
   * @param {Object} scores - Score map {playerId: score}
   * @private
   */
  _updateScoreboard(ghosts, scores) {
    if (!ghosts) return;

    // Sort ghosts by score
    const sorted = [...ghosts].sort((a, b) => {
      const scoreA = scores?.[a.id] || a.score || 0;
      const scoreB = scores?.[b.id] || b.score || 0;
      return scoreB - scoreA;
    });

    let html = '';
    for (const ghost of sorted) {
      const score = scores?.[ghost.id] ?? ghost.score ?? 0;
      const isMe = ghost.id === this.myPlayerId;
      const name = ghost.username || `Player ${ghost.id.slice(-4)}`;

      html += `
        <div class="mp-score-entry ${isMe ? 'is-me' : ''}">
          <span class="mp-score-color" style="background: ${ghost.color || '#4488ff'}"></span>
          <span class="mp-score-name">${this._escapeHtml(name)}</span>
          <span class="mp-score-value">${score}</span>
        </div>
      `;
    }

    this.scoreboardEl.innerHTML = html;
  }

  /**
   * Show a game event message
   * @param {string} message - Event message
   * @param {string} [type='info'] - Event type (info, damage, claim, flip)
   */
  showEvent(message, type = 'info') {
    const eventEl = document.createElement('div');
    eventEl.className = `mp-event ${type}`;
    eventEl.textContent = message;

    this.eventsEl.appendChild(eventEl);
    this.eventMessages.push(eventEl);

    // Limit event count
    while (this.eventMessages.length > this.maxEvents) {
      const oldEvent = this.eventMessages.shift();
      if (oldEvent.parentNode) {
        oldEvent.parentNode.removeChild(oldEvent);
      }
    }

    // Auto-remove after delay
    setTimeout(() => {
      eventEl.classList.add('fading');
      setTimeout(() => {
        if (eventEl.parentNode) {
          eventEl.parentNode.removeChild(eventEl);
        }
        const idx = this.eventMessages.indexOf(eventEl);
        if (idx !== -1) {
          this.eventMessages.splice(idx, 1);
        }
      }, 300);
    }, 4000);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show countdown overlay
   * @param {number} seconds - Countdown seconds
   */
  showCountdown(seconds) {
    // Remove existing countdown
    const existing = this.container.querySelector('.mp-countdown-overlay');
    if (existing) existing.remove();

    if (seconds <= 0) return;

    const overlay = document.createElement('div');
    overlay.className = 'mp-countdown-overlay';
    overlay.innerHTML = `<div class="mp-countdown-value">${seconds}</div>`;

    // Add styles if not present
    if (!document.getElementById('mp-countdown-styles')) {
      const style = document.createElement('style');
      style.id = 'mp-countdown-styles';
      style.textContent = `
        .mp-countdown-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          z-index: 100;
        }

        .mp-countdown-value {
          font-size: 120px;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 0 40px rgba(68, 136, 255, 0.8);
          animation: countdown-pop 0.5s ease;
        }

        @keyframes countdown-pop {
          0% { transform: scale(1.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    this.container.appendChild(overlay);

    // Auto-remove
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 900);
  }

  /**
   * Clean up HUD resources
   */
  destroy() {
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }

    // Clear event messages
    this.eventMessages = [];
    this.timerEl = null;
    this.livesEl = null;
    this.scoreboardEl = null;
    this.eventsEl = null;
    this.hudElement = null;
  }
}

export default MultiplayerPanel;

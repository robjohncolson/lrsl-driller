/**
 * Time Tracker - Per-user session and problem time tracking
 * Tracks active time, idle detection, and syncs to server
 */

export class TimeTracker {
  constructor(config = {}) {
    this.serverUrl = config.serverUrl || null;
    this.username = null;
    this.sessionId = null;

    // Session tracking
    this.sessionStartTime = null;
    this.totalActiveTime = 0;
    this.lastActivityTime = null;

    // Problem tracking
    this.currentProblem = null;
    this.problemStartTime = null;
    this.problemActiveTime = 0;

    // Idle detection (30 seconds of no activity = idle)
    this.idleThresholdMs = 30000;
    this.isIdle = false;
    this.idleStartTime = null;

    // Sync settings
    this.syncIntervalMs = 60000; // Sync every 60 seconds
    this.syncTimer = null;
    this.pendingSync = false;

    // Activity listeners
    this.activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    this.boundActivityHandler = this.recordActivity.bind(this);

    // Visibility tracking
    this.boundVisibilityHandler = this.handleVisibility.bind(this);
  }

  /**
   * Start tracking for a user
   */
  start(username) {
    this.username = username;
    this.sessionId = `${username}-${Date.now()}`;
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.totalActiveTime = 0;
    this.isIdle = false;

    // Set up activity listeners
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.boundActivityHandler, { passive: true });
    });

    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);

    // Start sync timer
    this.syncTimer = setInterval(() => this.sync(), this.syncIntervalMs);

    // Start idle check
    this.idleCheckTimer = setInterval(() => this.checkIdle(), 5000);

    // Sync on page unload
    window.addEventListener('beforeunload', () => this.sync(true));

    console.log(`[TimeTracker] Started tracking for ${username}, session: ${this.sessionId}`);
  }

  /**
   * Stop tracking
   */
  stop() {
    // Final sync
    this.sync(true);

    // Clean up listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.boundActivityHandler);
    });
    document.removeEventListener('visibilitychange', this.boundVisibilityHandler);

    // Clear timers
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.idleCheckTimer) clearInterval(this.idleCheckTimer);

    console.log(`[TimeTracker] Stopped tracking. Total active time: ${this.formatTime(this.totalActiveTime)}`);
  }

  /**
   * Record user activity (resets idle)
   */
  recordActivity() {
    const now = Date.now();

    // If coming back from idle, don't count idle time
    if (this.isIdle) {
      this.isIdle = false;
      this.lastActivityTime = now;
      console.log('[TimeTracker] User returned from idle');
      return;
    }

    // Calculate time since last activity
    if (this.lastActivityTime) {
      const elapsed = now - this.lastActivityTime;

      // Only count if not too long (max 30 seconds between activities)
      if (elapsed < this.idleThresholdMs) {
        this.totalActiveTime += elapsed;

        if (this.problemStartTime && this.currentProblem) {
          this.problemActiveTime += elapsed;
        }
      }
    }

    this.lastActivityTime = now;
  }

  /**
   * Check if user has gone idle
   */
  checkIdle() {
    if (this.isIdle) return;

    const now = Date.now();
    const timeSinceActivity = now - this.lastActivityTime;

    if (timeSinceActivity >= this.idleThresholdMs) {
      this.isIdle = true;
      this.idleStartTime = this.lastActivityTime + this.idleThresholdMs;
      console.log('[TimeTracker] User went idle');
    }
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibility() {
    if (document.hidden) {
      // Tab hidden - treat as idle
      this.recordActivity(); // Record up to this point
      this.isIdle = true;
      this.idleStartTime = Date.now();
    } else {
      // Tab visible again
      this.lastActivityTime = Date.now();
      this.isIdle = false;
    }
  }

  /**
   * Start tracking a new problem
   */
  startProblem(problemId, cartridgeId, modeId) {
    // End previous problem if any
    if (this.currentProblem) {
      this.endProblem(false);
    }

    this.currentProblem = {
      id: problemId || `problem-${Date.now()}`,
      cartridgeId,
      modeId,
      startTime: Date.now()
    };
    this.problemStartTime = Date.now();
    this.problemActiveTime = 0;

    console.log(`[TimeTracker] Started problem: ${this.currentProblem.id}`);
  }

  /**
   * End current problem tracking
   */
  endProblem(completed = true, result = null) {
    if (!this.currentProblem) return null;

    // Record final activity
    this.recordActivity();

    const problemData = {
      problemId: this.currentProblem.id,
      cartridgeId: this.currentProblem.cartridgeId,
      modeId: this.currentProblem.modeId,
      activeTimeMs: this.problemActiveTime,
      totalTimeMs: Date.now() - this.currentProblem.startTime,
      completed,
      result
    };

    console.log(`[TimeTracker] Ended problem: ${this.currentProblem.id}, active time: ${this.formatTime(this.problemActiveTime)}`);

    // Save problem time
    this.saveProblemTime(problemData);

    // Reset
    this.currentProblem = null;
    this.problemStartTime = null;
    this.problemActiveTime = 0;

    return problemData;
  }

  /**
   * Save problem time to server
   */
  async saveProblemTime(problemData) {
    if (!this.serverUrl || !this.username) return;

    try {
      await fetch(`${this.serverUrl}/api/time-tracking/problem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          sessionId: this.sessionId,
          ...problemData
        })
      });
    } catch (err) {
      console.warn('[TimeTracker] Failed to save problem time:', err);
    }
  }

  /**
   * Sync session data to server
   */
  async sync(final = false) {
    if (!this.serverUrl || !this.username || this.pendingSync) return;

    this.pendingSync = true;

    // Record current activity time
    if (!this.isIdle) {
      this.recordActivity();
    }

    const sessionData = {
      username: this.username,
      sessionId: this.sessionId,
      sessionStartTime: new Date(this.sessionStartTime).toISOString(),
      activeTimeMs: this.totalActiveTime,
      totalTimeMs: Date.now() - this.sessionStartTime,
      isFinal: final
    };

    try {
      await fetch(`${this.serverUrl}/api/time-tracking/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      if (final) {
        console.log(`[TimeTracker] Final sync: ${this.formatTime(this.totalActiveTime)} active time`);
      }
    } catch (err) {
      console.warn('[TimeTracker] Failed to sync session:', err);
    }

    this.pendingSync = false;
  }

  /**
   * Get current stats
   */
  getStats() {
    // Ensure we have latest time
    if (!this.isIdle) {
      const now = Date.now();
      const elapsed = now - this.lastActivityTime;
      if (elapsed < this.idleThresholdMs) {
        return {
          sessionId: this.sessionId,
          activeTimeMs: this.totalActiveTime + elapsed,
          totalTimeMs: now - this.sessionStartTime,
          isIdle: this.isIdle,
          currentProblem: this.currentProblem ? {
            ...this.currentProblem,
            activeTimeMs: this.problemActiveTime + elapsed
          } : null
        };
      }
    }

    return {
      sessionId: this.sessionId,
      activeTimeMs: this.totalActiveTime,
      totalTimeMs: Date.now() - this.sessionStartTime,
      isIdle: this.isIdle,
      currentProblem: this.currentProblem ? {
        ...this.currentProblem,
        activeTimeMs: this.problemActiveTime
      } : null
    };
  }

  /**
   * Format milliseconds as human-readable time
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

export default TimeTracker;

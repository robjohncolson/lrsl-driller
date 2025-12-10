/**
 * Class Time Module - Teacher-controlled class session mode
 */

export class ClassTime {
  constructor(config = {}) {
    this.active = false;
    this.startTime = null;
    this.timerInterval = null;
    this.goal = config.defaultGoal || 3;
    this.starsEarned = 0;

    // Callbacks
    this.onStart = config.onStart || (() => {});
    this.onEnd = config.onEnd || (() => {});
    this.onGoalReached = config.onGoalReached || (() => {});
    this.onTimerUpdate = config.onTimerUpdate || (() => {});
    this.onStarEarned = config.onStarEarned || (() => {});

    // WebSocket client for broadcasting (set externally)
    this.wsClient = null;
  }

  /**
   * Set WebSocket client for broadcasting class time events
   */
  setWebSocketClient(client) {
    this.wsClient = client;
  }

  /**
   * Set goal (number of stars to earn)
   */
  setGoal(goal) {
    this.goal = goal;
  }

  /**
   * Start class time
   */
  start(broadcast = true) {
    if (this.active) return;

    this.active = true;
    this.startTime = Date.now();
    this.starsEarned = 0;

    // Start timer
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, 1000);

    // Broadcast to other users
    if (broadcast && this.wsClient) {
      this.wsClient.notifyClassTimeStart(this.goal);
    }

    this.onStart({
      goal: this.goal,
      startTime: this.startTime
    });
  }

  /**
   * End class time
   */
  end(broadcast = true) {
    if (!this.active) return;

    this.active = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    const duration = this.getElapsedTime();
    const results = {
      duration,
      starsEarned: this.starsEarned,
      goalReached: this.starsEarned >= this.goal
    };

    // Broadcast to other users
    if (broadcast && this.wsClient) {
      this.wsClient.notifyClassTimeEnd();
    }

    this.onEnd(results);

    // Reset
    this.startTime = null;
    this.starsEarned = 0;
  }

  /**
   * Record a star earned during class time
   */
  recordStar(starType) {
    if (!this.active) return;

    this.starsEarned++;
    this.onStarEarned({
      total: this.starsEarned,
      goal: this.goal,
      progress: Math.min(100, Math.floor((this.starsEarned / this.goal) * 100))
    });

    // Check if goal reached
    if (this.starsEarned === this.goal) {
      this.onGoalReached({
        starsEarned: this.starsEarned,
        duration: this.getElapsedTime()
      });
    }
  }

  /**
   * Update timer display
   */
  updateTimer() {
    const elapsed = this.getElapsedTime();
    this.onTimerUpdate(this.formatTime(elapsed));
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Format seconds as MM:SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get current progress percentage
   */
  getProgress() {
    if (this.goal === 0) return 100;
    return Math.min(100, Math.floor((this.starsEarned / this.goal) * 100));
  }

  /**
   * Check if class time is active
   */
  isActive() {
    return this.active;
  }

  /**
   * Create class time banner HTML
   */
  static createBannerHTML() {
    return `
      <div id="class-time-banner" class="hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white py-2 px-4 shadow-lg">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl animate-pulse">🔔</span>
            <div>
              <span class="font-bold">CLASS TIME ACTIVE</span>
              <span id="class-time-timer" class="ml-2 font-mono bg-white/20 px-2 py-0.5 rounded">00:00</span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm">Goal:</span>
              <div class="w-32 h-4 bg-white/30 rounded-full overflow-hidden">
                <div id="class-goal-bar" class="h-full bg-yellow-400 transition-all duration-500" style="width: 0%"></div>
              </div>
              <span class="text-sm font-bold">
                <span id="class-stars-earned">0</span>/<span id="class-goal-target">3</span> ⭐
              </span>
            </div>
            <button id="end-class-time-btn" class="hidden bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors">
              End Class
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Factory function
export function createClassTime(config) {
  return new ClassTime(config);
}

export default ClassTime;

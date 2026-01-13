/**
 * Pong Duel Configuration
 * Territory resolver minigame for Grid Wars
 *
 * v1.0: Initial implementation
 */

const PONG_CONFIG = {
  // ============================================
  // COURT DIMENSIONS
  // ============================================

  courtWidth: 600,
  courtHeight: 400,

  // ============================================
  // PADDLES
  // ============================================

  paddleWidth: 12,
  paddleBaseHeight: 80,           // Base paddle height in pixels
  paddleBonusPerCorrect: 5,       // +5px per correct answer in window
  paddleBonusMax: 20,             // Cap at +20px (max paddle = 100px)
  paddleSpeed: 7,                 // Pixels per tick
  paddleMargin: 20,               // Distance from edge

  // Recent correct answer window for paddle bonus
  recentCorrectWindowMinutes: 10, // Look back 10 minutes

  // ============================================
  // BALL
  // ============================================

  ballSize: 14,
  ballSpeedInitial: 5,
  ballSpeedIncrement: 0.3,        // Speed increase each hit
  ballSpeedMax: 10,

  // ============================================
  // MATCH RULES
  // ============================================

  pointsToWin: 3,                 // First to 3 wins
  countdownSeconds: 3,            // Countdown before match starts
  maxDurationSeconds: 90,         // Sudden death after this

  // ============================================
  // TOKEN ECONOMY
  // ============================================

  tokenCostPerDuel: 1,            // Tokens spent to challenge
  maxTokens: 5,                   // Can't hoard more than 5

  // Token sources
  tokenSources: {
    startingTokens: 2,            // New players start with 2 tokens
    rentPerToken: 20,             // 1 token per 20 pts rent collected
    correctAnswersPerToken: 10,   // 1 token per 10 correct answers
    duelWinBonus: 1,              // Win a duel = +1 token
  },

  // Legacy aliases for backward compatibility
  rentPerToken: 20,               // Earn 1 token per 20 pts rent collected
  startingTokens: 2,              // New players start with 2 tokens

  // ============================================
  // ECONOMY / PAYOUTS
  // ============================================

  loserConsolationPercent: 0.50,  // Loser gets 50% of attack cost

  // ============================================
  // RATE LIMITING
  // ============================================

  maxDuelsPerPlayer: 2,           // Per cooldown window
  duelCooldownMinutes: 10,        // Cooldown window duration
  challengeTimeoutSeconds: 30,    // Auto-decline after 30s

  // ============================================
  // CONTROLS
  // ============================================

  // Keyboard controls
  upKeys: ['w', 'W', 'ArrowUp'],
  downKeys: ['s', 'S', 'ArrowDown'],

  // Mobile touch zones (percentages of screen height)
  touchZones: {
    upZoneEnd: 0.5,               // Top 50% = UP
    downZoneStart: 0.5,           // Bottom 50% = DOWN
  },

  // ============================================
  // NETWORKING
  // ============================================

  serverTickRate: 30,             // Server physics updates per second
  clientTickRate: 60,             // Client render rate
  inputThrottleMs: 16,            // Min ms between input sends (~60Hz)

  // ============================================
  // SOUNDS (oscillator frequencies in Hz)
  // ============================================

  sounds: {
    hit: { frequency: 440, duration: 0.05, type: 'square' },
    score: { frequency: 660, duration: 0.15, type: 'sine' },
    win: { frequencies: [523, 659, 784], duration: 0.3, type: 'sine' },
    lose: { frequencies: [294, 247], duration: 0.4, type: 'sine' },
  },

  // ============================================
  // VISUALS
  // ============================================

  colors: {
    background: '#0a0a1a',
    centerLine: '#333',
    ball: '#ffffff',
    scoreText: '#00ffff',
    timerNormal: '#888888',
    timerWarning: '#ff0000',      // Last 10 seconds
    countdownText: '#00ffff',
    victoryText: '#00ff00',
    defeatText: '#ff0000',
    consolationText: '#00ff00',
  },

  // Spectator mini-view dimensions
  spectatorWidth: 200,
  spectatorHeight: 133,

  // ============================================
  // TEACHER CONTROLS
  // ============================================

  // Default enabled state (can be toggled by teacher)
  duelsEnabledByDefault: true,
};


// ES Module export (for client/Vite)
export { PONG_CONFIG };
export default PONG_CONFIG;

// CommonJS export (for server/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PONG_CONFIG };
}

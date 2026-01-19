/**
 * Linear CTF (Capture The Flag) Configuration
 *
 * A simple tug-of-war game where two teams compete to push the
 * front line toward the enemy flag by earning points through drilling.
 */

export const CTF_CONFIG = {
  // Lane configuration
  laneLength: 21,           // Positions 0-20
  startPosition: 10,        // Front line starts at center
  blueFlag: 0,              // Blue flag at position 0
  redFlag: 20,              // Red flag at position 20

  // Points required to move front line 1 position
  pointsPerMove: 20,

  // Star point values (same as weighted scoring, simplified)
  starPoints: {
    gold: 4,
    silver: 3,
    bronze: 2,
    tin: 1
  },

  // Canvas rendering
  cellWidth: 40,
  cellHeight: 60,
  padding: 20,

  // Colors
  colors: {
    blue: '#3b82f6',        // Tailwind blue-500
    red: '#ef4444',         // Tailwind red-500
    blueDark: '#1d4ed8',    // Tailwind blue-700
    redDark: '#b91c1c',     // Tailwind red-700
    neutral: '#6b7280',     // Tailwind gray-500
    frontLine: '#fbbf24',   // Tailwind amber-400
    background: '#1f2937',  // Tailwind gray-800
    text: '#f9fafb',        // Tailwind gray-50
    warning: '#f59e0b',     // Tailwind amber-500
    danger: '#dc2626'       // Tailwind red-600
  },

  // Session settings
  sessionCheckIntervalMs: 10000,     // Check sessions every 10s
  warningMinutes: [5, 1],            // Warn at 5min and 1min remaining

  // Dead zone (tiebreaker trigger) - positions 9, 10, 11 (center +/- 1)
  deadZoneMin: 9,
  deadZoneMax: 11,

  // Tiebreaker settings
  readyCheckTimeoutMs: 30000,        // 30s to confirm ready
  championsPerTeam: 3,
  matchesToWin: 2,                   // Best of 3

  // Pong settings
  pongPointsToWin: 5,
  pongCanvasWidth: 400,
  pongCanvasHeight: 300,
  pongPaddleHeight: 60,
  pongPaddleWidth: 10,
  pongBallRadius: 4,
  pongBallSpeed: 4,
  pongPaddleSpeed: 5,

  // Valid class periods
  validPeriods: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
};

// CommonJS export for server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CTF_CONFIG };
}

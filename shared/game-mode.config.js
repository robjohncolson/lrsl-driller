/**
 * Game Mode & Tiebreaker Configuration
 *
 * Shared configuration for all game modes (CTF, King of the Hill)
 * and tiebreaker minigames (Pong, Quick Calc, Reflex Duel).
 */

export const GAME_MODE_CONFIG = {
  // Game mode types
  modes: {
    CTF: 'ctf',
    KOTH: 'koth'
  },

  // Tiebreaker types
  tiebreakers: {
    PONG: 'pong',
    QUICK_CALC: 'quick_calc',
    REFLEX_DUEL: 'reflex_duel'
  },

  // Default settings
  defaults: {
    gameMode: 'ctf',
    tiebreakerType: 'pong'
  },

  // King of the Hill specific settings
  koth: {
    // Rolling window configuration
    windowDurationMs: 7 * 60 * 1000,  // 7 minutes total
    fullWeightMs: 3 * 60 * 1000,      // 0-3 min: 100% weight
    decayStartMs: 3 * 60 * 1000,      // 3-5 min: decay starts
    decayMidMs: 5 * 60 * 1000,        // At 5 min: 50% weight
    minDecayWeight: 0,                 // Points fully expire at 7 min

    // Hill control
    controlCheckIntervalMs: 1000,      // Check hill control every second
    bankingIntervalMs: 1000,           // Bank 1 second per second of control

    // Tiebreaker threshold
    tiebreakerThresholdSeconds: 30,    // Within 30 sec = tiebreaker

    // Star point values (same as CTF)
    starPoints: {
      gold: 4,
      silver: 3,
      bronze: 2,
      tin: 1
    },

    // Rendering
    canvasWidth: 400,
    canvasHeight: 200,
    hillRadius: 50,

    // Colors
    colors: {
      blue: '#3b82f6',
      red: '#ef4444',
      blueGlow: 'rgba(59, 130, 246, 0.4)',
      redGlow: 'rgba(239, 68, 68, 0.4)',
      neutral: '#6b7280',
      background: '#1f2937',
      hillStroke: '#fbbf24',
      text: '#f9fafb',
      decayBar: '#9ca3af',
      progressBlue: '#60a5fa',
      progressRed: '#f87171'
    }
  },

  // Quick Calc minigame settings
  quickCalc: {
    pointsToWin: 5,
    lockoutMs: 1000,           // 1 second lockout on wrong answer
    timeoutMs: 15000,          // 15 seconds per problem
    minNumber: 10,             // Two-digit numbers: 10-99
    maxNumber: 99,
    operations: ['+', '-', '*'],
    canvasWidth: 400,
    canvasHeight: 300,

    // Colors
    colors: {
      background: '#111827',
      text: '#f9fafb',
      problem: '#fbbf24',
      correct: '#10b981',
      incorrect: '#ef4444',
      lockout: '#6b7280',
      blue: '#3b82f6',
      red: '#ef4444',
      timer: '#9ca3af'
    }
  },

  // Reflex Duel minigame settings
  reflexDuel: {
    pointsToWin: 5,
    minDelayMs: 1500,          // Random delay 1.5-4 seconds
    maxDelayMs: 4000,
    tieThresholdMs: 20,        // Within 20ms = tie/redraw
    canvasWidth: 400,
    canvasHeight: 300,
    flashDurationMs: 100,

    // Colors
    colors: {
      background: '#111827',
      waiting: '#374151',
      ready: '#fbbf24',
      flash: '#10b981',
      early: '#ef4444',
      text: '#f9fafb',
      blue: '#3b82f6',
      red: '#ef4444'
    }
  },

  // Display labels
  labels: {
    modes: {
      ctf: 'Capture The Flag',
      koth: 'King of the Hill'
    },
    tiebreakers: {
      pong: 'Pong',
      quick_calc: 'Quick Calc',
      reflex_duel: 'Reflex Duel'
    },
    modesShort: {
      ctf: 'CTF',
      koth: 'KotH'
    }
  },

  // Valid class periods (shared with CTF)
  validPeriods: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],

  // Best-of series settings
  series: {
    matchesToWin: 2,          // Best of 3
    readyCheckTimeoutMs: 30000, // 30s to confirm ready
    championsPerTeam: 3
  }
};

// CommonJS export for server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GAME_MODE_CONFIG };
}

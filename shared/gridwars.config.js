/**
 * Grid Wars Configuration
 * Centralized config for both client and server
 *
 * v1.2.1: Added 3-tier activity pricing, boot bonus, visual dimming settings
 */

const GRID_WARS_CONFIG = {
  // ============================================
  // COSTS
  // ============================================

  // Claiming neutral territory
  claimCost: 10,

  // Claiming enemy territory (activity-based pricing)
  // v1.2.1: 3-tier system based on defender's last_answer_at
  takeoverCostCold: 15,      // >10min since defender's last answer
  takeoverCostWarm: 20,      // 2-10min since defender's last answer
  takeoverCostActive: 25,    // <2min since defender's last answer

  // Legacy aliases for backward compatibility
  takeoverCostBase: 15,      // Alias for takeoverCostCold

  // Special cells
  nodeClaimCost: 15,         // Resource nodes cost more
  surgeCost: 5,              // Surge cells cost less

  // ============================================
  // ACTIVITY WINDOWS (seconds)
  // ============================================

  // v1.3: Adjusted windows for pedagogical reality
  activeWindowSeconds: 180,   // <3min = ACTIVE (highest protection)
  warmWindowSeconds: 480,     // 3-8min = WARM (medium protection)
  // >8min = COLD (no protection)

  // Legacy alias
  activeDrillingWindow: 120,  // Updated from 60 to 120 for v1.2.1

  // ============================================
  // BOOT BONUS (v1.2.1)
  // ============================================

  bootBonus: 15,              // Points given to new players on join

  // ============================================
  // VISUAL DIMMING (v1.2.1)
  // ============================================

  // Client-side visual feedback for inactive territories
  dimmingMinOpacity: 0.3,     // Minimum opacity (at max fade)
  dimmingFadeMinutes: 15,     // Time to reach minimum opacity

  // ============================================
  // STAR POINTS
  // ============================================

  starPoints: {
    gold: 4,
    silver: 3,
    bronze: 2,
    tin: 1
  },

  // ============================================
  // MAP SETTINGS
  // ============================================

  mapSize: 20,
  maxCellStrength: 3,         // Initial and max strength

  // ============================================
  // CLASS GOAL
  // ============================================

  classGoalTarget: 200,
  classGoalBonus: 10,         // Points awarded to all when reached

  // ============================================
  // CONTIGUITY BONUS
  // ============================================

  maxContiguityBonus: 5,      // Max bonus from connected territory

  // ============================================
  // DECAY SETTINGS
  // ============================================

  decayIntervalMs: 60000,     // Isolated cells lose 1 strength per minute
  isolatedDecayStrength: 1,   // Strength lost per decay tick

  // ============================================
  // HEALTH SETTINGS
  // ============================================

  healthMax: 100,
  healthDrainNeutral: 2,      // HP/sec on unclaimed land
  healthDrainEnemy: 5,        // HP/sec on enemy territory
  healthRegenHome: 5,         // HP/sec on own territory

  // ============================================
  // BUFF DURATIONS
  // ============================================

  beaconDuration: 300,        // 5 minutes
  anchorDuration: 180,        // 3 minutes
  amplifierCharges: 5,        // Number of bonus answers
  amplifierBonus: 3,          // Bonus points per answer

  // ============================================
  // SURGE SETTINGS
  // ============================================

  surgeDuration: 90,          // Seconds surge cell lasts

  // ============================================
  // RESOURCE NODE POSITIONS
  // ============================================

  nodePositions: [
    { x: 10, y: 10, type: 'amplifier' },  // Center
    { x: 4, y: 4, type: 'amplifier' },    // Top-left quadrant
    { x: 15, y: 15, type: 'amplifier' }   // Bottom-right quadrant
  ],

  // ============================================
  // NETWORK SETTINGS
  // ============================================

  tickIntervalMs: 5000,       // Server tick: 5 seconds
  broadcastThrottleMs: 500,   // Max 2 broadcasts per second for grid updates

  // ============================================
  // v1.3: SPAM PREVENTION
  // ============================================

  spamWindowSeconds: 60,      // Rolling window for wrong answer tracking
  spamThreshold: 3,           // Wrong answers in window to trigger cooldown
  spamCooldownSeconds: 30,    // Cooldown duration (blocks drill submissions)

  // ============================================
  // v1.3: SOFT POINT CEILING
  // ============================================

  // Logarithmic cost scaling to prevent runaway point accumulation
  pointCeilingEnabled: true,
  pointCeilingScaleFactor: 0.1,  // Multiplier for log10(points)
  pointCeilingMinPoints: 10,     // Minimum points before scaling applies
  // Formula: effectiveCost = baseCost * (1 + 0.1 * log10(max(playerPoints, 10)))
  // At 10 pts:   scale = 1.1x  (10 → 11)
  // At 100 pts:  scale = 1.2x  (10 → 12)
  // At 1000 pts: scale = 1.3x  (10 → 13)

  // ============================================
  // v1.3: AFK EROSION
  // ============================================

  // Edge cells of inactive players erode over time
  afkThresholdSeconds: 900,      // 15 minutes of inactivity
  afkErosionIntervalMs: 60000,   // Check/erode every 1 minute
  afkErosionStrength: 1,         // Strength lost per erosion tick

  // ============================================
  // v1.3: TELEMETRY
  // ============================================

  telemetryEnabled: true,
  telemetryFlushIntervalMs: 300000,  // Flush every 5 minutes

  // ============================================
  // v1.3.1: AUTO-SURGE ON STAGNATION
  // ============================================

  autoSurgeEnabled: true,
  autoSurgeFillThreshold: 0.85,        // Map fill % to trigger (85%)
  autoSurgeChurnThreshold: 5,          // cells_changed_5min below this
  autoSurgeCellCount: 2,               // Number of surge cells to spawn
  autoSurgeCooldownMs: 10 * 60 * 1000, // 10 minutes between auto-surges
  autoSurgeCheckIntervalMs: 60 * 1000, // Check every minute

  // ============================================
  // v1.3.1: UNDERDOG ASSIST
  // ============================================

  underdogEnabled: true,
  underdogDiscount: 0.5,               // 50% off next claim
  underdogMinCost: 5,                  // Floor for discounted claim
  underdogActivityWindowMs: 3 * 60 * 1000, // Must have answered in last 3 min
  underdogCooldownMs: 5 * 60 * 1000,   // Can only trigger once per 5 min

  // ============================================
  // v1.4: ACTIVITY REQUIREMENT FOR CLAIMS
  // ============================================

  // Players must have answered a drill question within this window to claim
  uplinkRequiredSeconds: 600,          // 10 minutes

  // ============================================
  // v1.4: DIMINISHING RETURNS
  // ============================================

  // Scale earning efficiency inversely with empire size
  diminishingReturnsEnabled: true,
  diminishingReturnsThreshold: 25,     // Cells before penalty starts
  diminishingReturnsMinMultiplier: 0.5, // Floor at 50% earning rate
  diminishingReturnsFactor: 0.005,     // Reduction per excess cell
  // Formula: multiplier = max(0.5, 1 - (excess * 0.005))
  // 25 cells = 1.0x, 50 cells = 0.875x, 75 cells = 0.75x, 125+ cells = 0.5x

  // ============================================
  // v1.4: ROUND SYSTEM
  // ============================================

  rounds: {
    enabled: false,                    // Toggle round system
    warningMinutes: 2,                 // Show ENDING status this many mins before end
  },

  victoryConditions: {
    domination: {
      threshold: 80,                   // First to X cells wins
      enabled: true,
    },
    timed: {
      durationMinutes: 45,             // Round duration
      enabled: false,
    },
    collaborative: {
      target: 300,                     // Class collectively owns X cells
      enabled: false,
    },
  },

  legacyBonus: {
    winner: 5,                         // Points for 1st place in next round
    top3: 3,                           // Points for 2nd-3rd place
  },

  // ============================================
  // v1.4: SCOUTING REPORT THRESHOLDS
  // ============================================

  scoutingThresholds: {
    highLifetime: 100,                 // Above this = high earner
    lowLifetime: 30,                   // Below this = low earner
    highCells: 15,                     // Above this = high territory
    lowCells: 3,                       // Below this = low territory
  },
};

// ES Module export (for client/Vite)
export { GRID_WARS_CONFIG };
export default GRID_WARS_CONFIG;

// CommonJS export (for server/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID_WARS_CONFIG };
}

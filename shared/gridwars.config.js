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
};

// ES Module export (for client/Vite)
export { GRID_WARS_CONFIG };
export default GRID_WARS_CONFIG;

// CommonJS export (for server/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID_WARS_CONFIG };
}

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

  // v1.2.1: Expanded from 60s binary to 3-tier system
  activeWindowSeconds: 120,   // <2min = ACTIVE (highest protection)
  warmWindowSeconds: 600,     // 2-10min = WARM (medium protection)
  // >10min = COLD (no protection)

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
};

// ES Module export (for client/Vite)
export { GRID_WARS_CONFIG };
export default GRID_WARS_CONFIG;

// CommonJS export (for server/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID_WARS_CONFIG };
}

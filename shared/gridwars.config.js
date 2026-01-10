/**
 * Grid Wars Configuration
 * Centralized config for both client and server
 *
 * v1.2.1: Added 3-tier activity pricing, boot bonus, visual dimming settings
 * v1.5: Bitcoin model - 3x cost inflation, permanent economy
 */

const GRID_WARS_CONFIG = {
  // ============================================
  // COSTS (v1.5: 3x inflation for scarcity economy)
  // ============================================

  // Claiming neutral territory
  claimCost: 30,                   // was 10

  // Claiming enemy territory (activity-based pricing)
  // v1.2.1: 3-tier system based on defender's last_answer_at
  takeoverCostCold: 45,            // was 15, >8min since defender's last answer
  takeoverCostWarm: 60,            // was 20, 3-8min since defender's last answer
  takeoverCostActive: 75,          // was 25, <3min since defender's last answer

  // Legacy aliases for backward compatibility
  takeoverCostBase: 45,            // was 15, alias for takeoverCostCold

  // Special cells
  nodeClaimCost: 45,               // was 15, resource nodes cost more (3x)
  surgeCost: 15,                   // was 5, surge cells cost less (3x)

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
  // BOOT BONUS (v1.2.1, v1.5: 3x inflation)
  // ============================================

  bootBonus: 45,              // was 15, points given to new players on join

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
  // MAP SETTINGS (v1.5: expanded to 25x25)
  // ============================================

  mapSize: 25,                // was 20, now 625 total cells
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
  // RESOURCE NODE POSITIONS (v1.5: adjusted for 25x25)
  // ============================================

  nodePositions: [
    { x: 12, y: 12, type: 'amplifier' },  // Center
    { x: 5, y: 5, type: 'amplifier' },    // Top-left quadrant
    { x: 19, y: 19, type: 'amplifier' },  // Bottom-right quadrant
    { x: 5, y: 19, type: 'amplifier' },   // Bottom-left quadrant (NEW)
    { x: 19, y: 5, type: 'amplifier' }    // Top-right quadrant (NEW)
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
  // v1.3: AFK EROSION (v1.5: 24hr grace, daily decay)
  // ============================================

  // v1.5: Changed from 15min/strength-decay to 24hr grace/cell-decay
  // Old v1.3 settings (kept for reference):
  // afkThresholdSeconds: 900,      // 15 minutes of inactivity
  // afkErosionIntervalMs: 60000,   // Check/erode every 1 minute
  // afkErosionStrength: 1,         // Strength lost per erosion tick

  // v1.5: New decay model - cells return to neutral after grace period
  afkGracePeriodHours: 24,         // No decay for first 24 hours of inactivity
  afkDecayCellsPerDay: 1,          // Lose 1 edge cell per day after grace period
  afkDecayCheckIntervalMs: 3600000, // Check hourly (was 60000)
  afkDecayTarget: 'neutral',       // Cells return to unclaimed (not strength loss)

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
  // v1.3.1: UNDERDOG ASSIST (v1.5: scaled floor)
  // ============================================

  underdogEnabled: true,
  underdogDiscount: 0.5,               // 50% off next claim
  underdogMinCost: 15,                 // was 5, floor for discounted claim (3x)
  underdogActivityWindowMs: 3 * 60 * 1000, // Must have answered in last 3 min
  underdogCooldownMs: 5 * 60 * 1000,   // Can only trigger once per 5 min

  // ============================================
  // v1.4: ACTIVITY REQUIREMENT FOR CLAIMS
  // ============================================

  // Players must have answered a drill question within this window to claim
  uplinkRequiredSeconds: 600,          // 10 minutes

  // ============================================
  // v1.4: DIMINISHING RETURNS (v1.5: scaled for 25x25 map)
  // ============================================

  // Scale earning efficiency inversely with empire size
  diminishingReturnsEnabled: true,
  diminishingReturnsThreshold: 75,     // was 25, now ~12% of 625 cells
  diminishingReturnsMinMultiplier: 0.5, // Floor at 50% earning rate
  diminishingReturnsFactor: 0.004,     // was 0.005, slightly reduced for larger threshold
  // Formula: multiplier = max(0.5, 1 - (excess * 0.004))
  // 75 cells = 1.0x, 100 cells = 0.9x, 125 cells = 0.8x, 200+ cells = 0.5x

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

  // ============================================
  // v1.5: MINIMUM POINTS FLOOR
  // ============================================

  // Every answer awards at least this many points
  minimumPointsPerAnswer: 1,

  // ============================================
  // v1.5: SCARCITY PRICING
  // ============================================

  // Dynamic neutral claim costs based on map fill percentage
  scarcityEnabled: true,
  scarcityPhases: {
    EXPANSION:  { maxFill: 0.50, multiplier: 1.0, message: '🌱 Land Rush' },
    TENSION:    { maxFill: 0.80, multiplier: 1.6, message: '⚡ Territory Tightening' },
    SCARCITY:   { maxFill: 0.95, multiplier: 2.2, message: '🔥 Prime Real Estate Gone' },
    SATURATION: { maxFill: 1.00, multiplier: 3.0, message: '💎 Last Parcels' },
  },
  // When map is 100% full:
  scarcityFullMessage: '⚔️ ALL TERRITORY CLAIMED — Only Conquest Remains',

  // ============================================
  // v1.5: VELOCITY STRIKE (points/min attack bonus)
  // ============================================

  velocityEnabled: true,
  velocityWindowMinutes: 10,           // Calculate velocity over last 10 min
  velocityTiers: {
    BLAZING: { min: 2.0, discount: 0.40, message: '🔥 BLAZING (40% off)' },
    FLOWING: { min: 1.0, discount: 0.25, message: '⚡ FLOWING (25% off)' },
    ACTIVE:  { min: 0.5, discount: 0.10, message: '💧 ACTIVE (10% off)' },
    IDLE:    { min: 0,   discount: 0,    message: '❄️ IDLE (no bonus)' },
  },

  // ============================================
  // v1.5: GUERRILLA WARFARE (small vs large bonus)
  // ============================================

  guerrillaEnabled: true,
  guerrillaTiers: [
    { attackerMax: 10, defenderMin: 50, discount: 0.50, message: '⚔️ Guerrilla Strike! (50% off)' },
    { attackerMax: 20, defenderMin: 75, discount: 0.40, message: '⚔️ Guerrilla Raid (40% off)' },
    { attackerMax: 30, defenderMin: 100, discount: 0.30, message: '⚔️ Guerrilla Ambush (30% off)' },
  ],

  // ============================================
  // v1.5: OVEREXTENSION PENALTY (defense discount on isolated cells)
  // ============================================

  overextensionEnabled: true,
  overextensionIsolatedDiscount: 0.30,  // 30% cheaper to attack isolated cells
  overextensionEdgeDiscount: 0.15,      // 15% cheaper to attack edge cells
  overextensionClusterThreshold: 3,     // Cells with <= 3 connected = isolated

  // ============================================
  // v1.5: AUTO-BOUNTY SYSTEM (target dominant players)
  // ============================================

  bountyEnabled: true,
  bountyThresholdPercent: 0.20,        // 20% of map (125 cells on 25x25)
  bountyBonusPoints: 15,               // Bonus points for taking bounty cell
  bountyCheckIntervalMs: 60000,        // Check for bounty targets every minute
};


// ES Module export (for client/Vite)
export { GRID_WARS_CONFIG };
export default GRID_WARS_CONFIG;

// CommonJS export (for server/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID_WARS_CONFIG };
}

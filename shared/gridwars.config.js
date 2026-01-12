/**
 * Grid Wars Configuration
 * Centralized config for both client and server
 *
 * v1.2.1: Added 3-tier activity pricing, boot bonus, visual dimming settings
 * v1.5: Bitcoin model - 3x cost inflation, permanent economy
 * v1.6: Radical simplification - 8x8 map, single leaderboard, no nodes
 * v2.0: Hierarchical subdivision - develop/drill mechanics, fractal grid
 */

const GRID_WARS_CONFIG = {
  // ============================================
  // COSTS (v1.6: rebalanced for 8x8 extreme scarcity)
  // ============================================

  // Claiming neutral territory
  claimCost: 40,                   // was 30 (v1.5), 10 (original)

  // Claiming enemy territory (activity-based pricing)
  // v1.2.1: 3-tier system based on defender's last_answer_at
  takeoverCostCold: 60,            // was 45, >8min since defender's last answer
  takeoverCostWarm: 80,            // was 60, 3-8min since defender's last answer
  takeoverCostActive: 100,         // was 75, <3min since defender's last answer

  // Legacy aliases for backward compatibility
  takeoverCostBase: 60,            // alias for takeoverCostCold

  // Special cells (v1.6: nodes disabled, but keep for schema)
  nodeClaimCost: 60,               // unused in v1.6
  surgeCost: 20,                   // was 15

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
  // BOOT BONUS (v1.6: reduced for extreme scarcity)
  // ============================================

  bootBonus: 30,              // was 45, reduced so new players can't claim immediately

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
  // MAP SETTINGS (v1.6: radical 8x8 for extreme scarcity)
  // ============================================

  mapSize: 8,                 // was 25, now 64 total cells (41 students, not all can own)
  maxCellStrength: 3,         // Initial and max strength

  // v1.6: Fractal future support
  maxLevel: 0,                // Level 0 = macro cells, Level 1 = subdivided (future)
  subdivisionSize: 8,         // Each cell can become 8×8 in future

  // ============================================
  // CLASS GOAL (v1.6: adjusted for 64 cells)
  // ============================================

  classGoalTarget: 50,        // was 200, now 78% of 64 cells
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
  // RESOURCE NODE POSITIONS (v1.6: DISABLED - no special cells)
  // ============================================

  nodePositions: [],          // v1.6: Empty - no resource nodes on 8x8 map
  nodesEnabled: false,        // v1.6: Explicitly disabled

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
  // v1.3.1: AUTO-SURGE ON STAGNATION (v1.6: disabled for 8x8)
  // ============================================

  autoSurgeEnabled: false,             // v1.6: Disabled - map too small for surge mechanics
  autoSurgeFillThreshold: 0.85,        // Map fill % to trigger (85%)
  autoSurgeChurnThreshold: 5,          // cells_changed_5min below this
  autoSurgeCellCount: 1,               // was 2
  autoSurgeCooldownMs: 10 * 60 * 1000, // 10 minutes between auto-surges
  autoSurgeCheckIntervalMs: 60 * 1000, // Check every minute

  // ============================================
  // v1.3.1: UNDERDOG ASSIST (v1.6: first claim only)
  // ============================================

  underdogEnabled: true,
  underdogDiscount: 0.5,               // 50% off first claim if 0 cells
  underdogMinCost: 20,                 // was 15, floor for discounted claim
  underdogActivityWindowMs: 3 * 60 * 1000, // Must have answered in last 3 min
  underdogCooldownMs: 5 * 60 * 1000,   // Can only trigger once per 5 min

  // ============================================
  // v1.4: ACTIVITY REQUIREMENT FOR CLAIMS
  // ============================================

  // Players must have answered a drill question within this window to claim
  uplinkRequiredSeconds: 600,          // 10 minutes

  // ============================================
  // v1.4: DIMINISHING RETURNS (v1.6: steep curve for 8x8 map)
  // ============================================

  // Scale earning efficiency inversely with empire size
  diminishingReturnsEnabled: true,
  diminishingReturnsThreshold: 8,      // was 75, now ~12.5% of 64 cells
  diminishingReturnsMinMultiplier: 0.5, // Floor at 50% earning rate
  diminishingReturnsFactor: 0.05,      // was 0.004, steeper curve for smaller map
  // Formula: multiplier = max(0.5, 1 - (excess * 0.05))
  // 8 cells = 1.0x, 12 cells = 0.8x, 16 cells = 0.6x, 18+ cells = 0.5x floor

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
  // v1.4: SCOUTING REPORT THRESHOLDS (v1.6: scaled for 64 cells)
  // ============================================

  scoutingThresholds: {
    highLifetime: 100,                 // Above this = high earner
    lowLifetime: 30,                   // Below this = low earner
    highCells: 8,                      // was 15, now 12.5% of 64 = high territory
    lowCells: 2,                       // was 3, now ~3% of 64 = low territory
  },

  // ============================================
  // v1.5: MINIMUM POINTS FLOOR
  // ============================================

  // Every answer awards at least this many points
  minimumPointsPerAnswer: 1,

  // ============================================
  // v1.5: SCARCITY PRICING (v1.6: faster curve for 8x8)
  // ============================================

  // Dynamic neutral claim costs based on map fill percentage
  scarcityEnabled: true,
  scarcityPhases: {
    EXPANSION:  { maxFill: 0.30, multiplier: 1.0, message: '🌱 Land Rush' },      // 0-19 cells
    TENSION:    { maxFill: 0.60, multiplier: 1.5, message: '⚡ Territory Tightening' }, // 20-38 cells
    SCARCITY:   { maxFill: 0.85, multiplier: 2.0, message: '🔥 Prime Real Estate Gone' }, // 39-54 cells
    SATURATION: { maxFill: 1.00, multiplier: 3.0, message: '💎 Last Parcels' },   // 55-64 cells
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
  // v1.5: GUERRILLA WARFARE (v1.6: scaled for 64 cells)
  // ============================================

  guerrillaEnabled: true,
  guerrillaTiers: [
    { attackerMax: 2, defenderMin: 10, discount: 0.50, message: '⚔️ Guerrilla Strike! (50% off)' },
    { attackerMax: 4, defenderMin: 15, discount: 0.40, message: '⚔️ Guerrilla Raid (40% off)' },
    { attackerMax: 6, defenderMin: 20, discount: 0.30, message: '⚔️ Guerrilla Ambush (30% off)' },
  ],

  // ============================================
  // v1.5: OVEREXTENSION PENALTY (defense discount on isolated cells)
  // ============================================

  overextensionEnabled: true,
  overextensionIsolatedDiscount: 0.30,  // 30% cheaper to attack isolated cells
  overextensionEdgeDiscount: 0.15,      // 15% cheaper to attack edge cells
  overextensionClusterThreshold: 3,     // Cells with <= 3 connected = isolated

  // ============================================
  // v1.5: AUTO-BOUNTY SYSTEM (v1.6: scaled for 64 cells)
  // ============================================

  bountyEnabled: true,
  bountyThresholdPercent: 0.20,        // 20% of map (13 cells on 8x8)
  bountyBonusPoints: 10,               // was 15, reduced for smaller economy
  bountyCheckIntervalMs: 60000,        // Check for bounty targets every minute

  // ============================================
  // v1.6: PRESENCE TRACKING
  // ============================================

  presenceHeartbeatMs: 30000,          // Client heartbeat every 30 seconds
  presenceStaleThresholdMs: 300000,    // Remove after 5 minutes of no heartbeat
  presencePruneIntervalMs: 60000,      // Check for stale presence every minute

  // ============================================
  // v2.0: HIERARCHICAL SUBDIVISION
  // ============================================

  // Master toggle for subdivision features
  hierarchyEnabled: true,
  maxSubdivisionLevel: 2,              // Max depth: d5.c3.a1 = 3 levels total (0, 1, 2)

  // Development (owner subdivides their cell)
  developmentCost: 100,                // Points to subdivide a cell you own
  ownerRetentionCells: ['d4', 'd5', 'e4', 'e5'],  // Center 4 cells owner keeps

  // Drilling (attacker forces subdivision)
  drillCost: 75,                       // Points to force-subdivide an enemy cell
  drillSaturationThreshold: 85,        // Map must be 85%+ full to allow drilling
  attackerDrillCell: 'a1',             // Corner cell attacker gets

  // Subcell economy (1/4 of macro costs)
  subcellClaimCost: 10,                // Base cost to claim neutral subcell
  subcellTakeoverCostCold: 15,         // Subcell takeover: >8min inactive
  subcellTakeoverCostWarm: 20,         // Subcell takeover: 3-8min inactive
  subcellTakeoverCostActive: 25,       // Subcell takeover: <3min active

  // ============================================
  // v2.2.5: DEVELOPMENT INCENTIVES
  // ============================================

  // Landlord Tax: Developer earns rent when others claim/attack inside their territory
  landlordTaxRate: 0.20,               // 20% of claim/attack cost goes to landlord
  landlordTaxMinimum: 1,               // Minimum 1 point (prevents zero rent)

  // Fortification: Attacks inside someone else's developed cell cost more
  fortificationMultiplier: 1.25,       // +25% attack cost inside enemy's developed territory

  // ============================================
  // v2.2.6: HOSTILE TAKEOVER
  // ============================================

  // Attack a developed macro cell to become its new landlord
  // Subcells are unchanged; only macro ownership transfers
  hostileTakeoverBaseCost: 150,        // Base cost to seize a developed cell
};


// ES Module export (for client/Vite)
export { GRID_WARS_CONFIG };
export default GRID_WARS_CONFIG;

// CommonJS export (for server/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GRID_WARS_CONFIG };
}

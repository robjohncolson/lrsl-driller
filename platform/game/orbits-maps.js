/**
 * Ghost Orbits - Map Definitions
 *
 * Centralized map configurations for different arena layouts.
 * Maps define arena dimensions, record positions, and mode-specific elements.
 *
 * @module orbits-maps
 * @version 1.0.0
 */

/**
 * Standard square arena map (800x800)
 * Used for Arena mode
 * 9 records: 4 corners + 4 sides + 1 center (12-orbits style)
 */
export const STANDARD_MAP = {
  id: 'standard',
  name: 'Standard Arena',
  aspectRatio: 1.0,
  arenaWidth: 800,
  arenaHeight: 800,

  // Record positions (relative 0-1 coordinates)
  records: [
    // Corner records
    { x: 0.20, y: 0.20, clockwise: false },
    { x: 0.80, y: 0.20, clockwise: true },
    { x: 0.20, y: 0.80, clockwise: true },
    { x: 0.80, y: 0.80, clockwise: false },
    // Side records
    { x: 0.15, y: 0.50, clockwise: true },
    { x: 0.85, y: 0.50, clockwise: false },
    { x: 0.50, y: 0.15, clockwise: true },
    { x: 0.50, y: 0.85, clockwise: false },
    // Center record
    { x: 0.50, y: 0.50, clockwise: false }
  ],

  // Record configuration (75% larger for 12-orbits style)
  recordRadius: 70,
  captureRadius: 70,  // Same as visual - dark area captures ghost
  angularSpeedBase: 2.0,
  angularSpeedVariation: 1.0
};

/**
 * Trails mode map (800x800) - 12-orbits style
 * Large records in a 4x3 grid pattern
 * 12 records covering most of the playing field
 */
export const TRAILS_MAP = {
  id: 'trails',
  name: '12-Orbits Arena',
  aspectRatio: 1.0,
  arenaWidth: 800,
  arenaHeight: 800,

  // 12 records in a 4x3 grid (like 12-orbits game)
  records: [
    // Row 1 (top)
    { x: 0.15, y: 0.18, clockwise: false },
    { x: 0.40, y: 0.18, clockwise: true },
    { x: 0.60, y: 0.18, clockwise: false },
    { x: 0.85, y: 0.18, clockwise: true },
    // Row 2 (middle)
    { x: 0.15, y: 0.50, clockwise: true },
    { x: 0.40, y: 0.50, clockwise: false },
    { x: 0.60, y: 0.50, clockwise: true },
    { x: 0.85, y: 0.50, clockwise: false },
    // Row 3 (bottom)
    { x: 0.15, y: 0.82, clockwise: false },
    { x: 0.40, y: 0.82, clockwise: true },
    { x: 0.60, y: 0.82, clockwise: false },
    { x: 0.85, y: 0.82, clockwise: true }
  ],

  // Large records like 12-orbits
  recordRadius: 70,
  captureRadius: 90,
  angularSpeedBase: 1.5,
  angularSpeedVariation: 0.5
};

/**
 * Wide rectangular arena map (1200x800)
 * Used for Blizzard mode with vertical barriers (left/right goals)
 * 10 records: 5 per side in 2 columns (12-orbits Blizzard style)
 */
export const WIDE_MAP = {
  id: 'wide',
  name: 'Blizzard Arena',
  aspectRatio: 1.5,
  arenaWidth: 1200,
  arenaHeight: 800,

  // 10 records: 5 per side (3 in goal column + 2 in center column)
  // Based on 12-orbits Blizzard layout
  records: [
    // Left Goal Column (x ≈ 15%) - 3 spinners evenly spaced
    { x: 0.15, y: 0.167, clockwise: false },  // Top
    { x: 0.15, y: 0.50, clockwise: true },    // Center
    { x: 0.15, y: 0.833, clockwise: false },  // Bottom
    // Left Center Column (x ≈ 35%) - 2 spinners in gaps
    { x: 0.35, y: 0.333, clockwise: true },   // Upper-mid
    { x: 0.35, y: 0.667, clockwise: false },  // Lower-mid
    // Right Center Column (x ≈ 65%) - mirror
    { x: 0.65, y: 0.333, clockwise: false },  // Upper-mid
    { x: 0.65, y: 0.667, clockwise: true },   // Lower-mid
    // Right Goal Column (x ≈ 85%) - 3 spinners evenly spaced
    { x: 0.85, y: 0.167, clockwise: true },   // Top
    { x: 0.85, y: 0.50, clockwise: false },   // Center
    { x: 0.85, y: 0.833, clockwise: true }    // Bottom
  ],

  // 75% larger records (matching STANDARD_MAP for 12-orbits style)
  recordRadius: 70,
  captureRadius: 70,
  angularSpeedBase: 2.0,
  angularSpeedVariation: 0.5,

  // Blizzard-specific: vertical barrier positions (left/right goals)
  barriers: {
    team0: { x: 0.0, teamId: 0 },   // Left barrier (Team 0 defends)
    team1: { x: 1.0, teamId: 1 }    // Right barrier (Team 1 defends)
  },

  // Dot emitter config (center line spawner)
  dotEmitter: {
    x: 0.5,                    // Center of arena
    spawnInterval: 2500,       // 2.5 seconds between spawns
    initialDots: 8,            // Starting neutral dots
    maxDots: 15,               // Max dots on field
    driftSpeed: 20             // Initial drift velocity (low)
  }
};

/**
 * All available maps indexed by ID
 */
export const MAPS = {
  standard: STANDARD_MAP,
  trails: TRAILS_MAP,
  wide: WIDE_MAP
};

/**
 * Get map configuration by mode type
 * @param {string} modeType - Mode type ('arena', 'trails', 'blizzard')
 * @returns {Object} Map configuration
 */
export function getMapForMode(modeType) {
  switch (modeType) {
    case 'blizzard':
      return WIDE_MAP;
    case 'trails':
      return TRAILS_MAP;
    case 'arena':
    default:
      return STANDARD_MAP;
  }
}

/**
 * Convert relative record positions to absolute positions
 * @param {Object} map - Map configuration
 * @returns {Array} Array of absolute record positions
 */
export function getAbsoluteRecordPositions(map) {
  return map.records.map((record, index) => ({
    id: `record_${index}`,
    x: record.x * map.arenaWidth,
    y: record.y * map.arenaHeight,
    radius: map.recordRadius,
    captureRadius: map.captureRadius,
    clockwise: record.clockwise,
    angularSpeed: map.angularSpeedBase + Math.random() * map.angularSpeedVariation
  }));
}

/**
 * Convert relative barrier positions to absolute
 * @param {Object} map - Map configuration (must have barriers)
 * @returns {Array} Array of barrier objects with absolute positions
 */
export function getAbsoluteBarriers(map) {
  if (!map.barriers) return [];

  return Object.entries(map.barriers).map(([key, barrier]) => {
    // Support both vertical (x-based) and horizontal (y-based) barriers
    if (barrier.x !== undefined) {
      return {
        id: `barrier_${barrier.teamId}`,
        x: barrier.x * map.arenaWidth,
        teamId: barrier.teamId,
        height: map.arenaHeight,
        orientation: 'vertical'
      };
    } else {
      return {
        id: `barrier_${barrier.teamId}`,
        y: barrier.y * map.arenaHeight,
        teamId: barrier.teamId,
        width: map.arenaWidth,
        orientation: 'horizontal'
      };
    }
  });
}

export default MAPS;

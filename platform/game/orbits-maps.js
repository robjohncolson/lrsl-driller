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
 * Used for Blizzard mode with horizontal barriers
 * 6 records: 3 on each half for defensive play
 */
export const WIDE_MAP = {
  id: 'wide',
  name: 'Blizzard Arena',
  aspectRatio: 1.5,
  arenaWidth: 1200,
  arenaHeight: 800,

  // Record positions (relative 0-1 coordinates)
  // Positioned to create defensive zones near barriers
  records: [
    // Top half (Team 0 defense zone)
    { x: 0.15, y: 0.25, clockwise: true },
    { x: 0.50, y: 0.25, clockwise: false },
    { x: 0.85, y: 0.25, clockwise: true },
    // Bottom half (Team 1 defense zone)
    { x: 0.15, y: 0.75, clockwise: false },
    { x: 0.50, y: 0.75, clockwise: true },
    { x: 0.85, y: 0.75, clockwise: false }
  ],

  // Record configuration
  recordRadius: 45,
  captureRadius: 65,
  angularSpeedBase: 2.5,
  angularSpeedVariation: 0.8,

  // Blizzard-specific: barrier positions
  barriers: {
    team0: { y: 0.05, teamId: 0 },  // Top barrier
    team1: { y: 0.95, teamId: 1 }   // Bottom barrier
  },

  // Spawn zones for spheres (center band)
  sphereSpawnZone: {
    minY: 0.35,
    maxY: 0.65
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
 * @returns {Array} Array of barrier objects with absolute y positions
 */
export function getAbsoluteBarriers(map) {
  if (!map.barriers) return [];

  return Object.entries(map.barriers).map(([key, barrier]) => ({
    id: `barrier_${barrier.teamId}`,
    y: barrier.y * map.arenaHeight,
    teamId: barrier.teamId,
    width: map.arenaWidth
  }));
}

export default MAPS;

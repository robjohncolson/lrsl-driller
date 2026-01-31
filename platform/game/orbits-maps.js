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
 * Used for Arena mode and Trails mode
 * 8 records: 4 corners + 4 sides
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
    { x: 0.50, y: 0.85, clockwise: false }
  ],

  // Record configuration
  recordRadius: 40,
  captureRadius: 60,
  angularSpeedBase: 2.0,
  angularSpeedVariation: 1.0
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
    case 'arena':
    case 'trails':
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

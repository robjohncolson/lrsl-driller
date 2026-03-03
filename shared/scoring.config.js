/**
 * Global Scoring Configuration
 * Universal rules for points across all cartridges
 *
 * Level Multiplier: Incentivizes progression through cartridge
 * - Level 1: 0.5x multiplier
 * - Final level: 3x multiplier
 * - Intermediate levels: linearly interpolated
 *
 * Star Base Points (v1.5):
 * - Gold: 4 pts (1.0 ratio)
 * - Silver: 3 pts (0.75 ratio)
 * - Bronze: 2 pts (0.5 ratio)
 * - Tin: 1 pt (0.25 ratio)
 *
 * Minimum Points Floor (v1.5):
 * - Every answer awards at least 1 point
 *
 * Unlock Rules:
 * - Default: 1 gold star on a level unlocks the next level
 * - Manifests can override goldToUnlock per cartridge
 * - All levels above 1 are initially locked
 */

const SCORING_CONFIG = {
  // Base points for a gold star (before multipliers)
  baseGoldPoints: 4,

  // Star type ratios (relative to gold)
  // v1.5: Updated to give effective points of 4/3/2/1
  starRatios: {
    gold: 1.0,      // 4 * 1.0 = 4 pts
    silver: 0.75,   // 4 * 0.75 = 3 pts (was 0.5)
    bronze: 0.5,    // 4 * 0.5 = 2 pts (was 0.25)
    tin: 0.25       // 4 * 0.25 = 1 pt (was 0.125)
  },

  // v1.5: Minimum points per answer (floor)
  minimumPoints: 1,

  // Level multiplier range
  levelMultiplier: {
    first: 0.5,  // Level 1 multiplier
    last: 3.0    // Final level multiplier
  },

  // Unlock requirements
  goldToUnlock: 1  // Gold stars needed to unlock next level (default, manifests can override)
};

/**
 * Calculate weighted points for a star earned
 * @param {string} starType - 'gold', 'silver', 'bronze', or 'tin'
 * @param {number} levelIndex - 0-based index of current level
 * @param {number} totalLevels - Total number of levels in cartridge
 * @returns {number} Weighted points (rounded to 1 decimal, minimum 1)
 */
function calculateWeightedPoints(starType, levelIndex, totalLevels) {
  const { baseGoldPoints, starRatios, levelMultiplier, minimumPoints } = SCORING_CONFIG;

  // Get star ratio (default to tin if unknown)
  const starRatio = starRatios[starType] || starRatios.tin;

  // Calculate level multiplier with linear interpolation
  let multiplier;
  if (totalLevels <= 1) {
    // Single level cartridge gets middle multiplier
    multiplier = (levelMultiplier.first + levelMultiplier.last) / 2;
  } else {
    // Interpolate between first and last based on level position
    const progress = levelIndex / (totalLevels - 1);
    multiplier = levelMultiplier.first + progress * (levelMultiplier.last - levelMultiplier.first);
  }

  // Calculate final weighted points
  const weightedPoints = baseGoldPoints * starRatio * multiplier;

  // Round to 1 decimal place, apply minimum floor (v1.5)
  return Math.max(minimumPoints, Math.round(weightedPoints * 10) / 10);
}

/**
 * Get level multiplier for a specific level
 * @param {number} levelIndex - 0-based index of level
 * @param {number} totalLevels - Total number of levels
 * @returns {number} Multiplier value
 */
function getLevelMultiplier(levelIndex, totalLevels) {
  const { levelMultiplier } = SCORING_CONFIG;

  if (totalLevels <= 1) {
    return (levelMultiplier.first + levelMultiplier.last) / 2;
  }

  const progress = levelIndex / (totalLevels - 1);
  return levelMultiplier.first + progress * (levelMultiplier.last - levelMultiplier.first);
}

/**
 * Get points breakdown for display
 * @param {string} starType - Star type
 * @param {number} levelIndex - 0-based level index
 * @param {number} totalLevels - Total levels
 * @returns {object} Breakdown { basePoints, starRatio, levelMultiplier, total }
 */
function getPointsBreakdown(starType, levelIndex, totalLevels) {
  const { baseGoldPoints, starRatios } = SCORING_CONFIG;
  const starRatio = starRatios[starType] || starRatios.tin;
  const multiplier = getLevelMultiplier(levelIndex, totalLevels);

  return {
    basePoints: baseGoldPoints,
    starRatio: starRatio,
    starRatioLabel: `${starType} (${starRatio}x)`,
    levelMultiplier: Math.round(multiplier * 100) / 100,
    levelLabel: `Level ${levelIndex + 1}/${totalLevels}`,
    total: calculateWeightedPoints(starType, levelIndex, totalLevels)
  };
}

// ES Module export (for client/Vite)
export { SCORING_CONFIG, calculateWeightedPoints, getLevelMultiplier, getPointsBreakdown };
export default SCORING_CONFIG;

// CommonJS export (for server/Node.js)
if (typeof module !== 'undefined' && module.exports) {
  try {
    module.exports = { SCORING_CONFIG, calculateWeightedPoints, getLevelMultiplier, getPointsBreakdown };
  } catch {
    // Some ESM test runners expose a read-only module shim; ignore in that context.
  }
}

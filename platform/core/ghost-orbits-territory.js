/**
 * ghost-orbits-territory.js
 *
 * Territory tracking and well spawning system for Ghost Orbits.
 *
 * Implements:
 * - Grid-based territory tracking with decay
 * - Trail segment management
 * - Territory calculation from overlapping trails
 * - Well spawning/despawning based on territory thresholds
 * - Region-based well management
 *
 * @module ghost-orbits-territory
 * @version 2.0.0
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export const TERRITORY_CONFIG = {
  // Grid settings
  GRID_CELL_SIZE: 20, // px - each cell is 20x20

  // Territory thresholds (% of cell covered)
  THRESHOLD_MINOR: 0.05,   // 5-15% → Minor Well
  THRESHOLD_STANDARD: 0.15, // 15-30% → Standard Well
  THRESHOLD_MAJOR: 0.30,    // 30%+ → Major Well

  // Well limits
  MAX_WELLS_PER_PLAYER: 5,
  WELL_SPAWN_COOLDOWN: 2000, // ms between well spawns

  // Region settings (for well spawning)
  REGION_GRID_SIZE: 4, // Divide arena into 4x4 = 16 regions
  MAX_WELLS_PER_REGION: 1, // One well per region max

  // Territory decay
  TERRITORY_DECAY_RATE: 0.02, // 2% per second - takes ~50s to fully decay

  // Trail segment settings
  DEFAULT_TRAIL_DURATION: 5000, // ms - default if not specified
  TRAIL_UPDATE_INTERVAL: 100, // ms - how often to recalculate territory
};

// ============================================================================
// TYPES (for documentation)
// ============================================================================

/**
 * @typedef {Object} TrailSegment
 * @property {number} x - Center X position
 * @property {number} y - Center Y position
 * @property {number} width - Trail width (affects coverage)
 * @property {string} ownerId - Player ID who created this trail
 * @property {number} createdAt - Timestamp (ms)
 * @property {number} duration - How long segment lasts (ms)
 */

/**
 * @typedef {Object} GridCell
 * @property {string|null} ownerId - Current owner (most coverage)
 * @property {Object.<string, number>} coverage - Map of playerId → coverage %
 * @property {number} lastUpdated - Timestamp of last update
 */

/**
 * @typedef {Object} WellSpawnInfo
 * @property {string} id - Unique well ID
 * @property {string} ownerId - Player who owns this well
 * @property {string} type - 'minor' | 'standard' | 'major'
 * @property {number} x - Spawn X position
 * @property {number} y - Spawn Y position
 * @property {number} regionId - Which region this well belongs to
 * @property {number} territoryPercent - Territory % when spawned
 */

/**
 * @typedef {Object} Region
 * @property {number} id - Region identifier
 * @property {number} x - Region top-left X
 * @property {number} y - Region top-left Y
 * @property {number} width - Region width
 * @property {number} height - Region height
 * @property {Object.<string, number>} territoryPercent - playerId → % of region owned
 * @property {string|null} wellId - Current well in this region (if any)
 */

// ============================================================================
// TERRITORY SYSTEM CLASS
// ============================================================================

export class TerritorySystem {
  /**
   * @param {number} arenaWidth - Arena width in pixels
   * @param {number} arenaHeight - Arena height in pixels
   */
  constructor(arenaWidth, arenaHeight) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;

    // Calculate grid dimensions
    this.gridCols = Math.ceil(arenaWidth / TERRITORY_CONFIG.GRID_CELL_SIZE);
    this.gridRows = Math.ceil(arenaHeight / TERRITORY_CONFIG.GRID_CELL_SIZE);

    // Initialize grid
    this.grid = this._createGrid();

    // Trail segments (active)
    this.trailSegments = [];

    // Regions for well spawning
    this.regions = this._createRegions();

    // Well management
    this.activeWells = new Map(); // wellId → WellSpawnInfo
    this.playerWellCounts = new Map(); // playerId → count
    this.lastWellSpawnTime = new Map(); // playerId → timestamp
    this.wellsToSpawn = []; // Queue of wells to create
    this.wellsToDespawn = []; // Queue of well IDs to remove

    // Update tracking
    this.lastUpdateTime = Date.now();
    this.lastTerritoryRecalc = Date.now();

    // Store owner colors for visualization (backward compatibility)
    this.ownerColors = new Map();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Create the territory grid
   * @private
   */
  _createGrid() {
    const grid = [];
    for (let row = 0; row < this.gridRows; row++) {
      grid[row] = [];
      for (let col = 0; col < this.gridCols; col++) {
        grid[row][col] = {
          ownerId: null,
          coverage: {}, // playerId → coverage %
          lastUpdated: Date.now(),
        };
      }
    }
    return grid;
  }

  /**
   * Create regions for well spawning
   * @private
   */
  _createRegions() {
    const regions = [];
    const regionWidth = this.arenaWidth / TERRITORY_CONFIG.REGION_GRID_SIZE;
    const regionHeight = this.arenaHeight / TERRITORY_CONFIG.REGION_GRID_SIZE;

    let regionId = 0;
    for (let row = 0; row < TERRITORY_CONFIG.REGION_GRID_SIZE; row++) {
      for (let col = 0; col < TERRITORY_CONFIG.REGION_GRID_SIZE; col++) {
        regions.push({
          id: regionId++,
          x: col * regionWidth,
          y: row * regionHeight,
          width: regionWidth,
          height: regionHeight,
          territoryPercent: {}, // playerId → %
          wellId: null,
        });
      }
    }

    return regions;
  }

  // ==========================================================================
  // TRAIL SEGMENT MANAGEMENT
  // ==========================================================================

  /**
   * Add a trail segment to the system
   * @param {TrailSegment} segment
   */
  addTrailSegment(segment) {
    // Ensure required fields
    const fullSegment = {
      x: segment.x,
      y: segment.y,
      width: segment.width,
      ownerId: segment.ownerId,
      createdAt: segment.createdAt || Date.now(),
      duration: segment.duration || TERRITORY_CONFIG.DEFAULT_TRAIL_DURATION,
    };

    this.trailSegments.push(fullSegment);
  }

  /**
   * Process a trail segment (backward compatibility with old API)
   * @param {Object} segment - Trail segment with position object
   */
  processTrail(segment) {
    if (segment.position) {
      this.addTrailSegment({
        x: segment.position.x,
        y: segment.position.y,
        width: segment.width,
        ownerId: segment.ownerId,
        createdAt: segment.createdAt || Date.now(),
        duration: segment.duration || TERRITORY_CONFIG.DEFAULT_TRAIL_DURATION,
      });

      // Register color if provided
      if (segment.color && !this.ownerColors.has(segment.ownerId)) {
        this.ownerColors.set(segment.ownerId, segment.color);
      }
    } else {
      this.addTrailSegment(segment);
    }
  }

  /**
   * Remove expired trail segments
   * @private
   */
  _removeExpiredSegments(currentTime) {
    this.trailSegments = this.trailSegments.filter(segment => {
      const age = currentTime - segment.createdAt;
      return age < segment.duration;
    });
  }

  // ==========================================================================
  // TERRITORY CALCULATION
  // ==========================================================================

  /**
   * Update territory based on active trail segments
   * @private
   */
  _recalculateTerritory(currentTime) {
    // Calculate time since last recalc for decay
    const timeSinceLastRecalc = (currentTime - this.lastTerritoryRecalc) / 1000; // seconds
    const decayAmount = TERRITORY_CONFIG.TERRITORY_DECAY_RATE * timeSinceLastRecalc;

    // Apply decay to existing coverage (don't reset!)
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const cell = this.grid[row][col];
        for (const playerId of Object.keys(cell.coverage)) {
          cell.coverage[playerId] -= decayAmount;
          // Remove if decayed below threshold
          if (cell.coverage[playerId] <= 0.01) {
            delete cell.coverage[playerId];
          }
        }
      }
    }

    // Add coverage from active trail segments (this refreshes territory)
    for (const segment of this.trailSegments) {
      this._applyTrailSegmentToGrid(segment);
    }

    this.lastTerritoryRecalc = currentTime;

    // Determine cell ownership (player with most coverage)
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const cell = this.grid[row][col];
        let maxCoverage = 0;
        let owner = null;

        for (const [playerId, coverage] of Object.entries(cell.coverage)) {
          if (coverage > maxCoverage) {
            maxCoverage = coverage;
            owner = playerId;
          }
        }

        cell.ownerId = owner;
        cell.lastUpdated = currentTime;
      }
    }

    // Update region territory percentages
    this._updateRegionTerritory();
  }

  /**
   * Apply a trail segment's coverage to the grid
   * @private
   */
  _applyTrailSegmentToGrid(segment) {
    const radius = segment.width / 2;

    // Find grid cells this segment affects
    const minCol = Math.max(0, Math.floor((segment.x - radius) / TERRITORY_CONFIG.GRID_CELL_SIZE));
    const maxCol = Math.min(this.gridCols - 1, Math.floor((segment.x + radius) / TERRITORY_CONFIG.GRID_CELL_SIZE));
    const minRow = Math.max(0, Math.floor((segment.y - radius) / TERRITORY_CONFIG.GRID_CELL_SIZE));
    const maxRow = Math.min(this.gridRows - 1, Math.floor((segment.y + radius) / TERRITORY_CONFIG.GRID_CELL_SIZE));

    // Calculate coverage for each affected cell
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cellCenterX = col * TERRITORY_CONFIG.GRID_CELL_SIZE + TERRITORY_CONFIG.GRID_CELL_SIZE / 2;
        const cellCenterY = row * TERRITORY_CONFIG.GRID_CELL_SIZE + TERRITORY_CONFIG.GRID_CELL_SIZE / 2;

        // Calculate approximate coverage using circle-square overlap
        const coverage = this._calculateCircleSquareOverlap(
          segment.x, segment.y, radius,
          col * TERRITORY_CONFIG.GRID_CELL_SIZE,
          row * TERRITORY_CONFIG.GRID_CELL_SIZE,
          TERRITORY_CONFIG.GRID_CELL_SIZE,
          TERRITORY_CONFIG.GRID_CELL_SIZE
        );

        if (coverage > 0) {
          const cell = this.grid[row][col];
          cell.coverage[segment.ownerId] = (cell.coverage[segment.ownerId] || 0) + coverage;
          // Cap at 100%
          cell.coverage[segment.ownerId] = Math.min(1.0, cell.coverage[segment.ownerId]);
        }
      }
    }
  }

  /**
   * Calculate overlap between circle and square (approximation)
   * @private
   */
  _calculateCircleSquareOverlap(cx, cy, radius, squareX, squareY, squareW, squareH) {
    // Simplified: if circle center is in square, return proportional coverage
    // If circle extends into square, calculate approximate overlap

    // Find closest point in square to circle center
    const closestX = Math.max(squareX, Math.min(cx, squareX + squareW));
    const closestY = Math.max(squareY, Math.min(cy, squareY + squareH));

    // Distance from circle center to closest point
    const dx = cx - closestX;
    const dy = cy - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > radius) {
      return 0; // No overlap
    }

    // Approximate coverage based on distance
    // Full coverage if center is inside and radius covers the cell
    if (cx >= squareX && cx <= squareX + squareW &&
        cy >= squareY && cy <= squareY + squareH) {
      // Center is inside square
      const coverageRatio = Math.min(1.0, (radius * 2) / Math.max(squareW, squareH));
      return coverageRatio * 0.8; // Scale down to prevent over-counting
    }

    // Partial coverage - proportional to how much the circle overlaps
    const overlapRatio = (radius - distance) / radius;
    return overlapRatio * 0.5; // Scale down for edge cases
  }

  /**
   * Update territory percentages for each region
   * @private
   */
  _updateRegionTerritory() {
    for (const region of this.regions) {
      region.territoryPercent = {};

      // Find grid cells that belong to this region
      const startCol = Math.floor(region.x / TERRITORY_CONFIG.GRID_CELL_SIZE);
      const endCol = Math.floor((region.x + region.width) / TERRITORY_CONFIG.GRID_CELL_SIZE);
      const startRow = Math.floor(region.y / TERRITORY_CONFIG.GRID_CELL_SIZE);
      const endRow = Math.floor((region.y + region.height) / TERRITORY_CONFIG.GRID_CELL_SIZE);

      let totalCells = 0;
      const playerCells = {};

      for (let row = startRow; row < endRow && row < this.gridRows; row++) {
        for (let col = startCol; col < endCol && col < this.gridCols; col++) {
          totalCells++;
          const cell = this.grid[row][col];
          if (cell.ownerId) {
            playerCells[cell.ownerId] = (playerCells[cell.ownerId] || 0) + 1;
          }
        }
      }

      // Calculate percentages
      for (const [playerId, count] of Object.entries(playerCells)) {
        region.territoryPercent[playerId] = count / totalCells;
      }
    }
  }

  // ==========================================================================
  // WELL SPAWNING/DESPAWNING
  // ==========================================================================

  /**
   * Check each region for well spawning/despawning conditions
   * @private
   */
  _evaluateWellSpawning(currentTime) {
    for (const region of this.regions) {
      // Find dominant player in this region
      let dominantPlayer = null;
      let maxPercent = 0;

      for (const [playerId, percent] of Object.entries(region.territoryPercent)) {
        if (percent > maxPercent) {
          maxPercent = percent;
          dominantPlayer = playerId;
        }
      }

      // Check if there's a well in this region
      const existingWell = region.wellId ? this.activeWells.get(region.wellId) : null;

      if (existingWell) {
        // Check if well should despawn (territory decayed or owner changed)
        if (existingWell.ownerId !== dominantPlayer ||
            maxPercent < TERRITORY_CONFIG.THRESHOLD_MINOR) {
          this._despawnWell(existingWell.id);
          region.wellId = null;
        }
      } else {
        // Check if we should spawn a well
        if (dominantPlayer && maxPercent >= TERRITORY_CONFIG.THRESHOLD_MINOR) {
          console.log(`[Territory] Attempting to spawn well: Region ${region.id}, Player ${dominantPlayer}, ${(maxPercent * 100).toFixed(1)}% territory (threshold: ${(TERRITORY_CONFIG.THRESHOLD_MINOR * 100).toFixed(0)}%)`);
          this._trySpawnWellInRegion(region, dominantPlayer, maxPercent, currentTime);
        }
      }
    }
  }

  /**
   * Attempt to spawn a well in a region
   * @private
   */
  _trySpawnWellInRegion(region, playerId, territoryPercent, currentTime) {
    // Check player well count
    const playerWellCount = this.playerWellCounts.get(playerId) || 0;
    if (playerWellCount >= TERRITORY_CONFIG.MAX_WELLS_PER_PLAYER) {
      return; // Player at max wells
    }

    // Check cooldown
    const lastSpawn = this.lastWellSpawnTime.get(playerId) || 0;
    if (currentTime - lastSpawn < TERRITORY_CONFIG.WELL_SPAWN_COOLDOWN) {
      return; // Still on cooldown
    }

    // Determine well type
    let wellType;
    if (territoryPercent >= TERRITORY_CONFIG.THRESHOLD_MAJOR) {
      wellType = 'major';
    } else if (territoryPercent >= TERRITORY_CONFIG.THRESHOLD_STANDARD) {
      wellType = 'standard';
    } else {
      wellType = 'minor';
    }

    // Calculate spawn position (centroid of player's territory in this region)
    const { x, y } = this._calculateTerritoryCenter(region, playerId);

    // Create well info
    const wellId = `well_${playerId}_${region.id}_${currentTime}`;
    const wellInfo = {
      id: wellId,
      ownerId: playerId,
      type: wellType,
      x,
      y,
      regionId: region.id,
      territoryPercent,
    };

    // Add to spawn queue
    this.wellsToSpawn.push(wellInfo);
    console.log(`[Territory] ✓ Well spawned: ${wellType} for ${playerId} in region ${region.id} at (${x.toFixed(0)}, ${y.toFixed(0)}) - ${(territoryPercent * 100).toFixed(1)}% territory`);

    // Update tracking
    this.activeWells.set(wellId, wellInfo);
    this.playerWellCounts.set(playerId, playerWellCount + 1);
    this.lastWellSpawnTime.set(playerId, currentTime);
    region.wellId = wellId;
  }

  /**
   * Mark a well for despawning
   * @private
   */
  _despawnWell(wellId) {
    const well = this.activeWells.get(wellId);
    if (!well) return;

    // Add to despawn queue
    this.wellsToDespawn.push(wellId);

    // Update tracking
    this.activeWells.delete(wellId);
    const playerCount = this.playerWellCounts.get(well.ownerId) || 0;
    this.playerWellCounts.set(well.ownerId, Math.max(0, playerCount - 1));
  }

  /**
   * Calculate the center of a player's territory in a region
   * @private
   */
  _calculateTerritoryCenter(region, playerId) {
    const startCol = Math.floor(region.x / TERRITORY_CONFIG.GRID_CELL_SIZE);
    const endCol = Math.floor((region.x + region.width) / TERRITORY_CONFIG.GRID_CELL_SIZE);
    const startRow = Math.floor(region.y / TERRITORY_CONFIG.GRID_CELL_SIZE);
    const endRow = Math.floor((region.y + region.height) / TERRITORY_CONFIG.GRID_CELL_SIZE);

    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let row = startRow; row < endRow && row < this.gridRows; row++) {
      for (let col = startCol; col < endCol && col < this.gridCols; col++) {
        const cell = this.grid[row][col];
        if (cell.ownerId === playerId) {
          sumX += col * TERRITORY_CONFIG.GRID_CELL_SIZE + TERRITORY_CONFIG.GRID_CELL_SIZE / 2;
          sumY += row * TERRITORY_CONFIG.GRID_CELL_SIZE + TERRITORY_CONFIG.GRID_CELL_SIZE / 2;
          count++;
        }
      }
    }

    if (count === 0) {
      // No territory found, use region center
      return {
        x: region.x + region.width / 2,
        y: region.y + region.height / 2,
      };
    }

    return {
      x: sumX / count,
      y: sumY / count,
    };
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Main update loop - call every frame
   * @param {number} deltaTime - Time since last update (seconds)
   */
  update(deltaTime) {
    const currentTime = Date.now();

    // Remove expired trail segments
    this._removeExpiredSegments(currentTime);

    // Recalculate territory periodically
    if (currentTime - this.lastTerritoryRecalc >= TERRITORY_CONFIG.TRAIL_UPDATE_INTERVAL) {
      this._recalculateTerritory(currentTime);
      this._evaluateWellSpawning(currentTime);
      this.lastTerritoryRecalc = currentTime;
    }

    this.lastUpdateTime = currentTime;
  }

  /**
   * Update from external trails (backward compatibility)
   * @param {Array<Object>} trails - Array of trail segments
   */
  updateFromTrails(trails) {
    if (trails) {
      // Process external trails
      for (const trail of trails) {
        this.processTrail(trail);
      }
    }
    this.update(0);
  }

  /**
   * Get the territory grid for rendering
   * @returns {GridCell[][]}
   */
  getTerritory() {
    return this.grid;
  }

  /**
   * Get grid (backward compatibility - returns flattened array)
   * @returns {Array<string|null>}
   */
  getGrid() {
    const flat = [];
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        flat.push(this.grid[row][col].ownerId);
      }
    }
    return flat;
  }

  /**
   * Get grid dimensions (backward compatibility)
   * @returns {Object}
   */
  getGridDimensions() {
    return {
      gridWidth: this.gridCols,
      gridHeight: this.gridRows,
    };
  }

  /**
   * Get territory percentage for a player
   * @param {string} ownerId - Player ID
   * @returns {number} Percentage of arena owned (0-1)
   */
  getTerritoryPercent(ownerId) {
    let ownedCells = 0;
    let totalCells = this.gridRows * this.gridCols;

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (this.grid[row][col].ownerId === ownerId) {
          ownedCells++;
        }
      }
    }

    return ownedCells / totalCells;
  }

  /**
   * Get all territory percentages (backward compatibility)
   * @returns {Map<string, number>}
   */
  getAllTerritoryPercents() {
    const percents = new Map();
    const totalCells = this.gridRows * this.gridCols;
    const counts = {};

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const ownerId = this.grid[row][col].ownerId;
        if (ownerId) {
          counts[ownerId] = (counts[ownerId] || 0) + 1;
        }
      }
    }

    for (const [ownerId, count] of Object.entries(counts)) {
      percents.set(ownerId, count / totalCells);
    }

    return percents;
  }

  /**
   * Get wells that should be spawned (and clear the queue)
   * @returns {WellSpawnInfo[]}
   */
  getWellsToSpawn() {
    return [...this.wellsToSpawn];
  }

  /**
   * Get well IDs that should be despawned (and clear the queue)
   * @returns {string[]}
   */
  getWellsToDespawn() {
    return [...this.wellsToDespawn];
  }

  /**
   * Clear the well spawn queue (call after creating wells)
   */
  clearWellSpawnQueue() {
    this.wellsToSpawn = [];
    this.wellsToDespawn = [];
  }

  /**
   * Get all active wells
   * @returns {Map<string, WellSpawnInfo>}
   */
  getActiveWells() {
    return this.activeWells;
  }

  /**
   * Get region information
   * @returns {Region[]}
   */
  getRegions() {
    return this.regions;
  }

  /**
   * Register owner color (backward compatibility)
   * @param {string} ownerId - Owner ID
   * @param {string} color - Hex color
   */
  registerOwnerColor(ownerId, color) {
    this.ownerColors.set(ownerId, color);
  }

  /**
   * Get colored cells for rendering (backward compatibility)
   * @returns {Array<Object>}
   */
  getColoredCells() {
    const cells = [];

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const cell = this.grid[row][col];
        if (cell.ownerId) {
          const color = this.ownerColors.get(cell.ownerId) || '#ffffff';
          cells.push({
            x: col * TERRITORY_CONFIG.GRID_CELL_SIZE,
            y: row * TERRITORY_CONFIG.GRID_CELL_SIZE,
            cellX: col,
            cellY: row,
            color,
            ownerId: cell.ownerId,
          });
        }
      }
    }

    return cells;
  }

  /**
   * Render to canvas context (backward compatibility)
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} alpha
   */
  renderToContext(ctx, alpha = 0.15) {
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;

    const cells = this.getColoredCells();
    for (const cell of cells) {
      ctx.fillStyle = cell.color;
      ctx.fillRect(cell.x, cell.y, TERRITORY_CONFIG.GRID_CELL_SIZE, TERRITORY_CONFIG.GRID_CELL_SIZE);
    }

    ctx.globalAlpha = previousAlpha;
  }

  /**
   * Check threshold win (backward compatibility)
   * @param {number} threshold
   * @returns {string|null}
   */
  checkThresholdWin(threshold = 0.7) {
    const percents = this.getAllTerritoryPercents();

    for (const [ownerId, percent] of percents) {
      if (percent >= threshold) {
        return ownerId;
      }
    }

    return null;
  }

  /**
   * Get leader (backward compatibility)
   * @returns {Object|null}
   */
  getLeader() {
    const percents = this.getAllTerritoryPercents();
    let leader = null;
    let maxPercent = 0;

    for (const [ownerId, percent] of percents) {
      if (percent > maxPercent) {
        maxPercent = percent;
        leader = { ownerId, percent };
      }
    }

    return leader;
  }

  /**
   * Reset the entire territory system
   */
  reset() {
    this.grid = this._createGrid();
    this.trailSegments = [];
    this.activeWells.clear();
    this.playerWellCounts.clear();
    this.lastWellSpawnTime.clear();
    this.wellsToSpawn = [];
    this.wellsToDespawn = [];
    this.regions = this._createRegions();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the total territory percentage across all players
 * @param {TerritorySystem} territorySystem
 * @returns {Object.<string, number>} Map of playerId → territory %
 */
export function getTerritoryPercentages(territorySystem) {
  const percentages = {};
  const grid = territorySystem.getTerritory();
  const totalCells = grid.length * grid[0].length;

  for (const row of grid) {
    for (const cell of row) {
      if (cell.ownerId) {
        percentages[cell.ownerId] = (percentages[cell.ownerId] || 0) + 1;
      }
    }
  }

  // Convert counts to percentages
  for (const playerId in percentages) {
    percentages[playerId] = percentages[playerId] / totalCells;
  }

  return percentages;
}

/**
 * Get the dominant player (most territory)
 * @param {TerritorySystem} territorySystem
 * @returns {{playerId: string|null, percent: number}}
 */
export function getDominantPlayer(territorySystem) {
  const percentages = getTerritoryPercentages(territorySystem);
  let maxPlayerId = null;
  let maxPercent = 0;

  for (const [playerId, percent] of Object.entries(percentages)) {
    if (percent > maxPercent) {
      maxPercent = percent;
      maxPlayerId = playerId;
    }
  }

  return { playerId: maxPlayerId, percent: maxPercent };
}

/**
 * Check if a position is within a player's territory
 * @param {TerritorySystem} territorySystem
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {string|null} Owner ID or null
 */
export function getOwnerAtPosition(territorySystem, x, y) {
  const col = Math.floor(x / TERRITORY_CONFIG.GRID_CELL_SIZE);
  const row = Math.floor(y / TERRITORY_CONFIG.GRID_CELL_SIZE);

  const grid = territorySystem.getTerritory();
  if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
    return grid[row][col].ownerId;
  }

  return null;
}

/**
 * Get coverage information at a specific position
 * @param {TerritorySystem} territorySystem
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Object.<string, number>|null} Map of playerId → coverage % or null
 */
export function getCoverageAtPosition(territorySystem, x, y) {
  const col = Math.floor(x / TERRITORY_CONFIG.GRID_CELL_SIZE);
  const row = Math.floor(y / TERRITORY_CONFIG.GRID_CELL_SIZE);

  const grid = territorySystem.getTerritory();
  if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
    return grid[row][col].coverage;
  }

  return null;
}

/**
 * Create a trail segment object
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Trail width
 * @param {string} ownerId - Player ID
 * @param {number} duration - Duration in ms
 * @returns {TrailSegment}
 */
export function createTrailSegment(x, y, width, ownerId, duration) {
  return {
    x,
    y,
    width,
    ownerId,
    createdAt: Date.now(),
    duration: duration || TERRITORY_CONFIG.DEFAULT_TRAIL_DURATION,
  };
}

// Backward compatibility exports
export const TerritoryManager = TerritorySystem;
export const GRID_SIZE = TERRITORY_CONFIG.GRID_CELL_SIZE;
export const TERRITORY_ALPHA = 0.15;
export const DEFAULT_WIN_THRESHOLD = 0.7;

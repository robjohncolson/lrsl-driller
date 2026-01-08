/**
 * Grid Wars Enemy AI
 * Handles wave spawning, enemy pathfinding, and combat
 */

// Configuration
const AI_CONFIG = {
  mapSize: 20,
  centerX: 10,
  centerY: 10,
  tickInterval: 2000, // Enemy move every 2 seconds
  towerRange: 2, // Tiles
  towerDamage: 25,
  baseEnemyHp: 100,
  enemiesPerWave: (wave) => Math.min(4 + wave * 2, 20), // 6, 8, 10, ... max 20
  spawnEdges: ['top', 'bottom', 'left', 'right']
};

/**
 * A* Pathfinding implementation
 */
class AStar {
  constructor(gridSize) {
    this.gridSize = gridSize;
  }

  /**
   * Find path from start to goal avoiding walls
   * @param {Object} start - {x, y}
   * @param {Object} goal - {x, y}
   * @param {Set} walls - Set of "x,y" strings for blocked cells
   * @returns {Array} Array of {x, y} positions or empty if no path
   */
  findPath(start, goal, walls) {
    const openSet = new Map();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${start.x},${start.y}`;
    const goalKey = `${goal.x},${goal.y}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(start, goal));
    openSet.set(startKey, start);

    while (openSet.size > 0) {
      // Get node with lowest fScore
      let currentKey = null;
      let lowestF = Infinity;
      for (const [key, _] of openSet) {
        const f = fScore.get(key) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          currentKey = key;
        }
      }

      if (currentKey === goalKey) {
        return this.reconstructPath(cameFrom, currentKey);
      }

      const current = openSet.get(currentKey);
      openSet.delete(currentKey);
      closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        // Skip if in closed set or is a wall
        if (closedSet.has(neighborKey) || walls.has(neighborKey)) {
          continue;
        }

        const tentativeG = (gScore.get(currentKey) || Infinity) + 1;

        if (!openSet.has(neighborKey)) {
          openSet.set(neighborKey, neighbor);
        } else if (tentativeG >= (gScore.get(neighborKey) || Infinity)) {
          continue;
        }

        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, goal));
      }
    }

    // No path found
    return [];
  }

  /**
   * Manhattan distance heuristic
   */
  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Get valid neighbor cells
   */
  getNeighbors(pos) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }, // left
      { x: 1, y: 0 }   // right
    ];

    for (const dir of directions) {
      const nx = pos.x + dir.x;
      const ny = pos.y + dir.y;

      if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  /**
   * Reconstruct path from cameFrom map
   */
  reconstructPath(cameFrom, currentKey) {
    const path = [];
    let key = currentKey;

    while (key) {
      const [x, y] = key.split(',').map(Number);
      path.unshift({ x, y });
      key = cameFrom.get(key);
    }

    return path;
  }
}

/**
 * Wave Manager - Handles enemy spawning and movement
 */
class WaveManager {
  constructor(options = {}) {
    this.gameId = options.gameId;
    this.supabase = options.supabase;
    this.broadcast = options.broadcast || (() => {});
    this.onCenterDamaged = options.onCenterDamaged || (() => {});

    this.enemies = [];
    this.waveNumber = 0;
    this.waveActive = false;
    this.tickInterval = null;
    this.pathfinder = new AStar(AI_CONFIG.mapSize);

    // Cached data
    this.walls = new Set();
    this.towers = [];
  }

  /**
   * Start a new wave
   */
  async startWave() {
    if (this.waveActive) return;

    this.waveNumber++;
    this.waveActive = true;

    // Refresh game state
    await this.refreshGameState();

    // Spawn enemies
    this.spawnEnemies();

    // Broadcast wave start
    this.broadcast({
      type: 'wave_started',
      gameId: this.gameId,
      waveNumber: this.waveNumber,
      enemies: this.enemies.map(e => ({ x: e.x, y: e.y, hp: e.hp, id: e.id }))
    });

    // Start tick loop
    this.tickInterval = setInterval(() => this.tick(), AI_CONFIG.tickInterval);

    console.log(`Grid Wars: Wave ${this.waveNumber} started with ${this.enemies.length} enemies`);

    return {
      waveNumber: this.waveNumber,
      enemies: this.enemies
    };
  }

  /**
   * Stop the current wave
   */
  stopWave() {
    this.waveActive = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.enemies = [];
  }

  /**
   * Spawn enemies at map edges
   */
  spawnEnemies() {
    const count = AI_CONFIG.enemiesPerWave(this.waveNumber);
    this.enemies = [];

    for (let i = 0; i < count; i++) {
      const edge = AI_CONFIG.spawnEdges[i % AI_CONFIG.spawnEdges.length];
      const pos = this.getSpawnPosition(edge, i);

      this.enemies.push({
        id: `enemy_${this.waveNumber}_${i}`,
        x: pos.x,
        y: pos.y,
        hp: AI_CONFIG.baseEnemyHp + (this.waveNumber - 1) * 10,
        maxHp: AI_CONFIG.baseEnemyHp + (this.waveNumber - 1) * 10
      });
    }
  }

  /**
   * Get spawn position on edge
   */
  getSpawnPosition(edge, index) {
    const offset = Math.floor(index / 4) * 3 + 5; // Spread out spawns

    switch (edge) {
      case 'top':
        return { x: Math.min(offset, AI_CONFIG.mapSize - 1), y: 0 };
      case 'bottom':
        return { x: Math.min(offset, AI_CONFIG.mapSize - 1), y: AI_CONFIG.mapSize - 1 };
      case 'left':
        return { x: 0, y: Math.min(offset, AI_CONFIG.mapSize - 1) };
      case 'right':
        return { x: AI_CONFIG.mapSize - 1, y: Math.min(offset, AI_CONFIG.mapSize - 1) };
      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * Refresh walls and towers from database
   */
  async refreshGameState() {
    if (!this.supabase || !this.gameId) return;

    try {
      // Get structures
      const { data: structures } = await this.supabase
        .from('grid_wars_structures')
        .select('x, y, structure_type, owner')
        .eq('game_id', this.gameId);

      this.walls = new Set();
      this.towers = [];

      for (const s of structures || []) {
        if (s.structure_type === 'wall') {
          this.walls.add(`${s.x},${s.y}`);
        } else if (s.structure_type === 'tower') {
          this.towers.push({ x: s.x, y: s.y, owner: s.owner });
        }
      }
    } catch (err) {
      console.error('WaveManager.refreshGameState error:', err);
    }
  }

  /**
   * Game tick - move enemies and process combat
   */
  async tick() {
    if (!this.waveActive || this.enemies.length === 0) {
      this.endWave();
      return;
    }

    const goal = { x: AI_CONFIG.centerX, y: AI_CONFIG.centerY };
    const destroyed = [];
    const reachedCenter = [];

    // Move each enemy
    for (const enemy of this.enemies) {
      // Find path to center
      const path = this.pathfinder.findPath(
        { x: enemy.x, y: enemy.y },
        goal,
        this.walls
      );

      if (path.length > 1) {
        // Move one step toward goal
        enemy.x = path[1].x;
        enemy.y = path[1].y;
      }

      // Check if reached center
      if (enemy.x === goal.x && enemy.y === goal.y) {
        reachedCenter.push(enemy);
      }
    }

    // Tower combat
    for (const tower of this.towers) {
      for (const enemy of this.enemies) {
        const dist = Math.abs(tower.x - enemy.x) + Math.abs(tower.y - enemy.y);
        if (dist <= AI_CONFIG.towerRange) {
          enemy.hp -= AI_CONFIG.towerDamage;
          if (enemy.hp <= 0 && !destroyed.includes(enemy)) {
            destroyed.push(enemy);
          }
        }
      }
    }

    // Remove destroyed enemies
    for (const enemy of destroyed) {
      const index = this.enemies.indexOf(enemy);
      if (index !== -1) {
        this.enemies.splice(index, 1);
      }
    }

    // Handle enemies that reached center
    for (const enemy of reachedCenter) {
      this.onCenterDamaged(10); // Damage center by 10
      const index = this.enemies.indexOf(enemy);
      if (index !== -1) {
        this.enemies.splice(index, 1);
      }
    }

    // Broadcast enemy positions
    this.broadcast({
      type: 'enemy_moved',
      gameId: this.gameId,
      enemies: this.enemies.map(e => ({ x: e.x, y: e.y, hp: e.hp, id: e.id })),
      destroyed: destroyed.map(e => e.id),
      reachedCenter: reachedCenter.length
    });

    // Check if wave is over
    if (this.enemies.length === 0) {
      this.endWave();
    }
  }

  /**
   * End the current wave
   */
  endWave() {
    this.waveActive = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.broadcast({
      type: 'wave_ended',
      gameId: this.gameId,
      waveNumber: this.waveNumber,
      success: true
    });

    console.log(`Grid Wars: Wave ${this.waveNumber} ended`);
  }

  /**
   * Get current wave state
   */
  getState() {
    return {
      waveNumber: this.waveNumber,
      waveActive: this.waveActive,
      enemies: this.enemies.map(e => ({ x: e.x, y: e.y, hp: e.hp, id: e.id })),
      enemyCount: this.enemies.length
    };
  }
}

/**
 * Wave Manager Registry - Track wave managers for each game
 */
const waveManagers = new Map();

function getWaveManager(gameId, options = {}) {
  if (!waveManagers.has(gameId)) {
    waveManagers.set(gameId, new WaveManager({ gameId, ...options }));
  }
  return waveManagers.get(gameId);
}

function removeWaveManager(gameId) {
  const manager = waveManagers.get(gameId);
  if (manager) {
    manager.stopWave();
    waveManagers.delete(gameId);
  }
}

module.exports = {
  AI_CONFIG,
  AStar,
  WaveManager,
  getWaveManager,
  removeWaveManager
};

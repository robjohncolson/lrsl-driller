/**
 * ghost-maze-generator.js
 * Parses cartridge manifest.json into a 3D node graph structure
 *
 * Transforms the flat progression data into a navigable 3D space where:
 * - Each mode/level becomes a node (platform/room)
 * - unlockedBy relationships become edges (bridges/paths)
 * - Linear sequences become corridors
 * - Branching points become intersections
 */

// Configuration constants
const TIER_HEIGHT = 8;        // Vertical spacing between tiers (Y-axis)
const NODE_SPREAD = 12;       // Horizontal spacing between nodes
const SPIRAL_FACTOR = 0.3;    // How much to spiral outward per tier

/**
 * Parse manifest.json into a directed graph structure
 * @param {Object} manifest - Cartridge manifest object
 * @returns {Object} { nodes: Map, edges: Array, tiers: Map }
 */
export function parseManifest(manifest) {
  if (!manifest || !manifest.modes || !Array.isArray(manifest.modes)) {
    console.warn('[MazeGenerator] Invalid manifest: missing modes array');
    return { nodes: new Map(), edges: [], tiers: new Map() };
  }

  const nodes = new Map();
  const edges = [];

  // Phase 1: Create all nodes from modes
  manifest.modes.forEach((mode, index) => {
    nodes.set(mode.id, {
      id: mode.id,
      name: mode.name || mode.id,
      index,
      unlockedBy: mode.unlockedBy,
      tier: 0,           // Calculated in Phase 3
      position: null,    // Calculated after tier assignment
      children: [],
      parents: [],
      // Extract lesson group from name (e.g., "4.1a" from "4.1a: Random Process Definition")
      lessonGroup: extractLessonGroup(mode.name)
    });
  });

  // Phase 2: Build edges from unlockedBy relationships
  const modesArray = manifest.modes;
  modesArray.forEach((mode, index) => {
    if (mode.unlockedBy === 'default') {
      // Root node - no incoming edges
      return;
    }

    const requirement = mode.unlockedBy;
    let parentId = null;

    if (typeof requirement === 'object' && requirement.gold !== undefined) {
      // Gold star requirement - find the logical parent
      // In sequential progressions, parent is the previous level
      if (index > 0) {
        parentId = modesArray[index - 1].id;
      }
    } else if (typeof requirement === 'string') {
      // Direct level reference
      parentId = requirement;
    }

    if (parentId && nodes.has(parentId)) {
      edges.push({
        from: parentId,
        to: mode.id,
        type: 'progression',
        goldRequired: requirement?.gold || null
      });
      nodes.get(parentId).children.push(mode.id);
      nodes.get(mode.id).parents.push(parentId);
    }
  });

  // Phase 3: Calculate tier depths (BFS from root nodes)
  calculateTiers(nodes);

  // Group nodes by tier for positioning
  const tiers = groupByTier(nodes);

  return { nodes, edges, tiers };
}

/**
 * Extract lesson group identifier from mode name
 * @param {string} name - Mode name like "4.1a: Random Process Definition"
 * @returns {string|null} Lesson group like "4.1" or null
 */
function extractLessonGroup(name) {
  if (!name) return null;

  // Match patterns like "4.1a:", "4.1b:", "4.1-4.2", "Level 1:", etc.
  const match = name.match(/^(\d+\.\d+)/);
  return match ? match[1] : null;
}

/**
 * Calculate tier depths using BFS from root nodes
 * @param {Map} nodes - Map of node objects
 */
function calculateTiers(nodes) {
  // Find root nodes (no parents or unlockedBy === 'default')
  const roots = Array.from(nodes.values()).filter(
    n => n.parents.length === 0 || n.unlockedBy === 'default'
  );

  if (roots.length === 0) {
    console.warn('[MazeGenerator] No root nodes found');
    return;
  }

  // BFS to assign tiers
  const queue = roots.map(n => ({ id: n.id, tier: 0 }));
  const visited = new Set();

  while (queue.length > 0) {
    const { id, tier } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes.get(id);
    if (!node) continue;

    // Assign tier (use max if node has multiple parents)
    node.tier = Math.max(node.tier, tier);

    // Queue children
    for (const childId of node.children) {
      if (!visited.has(childId)) {
        queue.push({ id: childId, tier: tier + 1 });
      }
    }
  }

  // Handle any unvisited nodes (disconnected from root)
  for (const node of nodes.values()) {
    if (!visited.has(node.id)) {
      node.tier = node.index; // Fall back to index order
    }
  }
}

/**
 * Group nodes by their tier level
 * @param {Map} nodes - Map of node objects
 * @returns {Map} Map of tier number to array of nodes
 */
function groupByTier(nodes) {
  const tiers = new Map();

  for (const node of nodes.values()) {
    if (!tiers.has(node.tier)) {
      tiers.set(node.tier, []);
    }
    tiers.get(node.tier).push(node);
  }

  return tiers;
}

/**
 * Position all nodes in 3D space based on tier
 * @param {Map} nodes - Map of node objects
 * @param {Map} tiers - Map of tier to nodes array
 * @param {Object} options - Positioning options
 * @returns {void} Modifies nodes in place
 */
export function positionNodes(nodes, tiers, options = {}) {
  const {
    tierHeight = TIER_HEIGHT,
    nodeSpread = NODE_SPREAD,
    spiralFactor = SPIRAL_FACTOR
  } = options;

  // Sort tiers by tier number
  const sortedTiers = Array.from(tiers.entries()).sort((a, b) => a[0] - b[0]);

  for (const [tier, tierNodes] of sortedTiers) {
    const count = tierNodes.length;
    const radius = nodeSpread * (1 + tier * spiralFactor);

    tierNodes.forEach((node, index) => {
      if (count === 1) {
        // Center single node on Y-axis
        node.position = {
          x: 0,
          y: tier * tierHeight,
          z: 0
        };
      } else {
        // Distribute around a circle
        const angle = (index / count) * Math.PI * 2 - Math.PI / 2; // Start from top
        node.position = {
          x: Math.cos(angle) * radius,
          y: tier * tierHeight,
          z: Math.sin(angle) * radius
        };
      }
    });
  }
}

/**
 * Calculate progress state for each node based on player data
 * @param {Map} nodes - Map of node objects
 * @param {Object} playerProgress - Player progress data from game engine
 * @returns {Map} Map of nodeId to { unlocked, completed, current, stars }
 */
export function calculateProgress(nodes, playerProgress) {
  const progressMap = new Map();

  if (!playerProgress) {
    // No progress data - all locked except root
    for (const node of nodes.values()) {
      progressMap.set(node.id, {
        unlocked: node.unlockedBy === 'default',
        completed: false,
        current: false,
        stars: { gold: 0, silver: 0, bronze: 0, tin: 0 }
      });
    }
    return progressMap;
  }

  const {
    completedLevels = new Set(),
    currentLevel = null,
    stars = {},
    totalGold = 0
  } = playerProgress;

  for (const node of nodes.values()) {
    const isCompleted = completedLevels.has(node.id);
    const isCurrent = currentLevel === node.id;

    // Determine unlock status
    let isUnlocked = false;
    if (node.unlockedBy === 'default') {
      isUnlocked = true;
    } else if (typeof node.unlockedBy === 'object' && node.unlockedBy.gold !== undefined) {
      isUnlocked = totalGold >= node.unlockedBy.gold;
    } else if (typeof node.unlockedBy === 'string') {
      isUnlocked = completedLevels.has(node.unlockedBy);
    }

    progressMap.set(node.id, {
      unlocked: isUnlocked || isCompleted, // Completed implies unlocked
      completed: isCompleted,
      current: isCurrent,
      stars: stars[node.id] || { gold: 0, silver: 0, bronze: 0, tin: 0 }
    });
  }

  return progressMap;
}

/**
 * Get a node by its ID
 * @param {Map} nodes - Map of node objects
 * @param {string} id - Node ID to find
 * @returns {Object|null} Node object or null
 */
export function getNodeById(nodes, id) {
  return nodes.get(id) || null;
}

/**
 * Get all child nodes of a given node
 * @param {Map} nodes - Map of node objects
 * @param {string} nodeId - Parent node ID
 * @returns {Array} Array of child node objects
 */
export function getChildNodes(nodes, nodeId) {
  const node = nodes.get(nodeId);
  if (!node) return [];

  return node.children.map(childId => nodes.get(childId)).filter(Boolean);
}

/**
 * Get all parent nodes of a given node
 * @param {Map} nodes - Map of node objects
 * @param {string} nodeId - Child node ID
 * @returns {Array} Array of parent node objects
 */
export function getParentNodes(nodes, nodeId) {
  const node = nodes.get(nodeId);
  if (!node) return [];

  return node.parents.map(parentId => nodes.get(parentId)).filter(Boolean);
}

/**
 * Find the path from root to a given node
 * @param {Map} nodes - Map of node objects
 * @param {string} targetId - Target node ID
 * @returns {Array} Array of node IDs representing the path
 */
export function findPathToNode(nodes, targetId) {
  const target = nodes.get(targetId);
  if (!target) return [];

  const path = [targetId];
  let current = target;

  // Walk up the parent chain (take first parent for linear paths)
  while (current.parents.length > 0) {
    const parentId = current.parents[0];
    path.unshift(parentId);
    current = nodes.get(parentId);
    if (!current) break;
  }

  return path;
}

/**
 * Get statistics about the maze graph
 * @param {Map} nodes - Map of node objects
 * @param {Array} edges - Array of edge objects
 * @param {Map} tiers - Map of tier to nodes
 * @returns {Object} Statistics object
 */
export function getMazeStats(nodes, edges, tiers) {
  const tierCounts = [];
  for (const [tier, tierNodes] of tiers) {
    tierCounts.push({ tier, count: tierNodes.length });
  }

  // Find max branching factor
  let maxBranching = 0;
  for (const node of nodes.values()) {
    maxBranching = Math.max(maxBranching, node.children.length);
  }

  // Find longest path (max tier)
  const maxTier = Math.max(...tierCounts.map(t => t.tier));

  return {
    totalNodes: nodes.size,
    totalEdges: edges.length,
    totalTiers: tiers.size,
    maxTier,
    maxBranching,
    tierCounts,
    // Identify capstone levels (high tier, few/no children)
    capstones: Array.from(nodes.values())
      .filter(n => n.children.length === 0 && n.tier > 0)
      .map(n => n.id)
  };
}

/**
 * Generate a debug string representation of the maze
 * @param {Map} nodes - Map of node objects
 * @param {Array} edges - Array of edge objects
 * @returns {string} ASCII representation
 */
export function debugMaze(nodes, edges) {
  const lines = ['=== MAZE DEBUG ==='];

  // Sort nodes by tier
  const sortedNodes = Array.from(nodes.values()).sort((a, b) => a.tier - b.tier);

  let currentTier = -1;
  for (const node of sortedNodes) {
    if (node.tier !== currentTier) {
      currentTier = node.tier;
      lines.push(`\n--- Tier ${currentTier} ---`);
    }

    const children = node.children.join(', ') || 'none';
    const pos = node.position
      ? `(${node.position.x.toFixed(1)}, ${node.position.y.toFixed(1)}, ${node.position.z.toFixed(1)})`
      : '(not positioned)';

    lines.push(`  [${node.id}] "${node.name}" -> children: ${children} @ ${pos}`);
  }

  lines.push('\n--- Edges ---');
  for (const edge of edges) {
    const goldReq = edge.goldRequired ? ` (gold: ${edge.goldRequired})` : '';
    lines.push(`  ${edge.from} --> ${edge.to}${goldReq}`);
  }

  return lines.join('\n');
}

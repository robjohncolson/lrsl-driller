/**
 * ghost-engine.js
 * Main orchestrator for Ghost behavioral AI companion
 *
 * Manages:
 * - Ghost profile lifecycle (create, load, save)
 * - Interaction recording and training
 * - Server synchronization
 * - Visual property derivation (color, opacity)
 */

import * as GhostNetwork from './ghost-network.js';

// Configuration
const BUFFER_SIZE = 50;        // Experience replay buffer size
const BATCH_SIZE = 8;          // Training batch size
const OPACITY_THRESHOLD = 100; // Interactions for full opacity
const SYNC_DEBOUNCE_MS = 2000; // Debounce server sync
const MAX_INTERACTION_BUFFER = 200; // Max interactions to buffer before TF loads

// State
let model = null;
let profile = null;
let syncTimeout = null;
let serverBaseUrl = '';

// Lazy loading state
let tfLoaded = false;
let interactionBuffer = [];  // Buffer while TF not loaded

/**
 * Initialize the Ghost Engine
 * @param {Object} tfInstance - TensorFlow.js instance (window.tf) - optional, can be null for lazy loading
 * @param {string} baseUrl - Server base URL for API calls
 */
export function init(tfInstance, baseUrl = '') {
  if (tfInstance) {
    GhostNetwork.initTensorFlow(tfInstance);
    tfLoaded = true;
    console.log('[Ghost] TensorFlow.js initialized immediately');
  } else {
    console.log('[Ghost] Running in buffered mode - TensorFlow will load lazily');
  }
  serverBaseUrl = baseUrl;
}

/**
 * Initialize or load a ghost for a user/cartridge combination
 * @param {string} username - Student username
 * @param {string} cartridgeId - Current cartridge ID
 * @returns {Promise<Object>} Ghost profile
 */
export async function initGhost(username, cartridgeId) {
  // Try to load from localStorage first
  profile = loadFromLocalStorage(username, cartridgeId);

  if (profile) {
    // Only restore model if TF is loaded
    if (tfLoaded) {
      model = GhostNetwork.createGhostNetwork();
      GhostNetwork.deserializeWeights(model, profile.weights);
    }
    console.log(`[Ghost] Loaded existing ghost for ${username} (${profile.total_interactions} interactions)${!tfLoaded ? ' [buffered mode]' : ''}`);
  } else {
    // Create new ghost - defer model creation if TF not loaded
    if (tfLoaded) {
      model = GhostNetwork.createGhostNetwork();
      profile = {
        username,
        cartridge_id: cartridgeId,
        weights: GhostNetwork.serializeWeights(model),
        buffer: [],
        total_interactions: 0,
        proficiency_score: 0,
        color: 'white',
        opacity: 0.1,
        last_updated: new Date().toISOString(),
        version: 1
      };
    } else {
      // TF not loaded yet - create profile without weights
      profile = {
        username,
        cartridge_id: cartridgeId,
        weights: null, // Will be created when TF loads
        buffer: [],
        total_interactions: 0,
        proficiency_score: 0,
        color: 'white',
        opacity: 0.1,
        last_updated: new Date().toISOString(),
        version: 1
      };
    }
    saveToLocalStorage();
    console.log(`[Ghost] Created new ghost for ${username}${!tfLoaded ? ' [buffered mode]' : ''}`);
  }

  // Try to sync with server (may have newer data)
  await attemptServerSync();

  return profile;
}

/**
 * Record an interaction and train the ghost
 * Called after each graded problem
 * @param {Object} data - Interaction data from app.html
 * @returns {Promise<void>}
 */
export async function recordInteraction(data) {
  if (!profile) {
    console.warn('[Ghost] Cannot record - ghost not initialized');
    return;
  }

  // Build normalized interaction record
  const interaction = buildInteraction(data);

  // If TF not loaded or model not ready, buffer the interaction
  if (!tfLoaded || !model) {
    interactionBuffer.push(interaction);
    if (interactionBuffer.length > MAX_INTERACTION_BUFFER) {
      interactionBuffer.shift(); // Keep buffer bounded
    }

    // Still update profile's buffer and stats for persistence
    profile.buffer.push(interaction);
    if (profile.buffer.length > BUFFER_SIZE) {
      profile.buffer.shift();
    }
    profile.total_interactions++;
    profile.last_updated = new Date().toISOString();
    profile.version++;
    saveToLocalStorage();

    console.log(`[Ghost] Buffered interaction #${profile.total_interactions} (${interactionBuffer.length} pending, TF not loaded)`);
    return;
  }

  // Normal training path (TF is loaded)
  // Add to circular buffer
  profile.buffer.push(interaction);
  if (profile.buffer.length > BUFFER_SIZE) {
    profile.buffer.shift();
  }

  // Sample batch and train
  const batch = sampleRandom(profile.buffer, Math.min(BATCH_SIZE, profile.buffer.length));
  await GhostNetwork.trainOnBatch(model, batch);

  // Update profile
  profile.weights = GhostNetwork.serializeWeights(model);
  profile.total_interactions++;
  profile.proficiency_score = await calculateProficiency();
  profile.color = calculateColor(profile.proficiency_score);
  profile.opacity = calculateOpacity(profile.total_interactions);
  profile.last_updated = new Date().toISOString();
  profile.version++;

  // Persist locally
  saveToLocalStorage();

  // Queue server sync (debounced)
  queueServerSync();

  console.log(`[Ghost] Trained on interaction #${profile.total_interactions}, proficiency: ${(profile.proficiency_score * 100).toFixed(1)}% (${profile.color})`);
}

/**
 * Build a normalized interaction record from raw data
 * @param {Object} data - Raw interaction data
 * @returns {Object} Normalized interaction
 */
function buildInteraction(data) {
  // Normalize inputs (all 0-1 range)
  const inputs = [
    data.levelIndex / Math.max(1, data.totalLevels),        // level_progress
    Math.min(data.sessionMinutes / 30, 1.0),                // time_in_session
    Math.min(data.currentStreak / 10, 1.0),                 // current_streak
    data.recentAccuracy || 0.5,                             // recent_accuracy
    (data.hintsRemaining || 3) / 3,                         // hints_remaining
    Math.min(data.problemsThisSession / 30, 1.0),           // problems_this_session
    Math.min((data.retryCount || 0) / 3, 1.0),              // retry_count
    data.sessionAccuracy || 0.5,                            // session_accuracy
    new Date().getHours() / 24,                             // time_of_day
    (data.levelTier || 0) / 3                               // level_tier
  ];

  // Normalize outputs (training labels)
  const timeMs = data.timeToAnswerMs || 10000;
  const outputs = [
    Math.min(timeMs / 60000, 1.0),                          // time (normalized)
    data.correct ? 1.0 : 0.0,                               // correct_prob
    (data.hintsUsed || 0) > 0 ? 1.0 : 0.0,                  // hint_prob
    timeMs < 10000 ? 1.0 : 0.0                              // quick_answer_prob
  ];

  return {
    timestamp: new Date().toISOString(),
    level_id: data.levelId || '',
    topic_id: data.topicId || '',
    inputs,
    outputs,
    raw: {
      time_ms: timeMs,
      correct: data.correct,
      score: data.score,
      hints_used: data.hintsUsed || 0,
      streak_at_time: data.currentStreak || 0
    }
  };
}

/**
 * Calculate proficiency by running ghost on synthetic test cases
 * @returns {Promise<number>} Proficiency score 0-1
 */
async function calculateProficiency() {
  const testCases = generateTestCases();
  let totalCorrectProb = 0;

  for (const inputs of testCases) {
    const prediction = GhostNetwork.predict(model, inputs);
    totalCorrectProb += prediction.correctProb;
  }

  return totalCorrectProb / testCases.length;
}

/**
 * Generate synthetic test cases spanning difficulty spectrum
 * @returns {number[][]} Array of input vectors
 */
function generateTestCases() {
  const cases = [];
  for (let level = 0; level <= 1; level += 0.25) {
    cases.push([
      level,      // level_progress
      0.5,        // time_in_session (middle)
      0.3,        // current_streak (moderate)
      0.7,        // recent_accuracy (decent)
      1.0,        // hints_remaining (full)
      0.3,        // problems_this_session
      0.0,        // retry_count (first attempt)
      0.7,        // session_accuracy
      0.5,        // time_of_day (midday)
      level       // level_tier matches progress
    ]);
  }
  return cases;
}

/**
 * Derive ghost color from proficiency score
 * @param {number} proficiency - Score 0-1
 * @returns {string} Color name
 */
export function calculateColor(proficiency) {
  if (proficiency < 0.2) return 'white';
  if (proficiency < 0.4) return 'yellow';
  if (proficiency < 0.6) return 'orange';
  if (proficiency < 0.8) return 'red';
  return 'indigo';
}

/**
 * Derive ghost opacity from interaction count
 * @param {number} interactions - Total interaction count
 * @returns {number} Opacity 0.1-1.0
 */
export function calculateOpacity(interactions) {
  return Math.min(0.1 + (interactions / OPACITY_THRESHOLD) * 0.9, 1.0);
}

/**
 * Sample random items from array
 * @param {Array} array - Source array
 * @param {number} n - Number of items to sample
 * @returns {Array} Random sample
 */
function sampleRandom(array, n) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ============== Lazy Loading Functions ==============

/**
 * Dynamically load TensorFlow.js script
 * @returns {Promise<void>} Resolves when TF is loaded
 */
function loadTensorFlowScript() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.tf) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
    script.onload = () => {
      console.log('[Ghost] TensorFlow.js loaded dynamically, version:', window.tf.version.tfjs);
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load TensorFlow.js'));
    document.head.appendChild(script);
  });
}

/**
 * Ensure TensorFlow.js is loaded and process buffered interactions
 * Call this when ghost panel opens or when TF features are needed
 * @returns {Promise<boolean>} True if TF loaded successfully
 */
export async function ensureTensorFlowLoaded() {
  if (tfLoaded) {
    return true;
  }

  try {
    // Dynamically load TensorFlow.js
    if (!window.tf) {
      console.log('[Ghost] Loading TensorFlow.js on demand...');
      await loadTensorFlowScript();
    }

    GhostNetwork.initTensorFlow(window.tf);
    tfLoaded = true;

    // Create model if we have a profile
    if (profile) {
      model = GhostNetwork.createGhostNetwork();

      // Restore weights if they exist
      if (profile.weights && Array.isArray(profile.weights) && profile.weights.length > 0) {
        try {
          GhostNetwork.deserializeWeights(model, profile.weights);
          console.log('[Ghost] Restored model weights from profile');
        } catch (err) {
          console.warn('[Ghost] Could not restore weights, starting fresh:', err.message);
        }
      }

      // Process buffered interactions
      if (interactionBuffer.length > 0) {
        console.log(`[Ghost] Processing ${interactionBuffer.length} buffered interactions...`);
        await GhostNetwork.trainOnBatch(model, interactionBuffer);

        // Update profile with trained model
        profile.weights = GhostNetwork.serializeWeights(model);
        profile.proficiency_score = await calculateProficiency();
        profile.color = calculateColor(profile.proficiency_score);
        profile.opacity = calculateOpacity(profile.total_interactions);
        saveToLocalStorage();

        console.log(`[Ghost] Batch training complete, proficiency: ${(profile.proficiency_score * 100).toFixed(1)}%`);

        // Clear the interaction buffer
        interactionBuffer = [];
      }
    }

    console.log('[Ghost] TensorFlow.js now ready for real-time training');
    return true;
  } catch (err) {
    console.error('[Ghost] Failed to load TensorFlow:', err);
    return false;
  }
}

/**
 * Check if TensorFlow.js is loaded
 * @returns {boolean} True if TF is ready
 */
export function isTensorFlowLoaded() {
  return tfLoaded;
}

/**
 * Get the number of buffered interactions
 * @returns {number} Count of buffered interactions
 */
export function getBufferedInteractionCount() {
  return interactionBuffer.length;
}

// ============== localStorage Functions ==============

/**
 * Get storage key for ghost data
 * @param {string} suffix - Key suffix (weights, buffer, meta)
 * @returns {string} Full storage key
 */
function getStorageKey(suffix) {
  return `ghost_${profile.cartridge_id}_${profile.username}_${suffix}`;
}

/**
 * Save ghost profile to localStorage
 */
function saveToLocalStorage() {
  try {
    localStorage.setItem(getStorageKey('weights'), JSON.stringify(profile.weights));
    localStorage.setItem(getStorageKey('buffer'), JSON.stringify(profile.buffer));
    localStorage.setItem(getStorageKey('meta'), JSON.stringify({
      total_interactions: profile.total_interactions,
      proficiency_score: profile.proficiency_score,
      color: profile.color,
      opacity: profile.opacity,
      version: profile.version,
      last_updated: profile.last_updated
    }));
  } catch (err) {
    console.warn('[Ghost] localStorage save failed:', err);
  }
}

/**
 * Load ghost profile from localStorage
 * @param {string} username - Student username
 * @param {string} cartridgeId - Cartridge ID
 * @returns {Object|null} Ghost profile or null
 */
function loadFromLocalStorage(username, cartridgeId) {
  try {
    const key = `ghost_${cartridgeId}_${username}`;
    const weights = localStorage.getItem(`${key}_weights`);
    const buffer = localStorage.getItem(`${key}_buffer`);
    const meta = localStorage.getItem(`${key}_meta`);

    if (!weights || !meta) return null;

    const metaObj = JSON.parse(meta);
    return {
      username,
      cartridge_id: cartridgeId,
      weights: JSON.parse(weights),
      buffer: buffer ? JSON.parse(buffer) : [],
      ...metaObj
    };
  } catch (err) {
    console.warn('[Ghost] localStorage load failed:', err);
    return null;
  }
}

// ============== Server Sync Functions ==============

/**
 * Queue a server sync (debounced)
 */
function queueServerSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => syncToServer(), SYNC_DEBOUNCE_MS);
}

/**
 * Sync ghost profile to server
 * @returns {Promise<void>}
 */
export async function syncToServer() {
  if (!profile) return;

  try {
    const response = await fetch(`${serverBaseUrl}/api/ghost/${profile.cartridge_id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: profile.username,
        weights: profile.weights,
        buffer: profile.buffer,
        total_interactions: profile.total_interactions,
        proficiency_score: profile.proficiency_score,
        color: profile.color,
        opacity: profile.opacity,
        version: profile.version
      })
    });

    if (response.ok) {
      console.log('[Ghost] Synced to server successfully');
    } else {
      console.warn('[Ghost] Server sync failed:', response.status);
    }
  } catch (err) {
    console.warn('[Ghost] Server sync error:', err.message);
    // Will retry on next interaction
  }
}

/**
 * Load ghost profile from server
 * @returns {Promise<Object|null>} Server profile or null
 */
export async function loadFromServer() {
  if (!profile) return null;

  try {
    const response = await fetch(
      `${serverBaseUrl}/api/ghost/${profile.cartridge_id}/${profile.username}`
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[Ghost] Server load error:', err.message);
  }
  return null;
}

/**
 * Attempt to sync with server, resolve conflicts
 * @returns {Promise<void>}
 */
async function attemptServerSync() {
  try {
    const serverProfile = await loadFromServer();

    if (serverProfile && serverProfile.version > profile.version) {
      // Server has newer data, use it
      console.log('[Ghost] Server has newer version, updating local');
      profile = {
        ...serverProfile,
        username: profile.username,
        cartridge_id: profile.cartridge_id
      };
      // Only deserialize weights if TF is loaded and model exists
      if (tfLoaded && model && profile.weights) {
        GhostNetwork.deserializeWeights(model, profile.weights);
      }
      saveToLocalStorage();
    } else if (profile.version > (serverProfile?.version || 0)) {
      // Local is newer, push to server
      console.log('[Ghost] Local version newer, pushing to server');
      if (profile.weights && Array.isArray(profile.weights)) {
        await syncToServer();
      } else {
        console.log('[Ghost] Skipping server sync (weights not initialized yet)');
      }
    }
  } catch (err) {
    console.warn('[Ghost] Server sync attempt failed:', err.message);
  }
}

// ============== Public Getters ==============

/**
 * Get the current ghost profile
 * @returns {Object|null} Ghost profile
 */
export function getGhostProfile() {
  return profile;
}

/**
 * Get a prediction from the ghost for a given situation
 * @param {number[]} inputs - 10 normalized input features
 * @returns {Object} Predictions
 */
export function getGhostPrediction(inputs) {
  if (!model) {
    console.warn('[Ghost] Cannot predict - model not initialized');
    return { time: 30, correctProb: 0.5, hintProb: 0.2, quickProb: 0.3 };
  }
  return GhostNetwork.predict(model, inputs);
}

/**
 * Check if ghost is initialized (profile exists)
 * Note: In buffered mode, profile exists but model may not
 * @returns {boolean} True if ghost profile is ready
 */
export function isInitialized() {
  return profile !== null;
}

/**
 * Check if ghost is fully ready for training/predictions
 * @returns {boolean} True if both model and profile are ready
 */
export function isFullyReady() {
  return model !== null && profile !== null && tfLoaded;
}

/**
 * Reset the ghost (for testing or user request)
 * @returns {Promise<void>}
 */
export async function resetGhost() {
  if (!profile) return;

  const { username, cartridge_id } = profile;

  // Clear localStorage
  const key = `ghost_${cartridge_id}_${username}`;
  localStorage.removeItem(`${key}_weights`);
  localStorage.removeItem(`${key}_buffer`);
  localStorage.removeItem(`${key}_meta`);

  // Create fresh ghost
  model = GhostNetwork.createGhostNetwork();
  profile = {
    username,
    cartridge_id,
    weights: GhostNetwork.serializeWeights(model),
    buffer: [],
    total_interactions: 0,
    proficiency_score: 0,
    color: 'white',
    opacity: 0.1,
    last_updated: new Date().toISOString(),
    version: 1
  };

  saveToLocalStorage();
  await syncToServer();

  console.log('[Ghost] Ghost reset complete');
}

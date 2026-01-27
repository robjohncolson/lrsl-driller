# Ghost System Phase 1: Technical Specification

Implementation guide for Ghost Profile Infrastructure with neural network approach.

**Status**: Ready for Implementation
**Depends on**: TensorFlow.js
**Estimated Files**: 3 new, 3 modified

---

## 1. Neural Network Architecture

### 1.1 Input Features (10 dimensions)

| # | Feature | Description | Normalization |
|---|---------|-------------|---------------|
| 0 | `level_progress` | Position in cartridge | level_index / total_levels |
| 1 | `time_in_session` | Minutes since session start | min(minutes / 30, 1.0) |
| 2 | `current_streak` | Consecutive correct answers | min(streak / 10, 1.0) |
| 3 | `recent_accuracy` | Last 5 problems accuracy | correct_count / 5 |
| 4 | `hints_remaining` | Hints left for this problem | hints / 3 |
| 5 | `problems_this_session` | Problems attempted | min(count / 30, 1.0) |
| 6 | `retry_count` | Retries on current problem | min(retries / 3, 1.0) |
| 7 | `session_accuracy` | Overall session accuracy | correct / total |
| 8 | `time_of_day` | Hour of day | hour / 24 |
| 9 | `level_tier` | Difficulty tier (early/mid/late) | tier_index / 3 |

### 1.2 Output Predictions (4 dimensions)

| # | Output | Description | Range | Activation |
|---|--------|-------------|-------|------------|
| 0 | `time_to_answer` | Predicted response time | 0-1 (seconds/60) | Linear |
| 1 | `correct_prob` | Probability of correct | 0-1 | Sigmoid |
| 2 | `hint_prob` | Probability of using hint | 0-1 | Sigmoid |
| 3 | `quick_answer_prob` | Prob of answering < 10s | 0-1 | Sigmoid |

### 1.3 Network Structure

```
Input Layer:  10 neurons
Hidden 1:     16 neurons (ReLU)
Hidden 2:     16 neurons (ReLU)
Output Layer:  4 neurons (Linear, sigmoid applied post-hoc)

Total Parameters: 516
  - Input→H1:  10×16 + 16 = 176
  - H1→H2:     16×16 + 16 = 272
  - H2→Output: 16×4  + 4  = 68

Storage: ~2KB as Float32
```

### 1.4 Training Configuration

```javascript
{
  optimizer: 'adam',
  learningRate: 0.005,
  loss: 'meanSquaredError',
  batchSize: 8,          // samples from buffer per training step
  bufferSize: 50,        // experience replay buffer
  trainEvery: 1          // train after every N interactions
}
```

---

## 2. Data Structures

### 2.1 Interaction Record

Captured after each graded problem:

```typescript
interface GhostInteraction {
  // Metadata
  timestamp: string;          // ISO 8601
  level_id: string;           // "l33-random-var-def"
  topic_id: string;           // "4.7a"

  // Input features (pre-normalized)
  inputs: number[];           // [10 floats, 0-1 range]

  // Actual outcomes (training labels)
  outputs: number[];          // [4 floats, 0-1 range]

  // Raw values (for debugging/analysis)
  raw: {
    time_ms: number;
    correct: boolean;
    score: 'E' | 'P' | 'I';
    hints_used: number;
    streak_at_time: number;
  };
}
```

### 2.2 Ghost Profile

The persisted ghost state:

```typescript
interface GhostProfile {
  // Identity
  username: string;
  cartridge_id: string;

  // Neural network weights (serialized)
  weights: number[][];        // Layer weights as 2D arrays

  // Experience replay buffer
  buffer: GhostInteraction[]; // Last 50 interactions

  // Derived metrics
  total_interactions: number;
  proficiency_score: number;  // 0-1, derived from test predictions

  // Visual properties (derived)
  color: 'white' | 'yellow' | 'orange' | 'red' | 'indigo';
  opacity: number;            // 0.1 - 1.0

  // Sync metadata
  last_updated: string;       // ISO 8601
  version: number;            // For conflict resolution
}
```

### 2.3 localStorage Keys

```
ghost_weights_{cartridgeId}_{username}   → Float32Array as JSON
ghost_buffer_{cartridgeId}_{username}    → GhostInteraction[]
ghost_meta_{cartridgeId}_{username}      → { total, proficiency, color, opacity, version }
```

---

## 3. File Structure

### 3.1 New Files

```
platform/core/ghost-engine.js      # Main orchestrator
platform/core/ghost-network.js     # TensorFlow.js model
railway-server/migrations/013_ghost_profiles.sql
```

### 3.2 Modified Files

```
platform/app.html                  # Import & hook ghost engine
railway-server/server.js           # Ghost sync endpoints
package.json                       # Add @tensorflow/tfjs dependency
```

---

## 4. ghost-network.js

TensorFlow.js model definition and operations.

### 4.1 Exports

```javascript
// Model creation
createGhostNetwork() → tf.Sequential

// Serialization
serializeWeights(model) → number[][]
deserializeWeights(model, weights) → void

// Training
trainOnBatch(model, interactions) → Promise<void>

// Inference
predict(model, inputs) → { time, correctProb, hintProb, quickProb }
```

### 4.2 Model Definition

```javascript
import * as tf from '@tensorflow/tfjs';

const GHOST_CONFIG = {
  inputSize: 10,
  hiddenSize: 16,
  outputSize: 4,
  learningRate: 0.005
};

export function createGhostNetwork() {
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [GHOST_CONFIG.inputSize],
        units: GHOST_CONFIG.hiddenSize,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
      }),
      tf.layers.dense({
        units: GHOST_CONFIG.hiddenSize,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
      }),
      tf.layers.dense({
        units: GHOST_CONFIG.outputSize,
        activation: 'linear'  // We'll apply sigmoid to outputs 1-3 manually
      })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(GHOST_CONFIG.learningRate),
    loss: 'meanSquaredError'
  });

  return model;
}

export function serializeWeights(model) {
  return model.getWeights().map(w => Array.from(w.dataSync()));
}

export function deserializeWeights(model, weightsArrays) {
  const tensors = weightsArrays.map((arr, i) => {
    const shape = model.getWeights()[i].shape;
    return tf.tensor(arr, shape);
  });
  model.setWeights(tensors);
  tensors.forEach(t => t.dispose());
}

export async function trainOnBatch(model, interactions) {
  if (interactions.length === 0) return;

  const xs = tf.tensor2d(interactions.map(i => i.inputs));
  const ys = tf.tensor2d(interactions.map(i => i.outputs));

  await model.fit(xs, ys, {
    epochs: 1,
    batchSize: interactions.length,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();
}

export function predict(model, inputs) {
  const inputTensor = tf.tensor2d([inputs]);
  const outputTensor = model.predict(inputTensor);
  const outputs = outputTensor.dataSync();

  inputTensor.dispose();
  outputTensor.dispose();

  return {
    time: Math.max(0, outputs[0]) * 60,  // Denormalize to seconds
    correctProb: sigmoid(outputs[1]),
    hintProb: sigmoid(outputs[2]),
    quickProb: sigmoid(outputs[3])
  };
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
```

---

## 5. ghost-engine.js

Main orchestrator that manages ghost lifecycle.

### 5.1 Exports

```javascript
// Initialization
initGhost(username, cartridgeId) → Promise<GhostProfile>

// Recording
recordInteraction(interactionData) → Promise<void>

// Queries
getGhostProfile() → GhostProfile
getGhostPrediction(situationInputs) → Prediction

// Sync
syncToServer() → Promise<void>
loadFromServer() → Promise<GhostProfile | null>

// Derived properties
calculateColor(proficiency) → string
calculateOpacity(interactions) → number
```

### 5.2 Core Logic

```javascript
import * as GhostNetwork from './ghost-network.js';

const BUFFER_SIZE = 50;
const BATCH_SIZE = 8;
const OPACITY_THRESHOLD = 100;  // interactions for full opacity

let model = null;
let profile = null;
let syncQueue = [];
let syncTimeout = null;

export async function initGhost(username, cartridgeId) {
  // Try to load from localStorage first
  profile = loadFromLocalStorage(username, cartridgeId);

  if (profile) {
    // Restore model from saved weights
    model = GhostNetwork.createGhostNetwork();
    GhostNetwork.deserializeWeights(model, profile.weights);
  } else {
    // Create new ghost
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
    saveToLocalStorage();
  }

  // Try to sync with server (may have newer data)
  await attemptServerSync();

  return profile;
}

export async function recordInteraction(data) {
  // Build interaction record
  const interaction = buildInteraction(data);

  // Add to buffer (circular)
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

  // Queue server sync
  queueServerSync();
}

function buildInteraction(data) {
  // Normalize inputs
  const inputs = [
    data.levelIndex / data.totalLevels,                    // level_progress
    Math.min(data.sessionMinutes / 30, 1.0),               // time_in_session
    Math.min(data.currentStreak / 10, 1.0),                // current_streak
    data.recentAccuracy,                                    // recent_accuracy (already 0-1)
    data.hintsRemaining / 3,                                // hints_remaining
    Math.min(data.problemsThisSession / 30, 1.0),          // problems_this_session
    Math.min(data.retryCount / 3, 1.0),                    // retry_count
    data.sessionAccuracy,                                   // session_accuracy (already 0-1)
    new Date().getHours() / 24,                            // time_of_day
    data.levelTier / 3                                      // level_tier (0=early, 1=mid, 2=late)
  ];

  // Normalize outputs (training labels)
  const outputs = [
    Math.min(data.timeToAnswerMs / 60000, 1.0),            // time (ms → normalized)
    data.correct ? 1.0 : 0.0,                              // correct_prob
    data.hintsUsed > 0 ? 1.0 : 0.0,                        // hint_prob
    data.timeToAnswerMs < 10000 ? 1.0 : 0.0                // quick_answer_prob
  ];

  return {
    timestamp: new Date().toISOString(),
    level_id: data.levelId,
    topic_id: data.topicId,
    inputs,
    outputs,
    raw: {
      time_ms: data.timeToAnswerMs,
      correct: data.correct,
      score: data.score,
      hints_used: data.hintsUsed,
      streak_at_time: data.currentStreak
    }
  };
}

async function calculateProficiency() {
  // Run ghost on synthetic "test set" spanning all difficulty levels
  // Average the correctProb predictions
  const testCases = generateTestCases();
  let totalCorrectProb = 0;

  for (const inputs of testCases) {
    const prediction = GhostNetwork.predict(model, inputs);
    totalCorrectProb += prediction.correctProb;
  }

  return totalCorrectProb / testCases.length;
}

function generateTestCases() {
  // Generate representative inputs across difficulty spectrum
  const cases = [];
  for (let level = 0; level <= 1; level += 0.25) {
    cases.push([
      level,      // level_progress
      0.5,        // time_in_session (middle of session)
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

export function calculateColor(proficiency) {
  if (proficiency < 0.2) return 'white';
  if (proficiency < 0.4) return 'yellow';
  if (proficiency < 0.6) return 'orange';
  if (proficiency < 0.8) return 'red';
  return 'indigo';
}

export function calculateOpacity(interactions) {
  return Math.min(0.1 + (interactions / OPACITY_THRESHOLD) * 0.9, 1.0);
}

function sampleRandom(array, n) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// localStorage functions
function getStorageKey(suffix) {
  return `ghost_${profile.cartridge_id}_${profile.username}_${suffix}`;
}

function saveToLocalStorage() {
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
}

function loadFromLocalStorage(username, cartridgeId) {
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
}

// Server sync functions
function queueServerSync() {
  // Debounce: wait 2 seconds after last interaction before syncing
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => syncToServer(), 2000);
}

export async function syncToServer() {
  if (!profile) return;

  try {
    const response = await fetch(`/api/ghost/${profile.cartridge_id}/sync`, {
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

    if (!response.ok) {
      console.warn('Ghost sync failed:', response.status);
    }
  } catch (err) {
    console.warn('Ghost sync error:', err);
    // Will retry on next interaction
  }
}

export async function loadFromServer() {
  if (!profile) return null;

  try {
    const response = await fetch(
      `/api/ghost/${profile.cartridge_id}/${profile.username}`
    );

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Ghost load error:', err);
  }
  return null;
}

async function attemptServerSync() {
  const serverProfile = await loadFromServer();

  if (serverProfile && serverProfile.version > profile.version) {
    // Server has newer data, use it
    profile = serverProfile;
    GhostNetwork.deserializeWeights(model, profile.weights);
    saveToLocalStorage();
  } else if (profile.version > (serverProfile?.version || 0)) {
    // Local is newer, push to server
    await syncToServer();
  }
}

export function getGhostProfile() {
  return profile;
}

export function getGhostPrediction(situationInputs) {
  return GhostNetwork.predict(model, situationInputs);
}
```

---

## 6. Database Schema

### 6.1 Migration: 013_ghost_profiles.sql

```sql
-- Ghost profiles table
CREATE TABLE IF NOT EXISTS ghost_profiles (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  cartridge_id TEXT NOT NULL,

  -- Neural network state
  weights JSONB NOT NULL,
  buffer JSONB,

  -- Derived metrics
  total_interactions INTEGER DEFAULT 0,
  proficiency_score FLOAT DEFAULT 0,
  color TEXT DEFAULT 'white',
  opacity FLOAT DEFAULT 0.1,

  -- Sync metadata
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(username, cartridge_id)
);

-- Index for leaderboard queries
CREATE INDEX idx_ghost_profiles_cartridge_proficiency
  ON ghost_profiles(cartridge_id, proficiency_score DESC);

-- Index for user lookups
CREATE INDEX idx_ghost_profiles_username
  ON ghost_profiles(username);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_ghost_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ghost_profiles_updated
  BEFORE UPDATE ON ghost_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_ghost_timestamp();
```

---

## 7. Server Endpoints

### 7.1 POST /api/ghost/:cartridgeId/sync

Upsert ghost profile.

```javascript
app.post('/api/ghost/:cartridgeId/sync', async (req, res) => {
  const { cartridgeId } = req.params;
  const {
    username, weights, buffer, total_interactions,
    proficiency_score, color, opacity, version
  } = req.body;

  if (!username || !weights) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('ghost_profiles')
      .upsert({
        username,
        cartridge_id: cartridgeId,
        weights,
        buffer,
        total_interactions,
        proficiency_score,
        color,
        opacity,
        version
      }, {
        onConflict: 'username,cartridge_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, profile: data });
  } catch (err) {
    console.error('Ghost sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});
```

### 7.2 GET /api/ghost/:cartridgeId/:username

Retrieve ghost profile.

```javascript
app.get('/api/ghost/:cartridgeId/:username', async (req, res) => {
  const { cartridgeId, username } = req.params;

  try {
    const { data, error } = await supabase
      .from('ghost_profiles')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.status(404).json({ error: 'Ghost not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Ghost load error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});
```

### 7.3 GET /api/ghost/:cartridgeId/leaderboard

Get all ghosts for a cartridge (for landscape view).

```javascript
app.get('/api/ghost/:cartridgeId/leaderboard', async (req, res) => {
  const { cartridgeId } = req.params;
  const { class_period } = req.query;

  try {
    let query = supabase
      .from('ghost_profiles')
      .select('username, total_interactions, proficiency_score, color, opacity, updated_at')
      .eq('cartridge_id', cartridgeId)
      .order('proficiency_score', { ascending: false });

    // Optionally filter by class period (join with roster)
    // This would need a more complex query with roster table

    const { data, error } = await query;

    if (error) throw error;

    res.json({ ghosts: data });
  } catch (err) {
    console.error('Ghost leaderboard error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});
```

---

## 8. Integration with app.html

### 8.1 Import Ghost Engine

Add to imports section (~line 780):

```javascript
import * as GhostEngine from './core/ghost-engine.js';
```

### 8.2 Initialize Ghost on Login

In user authentication flow:

```javascript
async function onUserAuthenticated(username) {
  // ... existing code ...

  // Initialize ghost for current cartridge
  const cartridgeId = getCurrentCartridgeId();
  if (cartridgeId) {
    await GhostEngine.initGhost(username, cartridgeId);
  }
}
```

### 8.3 Hook into onGradingComplete

Modify `onGradingComplete` callback (~line 3095):

```javascript
async function onGradingComplete(result) {
  // ... existing star/progress logic ...

  // Record interaction for ghost training
  if (window.currentUser) {
    const interactionData = {
      // Level info
      levelId: currentMode.id,
      levelIndex: modes.findIndex(m => m.id === currentMode.id),
      totalLevels: modes.length,
      topicId: result.context?.topicId || '',
      levelTier: getLevelTier(currentMode.id),

      // Timing
      timeToAnswerMs: problemStartTime ? Date.now() - problemStartTime : 10000,
      sessionMinutes: getSessionDuration() / 60000,

      // Outcome
      correct: result.score === 'E',
      score: result.score,
      hintsUsed: hintsUsedThisProblem,
      hintsRemaining: 3 - hintsUsedThisProblem,

      // Context
      currentStreak: gameEngine.getStreak(),
      recentAccuracy: getRecentAccuracy(5),
      problemsThisSession: problemsThisSession,
      sessionAccuracy: sessionCorrect / Math.max(1, problemsThisSession),
      retryCount: retriesThisProblem
    };

    await GhostEngine.recordInteraction(interactionData);
  }
}

function getLevelTier(levelId) {
  // 0 = early (first third), 1 = mid, 2 = late
  const index = modes.findIndex(m => m.id === levelId);
  const third = modes.length / 3;
  if (index < third) return 0;
  if (index < third * 2) return 1;
  return 2;
}

function getRecentAccuracy(n) {
  // Get accuracy of last n problems from history
  const recent = problemHistory.slice(-n);
  if (recent.length === 0) return 0.5;
  return recent.filter(p => p.correct).length / recent.length;
}
```

### 8.4 Track Required State

Add tracking variables:

```javascript
let problemStartTime = null;
let hintsUsedThisProblem = 0;
let retriesThisProblem = 0;
let problemsThisSession = 0;
let sessionCorrect = 0;
let problemHistory = [];

// Reset on new problem
function onNewProblem() {
  problemStartTime = Date.now();
  hintsUsedThisProblem = 0;
  retriesThisProblem = 0;
}

// Track hints
function onHintUsed() {
  hintsUsedThisProblem++;
}

// Track retries
function onRetry() {
  retriesThisProblem++;
}

// Track outcomes
function onProblemComplete(correct) {
  problemsThisSession++;
  if (correct) sessionCorrect++;
  problemHistory.push({ correct, timestamp: Date.now() });
}
```

---

## 9. Dependencies

### 9.1 package.json Addition

```json
{
  "dependencies": {
    "@tensorflow/tfjs": "^4.17.0"
  }
}
```

### 9.2 Alternative: CDN Load

If npm is problematic, load from CDN in app.html:

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js"></script>
```

Then access as `window.tf` instead of import.

---

## 10. Testing Strategy

### 10.1 Unit Tests

```
tests/core/ghost-network.test.js
  - Model creation
  - Weight serialization/deserialization
  - Training produces different weights
  - Prediction output format

tests/core/ghost-engine.test.js
  - Profile initialization
  - Interaction recording
  - Buffer management (circular)
  - Color/opacity calculation
  - localStorage persistence
```

### 10.2 Integration Tests

```
tests/server/ghost-api.test.js
  - POST sync creates profile
  - POST sync updates existing
  - GET retrieves profile
  - GET leaderboard returns all
  - Version conflict handling
```

### 10.3 Manual Testing

1. Open app, complete 5 problems
2. Check localStorage for ghost data
3. Refresh page, verify ghost persists
4. Complete 5 more problems
5. Check proficiency/color changed
6. Verify server sync in Network tab

---

## 11. Rollout Plan

### 11.1 Phase 1a: Foundation (This PR)
- [ ] Create ghost-network.js
- [ ] Create ghost-engine.js
- [ ] Add TensorFlow.js dependency
- [ ] Create database migration
- [ ] Add server endpoints

### 11.2 Phase 1b: Integration
- [ ] Hook into app.html
- [ ] Track required state variables
- [ ] Test locally

### 11.3 Phase 1c: Deploy
- [ ] Run migration on Supabase
- [ ] Deploy server to Railway
- [ ] Deploy frontend to Vercel
- [ ] Monitor for errors

### 11.4 Phase 1d: Validation
- [ ] Confirm ghosts are being created
- [ ] Verify weights are changing
- [ ] Check sync is working
- [ ] Validate color/opacity derivation

---

## 12. Future Considerations

### Phase 2+: Visualization
- Ghost profile display in UI
- Color/opacity rendering
- Progress indicator

### Phase 3+: 3D Maze
- Three.js integration
- Maze generation from manifest
- Ghost position rendering

### Phase 6+: Battles
- Battle simulation engine
- Ghost vs ghost resolution
- Battle history

---

*This spec is ready for implementation. Start with ghost-network.js, then ghost-engine.js, then server endpoints, then app.html integration.*

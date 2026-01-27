/**
 * ghost-network.js
 * TensorFlow.js neural network for Ghost behavioral modeling
 *
 * Architecture:
 *   Input: 10 neurons (behavioral features)
 *   Hidden 1: 16 neurons (ReLU)
 *   Hidden 2: 16 neurons (ReLU)
 *   Output: 4 neurons (predictions)
 *
 * Total parameters: 516
 */

const GHOST_CONFIG = {
  inputSize: 10,
  hiddenSize: 16,
  outputSize: 4,
  learningRate: 0.005
};

// TensorFlow.js reference - loaded from CDN or import
let tf = null;

/**
 * Initialize TensorFlow.js reference
 * Call this before using any other functions
 */
export function initTensorFlow(tfInstance) {
  tf = tfInstance;
}

/**
 * Create a new ghost neural network
 * @returns {tf.Sequential} Compiled TensorFlow.js model
 */
export function createGhostNetwork() {
  if (!tf) {
    throw new Error('TensorFlow.js not initialized. Call initTensorFlow first.');
  }

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
        activation: 'linear' // We apply sigmoid to outputs 1-3 manually
      })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(GHOST_CONFIG.learningRate),
    loss: 'meanSquaredError'
  });

  return model;
}

/**
 * Serialize model weights to plain arrays for storage
 * @param {tf.Sequential} model - The ghost model
 * @returns {number[][]} Array of weight arrays
 */
export function serializeWeights(model) {
  return model.getWeights().map(w => Array.from(w.dataSync()));
}

/**
 * Deserialize weights from storage back into model
 * @param {tf.Sequential} model - The ghost model
 * @param {number[][]} weightsArrays - Serialized weight arrays
 */
export function deserializeWeights(model, weightsArrays) {
  const tensors = weightsArrays.map((arr, i) => {
    const shape = model.getWeights()[i].shape;
    return tf.tensor(arr, shape);
  });
  model.setWeights(tensors);
  // Clean up tensors to prevent memory leak
  tensors.forEach(t => t.dispose());
}

/**
 * Train the model on a batch of interactions
 * Uses experience replay - samples from buffer
 * @param {tf.Sequential} model - The ghost model
 * @param {Array} interactions - Array of interaction records with inputs/outputs
 * @returns {Promise<void>}
 */
export async function trainOnBatch(model, interactions) {
  if (!interactions || interactions.length === 0) return;

  const xs = tf.tensor2d(interactions.map(i => i.inputs));
  const ys = tf.tensor2d(interactions.map(i => i.outputs));

  try {
    await model.fit(xs, ys, {
      epochs: 1,
      batchSize: interactions.length,
      verbose: 0
    });
  } finally {
    // Always clean up tensors
    xs.dispose();
    ys.dispose();
  }
}

/**
 * Run inference on the model
 * @param {tf.Sequential} model - The ghost model
 * @param {number[]} inputs - 10 normalized input features
 * @returns {Object} Predictions: { time, correctProb, hintProb, quickProb }
 */
export function predict(model, inputs) {
  const inputTensor = tf.tensor2d([inputs]);
  const outputTensor = model.predict(inputTensor);
  const outputs = outputTensor.dataSync();

  // Clean up tensors
  inputTensor.dispose();
  outputTensor.dispose();

  return {
    time: Math.max(0, outputs[0]) * 60, // Denormalize to seconds
    correctProb: sigmoid(outputs[1]),
    hintProb: sigmoid(outputs[2]),
    quickProb: sigmoid(outputs[3])
  };
}

/**
 * Sigmoid activation for probability outputs
 * @param {number} x - Raw output value
 * @returns {number} Value between 0 and 1
 */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Get model configuration
 * @returns {Object} Ghost network configuration
 */
export function getConfig() {
  return { ...GHOST_CONFIG };
}

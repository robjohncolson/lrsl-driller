/**
 * Tests for ghost-network.js
 * Neural network model for Ghost behavioral AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock TensorFlow.js
const mockTensor = {
  dataSync: vi.fn(() => [0.5, 0.6, 0.3, 0.8]),
  dispose: vi.fn(),
  shape: [10]
};

const mockModel = {
  getWeights: vi.fn(() => [
    { dataSync: () => new Float32Array(160), shape: [10, 16] },
    { dataSync: () => new Float32Array(16), shape: [16] },
    { dataSync: () => new Float32Array(256), shape: [16, 16] },
    { dataSync: () => new Float32Array(16), shape: [16] },
    { dataSync: () => new Float32Array(64), shape: [16, 4] },
    { dataSync: () => new Float32Array(4), shape: [4] }
  ]),
  setWeights: vi.fn(),
  predict: vi.fn(() => mockTensor),
  fit: vi.fn(() => Promise.resolve()),
  compile: vi.fn()
};

const mockTf = {
  sequential: vi.fn(() => mockModel),
  layers: {
    dense: vi.fn((config) => ({ config }))
  },
  train: {
    adam: vi.fn((lr) => ({ lr }))
  },
  tensor: vi.fn((arr, shape) => ({
    ...mockTensor,
    shape,
    dispose: vi.fn()
  })),
  tensor2d: vi.fn((arr) => ({
    ...mockTensor,
    dispose: vi.fn()
  }))
};

// Import after mocking
import * as GhostNetwork from '../../platform/core/ghost-network.js';

describe('GhostNetwork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initTensorFlow', () => {
    it('should store TensorFlow instance', () => {
      GhostNetwork.initTensorFlow(mockTf);
      // Should not throw when creating network
      expect(() => GhostNetwork.createGhostNetwork()).not.toThrow();
    });
  });

  describe('createGhostNetwork', () => {
    beforeEach(() => {
      GhostNetwork.initTensorFlow(mockTf);
    });

    it('should create a sequential model', () => {
      const model = GhostNetwork.createGhostNetwork();
      expect(mockTf.sequential).toHaveBeenCalled();
      expect(model).toBe(mockModel);
    });

    it('should create model with 3 layers', () => {
      GhostNetwork.createGhostNetwork();
      expect(mockTf.layers.dense).toHaveBeenCalledTimes(3);
    });

    it('should configure input layer with 10 inputs and 16 units', () => {
      GhostNetwork.createGhostNetwork();
      const firstLayerCall = mockTf.layers.dense.mock.calls[0][0];
      expect(firstLayerCall.inputShape).toEqual([10]);
      expect(firstLayerCall.units).toBe(16);
      expect(firstLayerCall.activation).toBe('relu');
    });

    it('should configure hidden layer with 16 units', () => {
      GhostNetwork.createGhostNetwork();
      const secondLayerCall = mockTf.layers.dense.mock.calls[1][0];
      expect(secondLayerCall.units).toBe(16);
      expect(secondLayerCall.activation).toBe('relu');
    });

    it('should configure output layer with 4 units', () => {
      GhostNetwork.createGhostNetwork();
      const outputLayerCall = mockTf.layers.dense.mock.calls[2][0];
      expect(outputLayerCall.units).toBe(4);
      expect(outputLayerCall.activation).toBe('linear');
    });

    it('should compile model with Adam optimizer', () => {
      GhostNetwork.createGhostNetwork();
      expect(mockTf.train.adam).toHaveBeenCalledWith(0.005);
      expect(mockModel.compile).toHaveBeenCalled();
    });
  });

  describe('serializeWeights', () => {
    beforeEach(() => {
      GhostNetwork.initTensorFlow(mockTf);
    });

    it('should convert model weights to arrays', () => {
      const weights = GhostNetwork.serializeWeights(mockModel);
      expect(Array.isArray(weights)).toBe(true);
      expect(weights.length).toBe(6); // 3 layers * 2 (kernel + bias)
    });
  });

  describe('deserializeWeights', () => {
    beforeEach(() => {
      GhostNetwork.initTensorFlow(mockTf);
    });

    it('should restore weights to model', () => {
      const weightsArrays = [
        new Array(160).fill(0.1),
        new Array(16).fill(0.1),
        new Array(256).fill(0.1),
        new Array(16).fill(0.1),
        new Array(64).fill(0.1),
        new Array(4).fill(0.1)
      ];

      GhostNetwork.deserializeWeights(mockModel, weightsArrays);
      expect(mockModel.setWeights).toHaveBeenCalled();
    });

    it('should dispose tensors after setting weights', () => {
      const weightsArrays = [
        new Array(160).fill(0.1),
        new Array(16).fill(0.1),
        new Array(256).fill(0.1),
        new Array(16).fill(0.1),
        new Array(64).fill(0.1),
        new Array(4).fill(0.1)
      ];

      GhostNetwork.deserializeWeights(mockModel, weightsArrays);
      // Tensors should be created and disposed
      expect(mockTf.tensor).toHaveBeenCalledTimes(6);
    });
  });

  describe('trainOnBatch', () => {
    beforeEach(() => {
      GhostNetwork.initTensorFlow(mockTf);
    });

    it('should not train on empty interactions', async () => {
      await GhostNetwork.trainOnBatch(mockModel, []);
      expect(mockModel.fit).not.toHaveBeenCalled();
    });

    it('should train on valid interactions', async () => {
      const interactions = [
        { inputs: new Array(10).fill(0.5), outputs: [0.5, 1.0, 0.0, 0.0] },
        { inputs: new Array(10).fill(0.3), outputs: [0.8, 0.0, 1.0, 1.0] }
      ];

      await GhostNetwork.trainOnBatch(mockModel, interactions);
      expect(mockModel.fit).toHaveBeenCalled();
    });
  });

  describe('predict', () => {
    beforeEach(() => {
      GhostNetwork.initTensorFlow(mockTf);
    });

    it('should return prediction object with expected fields', () => {
      const inputs = new Array(10).fill(0.5);
      const prediction = GhostNetwork.predict(mockModel, inputs);

      expect(prediction).toHaveProperty('time');
      expect(prediction).toHaveProperty('correctProb');
      expect(prediction).toHaveProperty('hintProb');
      expect(prediction).toHaveProperty('quickProb');
    });

    it('should denormalize time to seconds', () => {
      const inputs = new Array(10).fill(0.5);
      const prediction = GhostNetwork.predict(mockModel, inputs);

      // Raw output [0] is 0.5, denormalized: 0.5 * 60 = 30 seconds
      expect(prediction.time).toBe(30);
    });

    it('should apply sigmoid to probability outputs', () => {
      const inputs = new Array(10).fill(0.5);
      const prediction = GhostNetwork.predict(mockModel, inputs);

      // All probability values should be between 0 and 1
      expect(prediction.correctProb).toBeGreaterThanOrEqual(0);
      expect(prediction.correctProb).toBeLessThanOrEqual(1);
      expect(prediction.hintProb).toBeGreaterThanOrEqual(0);
      expect(prediction.hintProb).toBeLessThanOrEqual(1);
      expect(prediction.quickProb).toBeGreaterThanOrEqual(0);
      expect(prediction.quickProb).toBeLessThanOrEqual(1);
    });
  });

  describe('getConfig', () => {
    it('should return configuration object', () => {
      const config = GhostNetwork.getConfig();

      expect(config.inputSize).toBe(10);
      expect(config.hiddenSize).toBe(16);
      expect(config.outputSize).toBe(4);
      expect(config.learningRate).toBe(0.005);
    });
  });
});

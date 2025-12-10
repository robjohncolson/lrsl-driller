/**
 * Platform - The "Nintendo Console"
 * Main orchestrator that combines all core systems
 * Loads cartridges and runs the learning experience
 */

import { GameEngine } from './core/game-engine.js';
import { GradingEngine } from './core/grading-engine.js';
import { GraphEngine } from './core/graph-engine.js';
import { InputRenderer } from './core/input-renderer.js';
import { CartridgeLoader } from './core/cartridge-loader.js';

export class Platform {
  constructor(config = {}) {
    // DOM containers
    this.containers = {
      graph: config.graphContainer || '#graph-container',
      inputs: config.inputsContainer || '#input-container',
      info: config.infoContainer || '#info-container',
      streaks: config.streaksContainer || '#streaks-container',
      stars: config.starsContainer || '#stars-container'
    };

    // Core engines
    this.gameEngine = new GameEngine({
      onStreakUpdate: (field, count) => this.onStreakUpdate(field, count),
      onStarEarned: (type, counts) => this.onStarEarned(type, counts),
      onTierUnlocked: (tier) => this.onTierUnlocked(tier)
    });

    this.gradingEngine = new GradingEngine({
      serverUrl: config.serverUrl
    });

    this.graphEngine = null;  // Created when graph container available
    this.inputRenderer = null; // Created when input container available

    this.cartridgeLoader = new CartridgeLoader({
      basePath: config.cartridgesPath || './cartridges',
      sharedPath: config.sharedPath || './shared'
    });

    // State
    this.currentCartridge = null;
    this.currentMode = null;
    this.currentProblem = null;
    this.isGrading = false;

    // Callbacks
    this.onProblemLoaded = config.onProblemLoaded || (() => {});
    this.onGradingComplete = config.onGradingComplete || (() => {});
    this.onStateChange = config.onStateChange || (() => {});
  }

  /**
   * Initialize the platform with DOM containers
   */
  init() {
    // Initialize graph engine
    const graphContainer = document.querySelector(this.containers.graph);
    if (graphContainer) {
      this.graphEngine = new GraphEngine(graphContainer);
    }

    // Initialize input renderer
    const inputContainer = document.querySelector(this.containers.inputs);
    if (inputContainer) {
      this.inputRenderer = new InputRenderer(inputContainer, {
        onHintRequested: (fieldId) => this.onHintRequested(fieldId)
      });
    }

    return this;
  }

  /**
   * Load a cartridge
   */
  async loadCartridge(cartridgeId) {
    try {
      this.currentCartridge = await this.cartridgeLoader.load(cartridgeId);
      this.gameEngine.loadCartridge(this.currentCartridge.manifest);

      // Set initial mode
      const modes = this.cartridgeLoader.getModes();
      if (modes.length > 0) {
        this.currentMode = modes[0].id;
      }

      this.onStateChange(this.getState());
      return this.currentCartridge;

    } catch (err) {
      console.error('Failed to load cartridge:', err);
      throw err;
    }
  }

  /**
   * Set current mode
   */
  setMode(modeId) {
    const mode = this.cartridgeLoader.getMode(modeId);
    if (!mode) {
      console.warn(`Mode "${modeId}" not found`);
      return false;
    }

    // Check if mode is unlocked
    const state = this.gameEngine.getState();
    if (!state.unlockedTiers.includes(modeId) && mode.unlockedBy !== 'default') {
      console.warn(`Mode "${modeId}" is locked`);
      return false;
    }

    this.currentMode = modeId;
    this.onStateChange(this.getState());
    return true;
  }

  /**
   * Load a new problem
   */
  async loadProblem() {
    if (!this.currentCartridge) {
      throw new Error('No cartridge loaded');
    }

    // Reset hints for new problem
    this.gameEngine.resetHintsForNewProblem();

    // Generate problem
    this.currentProblem = await this.cartridgeLoader.generateProblem(this.currentMode);

    // Render graph
    if (this.graphEngine && this.currentProblem.graphConfig) {
      this.graphEngine.render(this.currentProblem.graphConfig);
    }

    // Render inputs
    if (this.inputRenderer) {
      const mode = this.cartridgeLoader.getMode(this.currentMode);
      const inputSchema = mode?.layout?.inputs || [];

      // Add hints from manifest
      const hints = this.currentCartridge.manifest.hints?.perField || {};
      const fieldsWithHints = inputSchema.map(field => ({
        ...field,
        hint: hints[field.id] ? this.interpolate(hints[field.id], this.currentProblem.context) : field.hint
      }));

      this.inputRenderer.render(fieldsWithHints, this.currentProblem.context);
      this.inputRenderer.focusFirst();
    }

    // Render info panel
    this.renderInfoPanel();

    this.onProblemLoaded(this.currentProblem);
    this.onStateChange(this.getState());

    return this.currentProblem;
  }

  /**
   * Grade current answers
   */
  async grade() {
    if (this.isGrading) return;
    if (!this.currentProblem) {
      throw new Error('No problem loaded');
    }

    this.isGrading = true;
    this.inputRenderer?.disable();

    try {
      // Collect answers
      const answers = this.inputRenderer.getAllValues();

      // Get grading rules
      const mode = this.cartridgeLoader.getMode(this.currentMode);
      const rules = {};

      for (const field of mode.layout.inputs) {
        const rule = this.cartridgeLoader.getGradingRule(field.id);
        if (rule) {
          rules[field.id] = rule;
        }
      }

      // Build context for grading
      const context = {
        ...this.currentProblem.context,
        ...this.currentProblem.answers,
        scenario: this.currentProblem.scenario
      };

      // Grade all answers
      const results = await this.gradingEngine.gradeAll(answers, rules, context);

      // Update game engine
      for (const [fieldId, result] of Object.entries(results.fields)) {
        this.gameEngine.recordResult(fieldId, result.score, results.allCorrect);
      }

      // Show feedback
      this.inputRenderer?.showAllFeedback(results);

      this.onGradingComplete(results);
      this.onStateChange(this.getState());

      return results;

    } finally {
      this.isGrading = false;
    }
  }

  /**
   * Skip current problem
   */
  skip() {
    return this.loadProblem();
  }

  /**
   * Get current state
   */
  getState() {
    return {
      cartridgeId: this.currentCartridge?.id,
      currentMode: this.currentMode,
      hasProblem: !!this.currentProblem,
      isGrading: this.isGrading,
      game: this.gameEngine.getState(),
      modes: this.cartridgeLoader.getModes()
    };
  }

  // ============== EVENT HANDLERS ==============

  onStreakUpdate(fieldId, count) {
    // Update streak display
    const streaksContainer = document.querySelector(this.containers.streaks);
    if (streaksContainer) {
      const streakEl = streaksContainer.querySelector(`[data-streak="${fieldId}"]`);
      if (streakEl) {
        streakEl.textContent = count;
      }
    }
  }

  onStarEarned(starType, counts) {
    // Update star display
    const starsContainer = document.querySelector(this.containers.stars);
    if (starsContainer) {
      for (const [type, count] of Object.entries(counts)) {
        const countEl = starsContainer.querySelector(`[data-star-count="${type}"]`);
        if (countEl) {
          countEl.textContent = count;
        }
      }
    }

    // Emit event for celebration effects
    this.emit('starEarned', { starType, counts });
  }

  onTierUnlocked(tier) {
    // Emit event for unlock celebration
    this.emit('tierUnlocked', tier);
  }

  onHintRequested(fieldId) {
    this.gameEngine.useHint(fieldId);
    this.onStateChange(this.getState());
  }

  // ============== HELPERS ==============

  renderInfoPanel() {
    const infoContainer = document.querySelector(this.containers.info);
    if (!infoContainer || !this.currentProblem) return;

    const manifest = this.currentCartridge.manifest;
    const display = manifest.display?.infoPanel || [];
    const context = this.currentProblem.context;

    let html = '';
    for (const item of display) {
      const label = this.interpolate(item.label, context);
      const value = this.interpolate(item.value, context);
      html += `
        <div class="mb-2">
          <span class="text-gray-600 text-sm">${label}:</span>
          <span class="font-mono font-medium ml-2">${value}</span>
        </div>
      `;
    }

    infoContainer.innerHTML = html;
  }

  interpolate(template, context) {
    if (typeof template !== 'string') return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }

  // Simple event emitter
  emit(event, data) {
    const customEvent = new CustomEvent(`platform:${event}`, { detail: data });
    document.dispatchEvent(customEvent);
  }

  on(event, handler) {
    document.addEventListener(`platform:${event}`, (e) => handler(e.detail));
  }
}

export default Platform;

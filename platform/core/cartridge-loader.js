/**
 * Cartridge Loader - Loads and initializes topic cartridges
 * Reads manifest and wires up generator, grader, and UI
 */

export class CartridgeLoader {
  constructor(config = {}) {
    this.basePath = config.basePath || '/cartridges';
    this.sharedPath = config.sharedPath || '/shared';
    this.loadedCartridge = null;
    this.contexts = null;
  }

  /**
   * Load a cartridge by ID
   * @param {string} cartridgeId - The cartridge to load
   * @param {function} onProgress - Optional callback: (step, filename, status) => void
   *   step: 'manifest' | 'contexts' | 'generator' | 'grading' | 'ai'
   *   status: 'loading' | 'done' | 'skipped' | 'error'
   */
  async load(cartridgeId, onProgress = null) {
    const cartridgePath = `${this.basePath}/${cartridgeId}`;
    const progress = (step, filename, status) => {
      if (onProgress) onProgress(step, filename, status);
    };

    try {
      // Load manifest
      progress('manifest', 'manifest.json', 'loading');
      const manifest = await this.loadJSON(`${cartridgePath}/manifest.json`);
      progress('manifest', 'manifest.json', 'done');

      // Load shared contexts if specified
      if (manifest.config?.sharedContexts) {
        const contextFile = `${manifest.config.sharedContexts}.json`;
        progress('contexts', contextFile, 'loading');
        this.contexts = await this.loadJSON(
          `${this.sharedPath}/contexts/${contextFile}`
        );
        progress('contexts', contextFile, 'done');
      } else {
        progress('contexts', 'none', 'skipped');
      }

      // Load generator module
      progress('generator', 'generator.js', 'loading');
      const generator = await this.loadModule(`${cartridgePath}/generator.js`);
      progress('generator', 'generator.js', 'done');

      // Load grading rules
      let gradingRules = null;
      if (manifest.grading?.rubricFile) {
        progress('grading', manifest.grading.rubricFile, 'loading');
        if (manifest.grading.rubricFile.endsWith('.js')) {
          gradingRules = await this.loadModule(`${cartridgePath}/${manifest.grading.rubricFile}`);
        } else {
          gradingRules = await this.loadJSON(`${cartridgePath}/${manifest.grading.rubricFile}`);
        }
        progress('grading', manifest.grading.rubricFile, 'done');
      } else {
        progress('grading', 'none', 'skipped');
      }

      // Load AI prompt template
      let aiPrompt = null;
      if (manifest.grading?.aiPromptFile) {
        progress('ai', manifest.grading.aiPromptFile, 'loading');
        aiPrompt = await this.loadText(`${cartridgePath}/${manifest.grading.aiPromptFile}`);
        progress('ai', manifest.grading.aiPromptFile, 'done');
      } else {
        progress('ai', 'none', 'skipped');
      }

      this.loadedCartridge = {
        id: cartridgeId,
        manifest,
        contexts: this.contexts,
        generator,
        gradingRules,
        aiPrompt
      };

      return this.loadedCartridge;

    } catch (err) {
      console.error(`Failed to load cartridge "${cartridgeId}":`, err);
      throw err;
    }
  }

  /**
   * Load JSON file
   */
  async loadJSON(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Load text file
   */
  async loadText(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    return response.text();
  }

  /**
   * Load JavaScript module
   */
  async loadModule(path) {
    try {
      // Dynamic imports need proper path handling
      // Convert relative paths for the browser
      const importPath = path.startsWith('/') || path.startsWith('http')
        ? path
        : new URL(path, window.location.href).href;

      console.log('Loading module:', importPath);
      const module = await import(/* @vite-ignore */ importPath);
      return module;
    } catch (err) {
      console.error(`Failed to load module ${path}:`, err);
      return null;
    }
  }

  /**
   * Get current cartridge
   */
  getCartridge() {
    return this.loadedCartridge;
  }

  /**
   * Get manifest
   */
  getManifest() {
    return this.loadedCartridge?.manifest;
  }

  /**
   * Get a specific mode from manifest
   */
  getMode(modeId) {
    const modes = this.loadedCartridge?.manifest?.modes || [];
    return modes.find(m => m.id === modeId);
  }

  /**
   * Get all modes
   */
  getModes() {
    return this.loadedCartridge?.manifest?.modes || [];
  }

  /**
   * Get random context
   */
  getRandomContext() {
    const contexts = this.contexts?.contexts || [];
    if (contexts.length === 0) return null;
    return contexts[Math.floor(Math.random() * contexts.length)];
  }

  /**
   * Generate a problem using cartridge's generator
   */
  async generateProblem(modeId, context = null) {
    const generator = this.loadedCartridge?.generator;
    if (!generator?.generateProblem) {
      throw new Error('Cartridge has no generator');
    }

    context = context || this.getRandomContext();
    const mode = this.getMode(modeId);

    return generator.generateProblem(modeId, context, mode);
  }

  /**
   * Get grading rules for a field
   */
  getGradingRule(fieldId) {
    const rules = this.loadedCartridge?.gradingRules;
    if (!rules) return null;

    // Handle both object and function-based rules
    if (typeof rules.getRule === 'function') {
      return rules.getRule(fieldId);
    }
    return rules[fieldId] || rules.fields?.[fieldId];
  }

  /**
   * Get AI prompt template
   */
  getAIPrompt() {
    return this.loadedCartridge?.aiPrompt;
  }

  /**
   * Get hints for a field
   */
  getHint(fieldId, context = {}) {
    const hints = this.loadedCartridge?.manifest?.hints?.perField;
    if (!hints || !hints[fieldId]) return null;

    let hint = hints[fieldId];

    // Interpolate context variables
    hint = hint.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });

    return hint;
  }
}

export default CartridgeLoader;

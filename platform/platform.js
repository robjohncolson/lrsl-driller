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
   * @param {string} cartridgeId - The cartridge to load
   * @param {function} onProgress - Optional progress callback: (step, filename, status) => void
   */
  async loadCartridge(cartridgeId, onProgress = null) {
    try {
      this.currentCartridge = await this.cartridgeLoader.load(cartridgeId, onProgress);
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
    const isUnlocked = mode.unlockedBy === 'default' ||
      state.unlockedTiers.includes(modeId) ||
      (mode.unlockedBy?.gold && state.starCounts.gold >= mode.unlockedBy.gold);

    if (!isUnlocked) {
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
      // Transform generator's config to GraphEngine's expected format
      const gc = this.currentProblem.graphConfig;
      const graphConfig = {
        type: gc.type,
        data: gc.points || gc.data,
        labels: { x: gc.xLabel, y: gc.yLabel },
        xMin: gc.xDomain?.[0],
        xMax: gc.xDomain?.[1],
        yMin: gc.yDomain?.[0],
        yMax: gc.yDomain?.[1],
        regression: gc.regression,
        features: {
          regressionLine: gc.regression?.show,
          showEquation: gc.showEquation,
          showR: gc.showR,
          highlightId: gc.highlight?.index,
          showResidualLine: gc.showResidualLine,
          zeroLine: gc.showZeroLine
        }
      };
      this.graphEngine.render(graphConfig);
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
   * @param {Object} options - { useAI: boolean }
   *
   * Grading modes:
   * - useAI=false: Keywords only (fast, regex-based)
   * - useAI=true: Keywords + AI (both run, best score wins)
   * - If AI fails when useAI=true: Falls back to keywords + offers teacher review
   */
  async grade(options = {}) {
    const { useAI = true } = options;

    if (this.isGrading) return;
    if (!this.currentProblem) {
      throw new Error('No problem loaded');
    }

    this.isGrading = true;
    this.inputRenderer?.disable();

    try {
      // Collect answers
      const answers = this.inputRenderer.getAllValues();

      // Build context for grading
      const context = {
        ...this.currentProblem.context,
        ...this.currentProblem.answers,
        scenario: this.currentProblem.scenario,
        mode: this.currentMode
      };

      const cartridgeGrader = this.currentCartridge?.gradingRules?.gradeField;
      const results = {
        fields: {},
        _gradingMethod: 'keywords', // 'keywords', 'keywords+ai', 'keywords+teacher-review'
        _aiAvailable: false,
        _aiFailed: false,
        _aiError: null
      };

      // ALWAYS run keyword/regex grading first (fast, synchronous)
      for (const [fieldId, answer] of Object.entries(answers)) {
        let regexResult = { score: 'I', feedback: 'No grading available' };

        if (cartridgeGrader) {
          regexResult = cartridgeGrader(fieldId, answer, context);
        }

        results.fields[fieldId] = {
          ...regexResult,
          _method: 'keywords',
          _keywordScore: regexResult.score,
          _keywordFeedback: regexResult.feedback
        };
      }

      // If AI toggle is ON, also try AI grading
      const aiPromptFile = this.currentCartridge?.manifest?.grading?.aiPromptFile;
      if (useAI && aiPromptFile) {
        results._aiAvailable = true;

        try {
          const aiResults = await this.gradeWithAI(answers, context);

          // Check if AI actually returned valid results
          if (aiResults && !aiResults.error && !aiResults._error) {
            results._gradingMethod = 'keywords+ai';
            const scoreValues = { 'E': 3, 'P': 2, 'I': 1 };
            const scoreFromValue = { 3: 'E', 2: 'P', 1: 'I' };

            let anyAILower = false;

            for (const [fieldId, aiResult] of Object.entries(aiResults)) {
              if (fieldId.startsWith('_') || fieldId === 'composite') continue;
              if (!aiResult || typeof aiResult !== 'object') continue;

              const currentResult = results.fields[fieldId];
              if (!currentResult) continue;

              const keywordScoreVal = scoreValues[currentResult._keywordScore] || 1;
              const aiScoreVal = scoreValues[aiResult?.score] || 1;

              // Store AI results
              currentResult._aiScore = aiResult.score;
              currentResult._aiFeedback = aiResult.feedback;
              currentResult._provider = aiResults._provider;

              // Check if AI feedback is actually useful
              const aiFb = aiResult.feedback || '';
              const keywordFb = currentResult._keywordFeedback || '';
              const aiHasRealFeedback = aiFb &&
                !aiFb.includes('Score extracted from response') &&
                !aiFb.includes('extracted') &&
                aiFb.length > 20;

              // AVERAGE the scores (round to nearest, tie goes up)
              const avgScoreVal = Math.round((keywordScoreVal + aiScoreVal) / 2);
              currentResult.score = scoreFromValue[avgScoreVal] || 'I';
              currentResult._method = 'keywords+ai';

              // Build combined feedback showing BOTH (only if AI has real feedback)
              if (aiHasRealFeedback && keywordFb && aiFb !== keywordFb) {
                currentResult.feedback = `<div class="space-y-2">
                  <div><span class="font-semibold text-gray-600">Keywords:</span> ${keywordFb}</div>
                  <div><span class="font-semibold text-blue-600">AI:</span> ${aiFb}</div>
                </div>`;
              } else if (aiHasRealFeedback) {
                currentResult.feedback = aiFb;
              } else {
                // AI didn't provide useful feedback - use keywords and note the AI score
                currentResult.feedback = keywordFb || 'No detailed feedback available';
                if (aiScoreVal !== keywordScoreVal) {
                  currentResult.feedback += ` <span class="text-blue-600 text-sm">(AI scored: ${aiResult.score})</span>`;
                }
                // Mark that AI feedback was incomplete
                currentResult._aiIncomplete = true;
                anyAILower = true; // Allow teacher review when AI feedback is incomplete
              }

              // Track if AI graded lower than keywords (student may want to appeal)
              if (aiScoreVal < keywordScoreVal) {
                anyAILower = true;
                currentResult._aiGradedLower = true;
              }
            }

            // If AI graded any field lower OR AI feedback was incomplete, allow teacher review
            if (anyAILower) {
              results._aiGradedLower = true;
            }
          } else {
            // AI returned an error
            results._aiFailed = true;
            results._aiError = aiResults?._error || aiResults?.error || 'Unknown AI error';
            results._gradingMethod = 'keywords+teacher-review';
            console.warn('AI grading returned error:', results._aiError);
          }
        } catch (err) {
          // AI call failed completely
          results._aiFailed = true;
          results._aiError = err.message;
          results._gradingMethod = 'keywords+teacher-review';
          console.warn('AI grading failed:', err.message);
        }
      }

      // Calculate allCorrect based on final scores
      let allCorrect = true;
      for (const [fieldId, result] of Object.entries(results.fields)) {
        if (result.score !== 'E') {
          allCorrect = false;
        }
      }

      results.allCorrect = allCorrect;
      results.scores = Object.values(results.fields).map(r => r.score);

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
   * Grade with AI via server
   */
  async gradeWithAI(answers, context) {
    const serverUrl = this.gradingEngine.serverUrl;

    // Build the scenario object matching server's expected format
    // Server uses isInterceptMeaningful, context uses interceptMeaningful
    const scenario = {
      topic: context.topic,
      xVar: context.xVar,
      yVar: context.yVar,
      xUnits: context.xUnits,
      yUnits: context.yUnits,
      slope: parseFloat(context.slope),
      intercept: parseFloat(context.intercept),
      r: parseFloat(context.r),
      isInterceptMeaningful: context.interceptMeaningful !== false,
      interceptReason: context.interceptReason || null
    };

    console.log('Sending AI grading request:', { scenario, answers });

    const response = await fetch(`${serverUrl}/api/ai/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        answers
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('AI grading error:', result);
      throw new Error(result.error || 'AI grading failed');
    }

    console.log('AI grading result:', result);
    return result;
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

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
import { ProblemShuffleBag } from './core/shuffle-bag.js';

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
    this.preferProvider = config.preferProvider || null; // 'gemini', 'groq', or null (auto)

    // Shuffle bags for fair problem distribution (one per mode)
    this.shuffleBags = new Map();

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
      console.log(`[Platform] Loading cartridge: ${cartridgeId}`);

      // Clear shuffle bags when loading new cartridge
      this.shuffleBags.clear();

      this.currentCartridge = await this.cartridgeLoader.load(cartridgeId, onProgress);
      console.log(`[Platform] Cartridge loaded:`, this.currentCartridge.manifest?.meta?.name);
      console.log(`[Platform] Available modes:`, this.currentCartridge.manifest?.modes?.map(m => m.id));

      this.gameEngine.loadCartridge(this.currentCartridge.manifest);

      // Set initial mode - restore saved mode if available and unlocked
      const modes = this.cartridgeLoader.getModes();
      const savedTier = this.gameEngine.currentTier;
      const state = this.gameEngine.getState();

      // Check if saved tier exists and is unlocked
      const savedMode = modes.find(m => m.id === savedTier);
      const isSavedModeUnlocked = savedMode && (
        savedMode.unlockedBy === 'default' ||
        state.unlockedTiers.includes(savedTier) ||
        (savedMode.unlockedBy?.gold && state.starCounts.gold >= savedMode.unlockedBy.gold)
      );

      if (isSavedModeUnlocked) {
        this.currentMode = savedTier;
        console.log(`[Platform] Restored saved mode: ${this.currentMode}`);
      } else if (modes.length > 0) {
        this.currentMode = modes[0].id;
        console.log(`[Platform] Set initial mode: ${this.currentMode}`);
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
    // Save to game engine so it persists across refreshes
    this.gameEngine.setTier(modeId);
    this.onStateChange(this.getState());
    return true;
  }

  /**
   * Get or create a shuffle bag for the current mode
   */
  getShuffleBag(modeId) {
    if (!this.shuffleBags.has(modeId)) {
      const bag = new ProblemShuffleBag({
        generator: () => this.cartridgeLoader.generateProblem(modeId),
        batchSize: 12,    // Generate 12 problems at a time
        historySize: 4    // Remember last 4 to avoid near-repeats
      });
      this.shuffleBags.set(modeId, bag);
    }
    return this.shuffleBags.get(modeId);
  }

  /**
   * Load a new problem
   */
  async loadProblem() {
    if (!this.currentCartridge) {
      throw new Error('No cartridge loaded');
    }

    // Stop any running animations from the previous problem
    if (this.graphEngine) {
      this.graphEngine.stopAnimation();
    }

    // Reset hints for new problem
    this.gameEngine.resetHintsForNewProblem();

    // Draw from shuffle bag for fair distribution
    const bag = this.getShuffleBag(this.currentMode);
    this.currentProblem = await bag.draw();

    // Render graph
    if (this.graphEngine && this.currentProblem.graphConfig) {
      // Transform generator's config to GraphEngine's expected format
      const gc = this.currentProblem.graphConfig;

      // Handle normal-curve type directly
      if (gc.type === 'normal-curve') {
        this.graphEngine.render({
          type: 'normal-curve',
          mean: gc.mean,
          sd: gc.sd,
          markedValue: gc.markedValue,
          showXUnknown: gc.showXUnknown || false,
          showZLabels: gc.showZLabels || false,
          labels: gc.labels || {}
        });
      } else if (gc.type === 'dual-normal-curve') {
        this.graphEngine.render({
          type: 'dual-normal-curve',
          distributions: gc.distributions
        });
      } else {
        // Standard chart types (scatterplot, residual-plot, etc.)
        const pointsData = gc.points || gc.data;
        const graphConfig = {
          type: gc.type,
          data: pointsData,
          points: pointsData, // Include both for compatibility with showResidualLines
          labels: { x: gc.xLabel, y: gc.yLabel },
          xLabel: gc.xLabel,
          yLabel: gc.yLabel,
          xMin: gc.xDomain?.[0],
          xMax: gc.xDomain?.[1],
          yMin: gc.yDomain?.[0],
          yMax: gc.yDomain?.[1],
          regression: gc.regression,
          highlight: gc.highlight, // Include highlight info for post-submit visualizations
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
      // IMPORTANT: Include graphConfig so grading can compute answers from raw data
      const context = {
        ...this.currentProblem.context,
        ...this.currentProblem.answers,
        graphConfig: this.currentProblem.graphConfig,  // Raw data for real-time grading
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

              // AI feedback is "real" if:
              // - Not extracted/malformed
              // - Either has substantive text (>20 chars) OR is a short positive response for E scores
              const isExtracted = aiFb.includes('Score extracted from response') || aiFb.includes('extracted');
              const isShortPositive = aiScoreVal === 3 && aiFb.length > 0 && aiFb.length <= 20; // E score with brief "Correct!" type feedback
              const aiHasRealFeedback = aiFb && !isExtracted && (aiFb.length > 20 || isShortPositive);

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
                // Only mark as incomplete if AI gave a non-E score without explanation
                // Don't flag short positive feedback (like "Correct!") as incomplete
                if (!isShortPositive) {
                  currentResult._aiIncomplete = true;
                  anyAILower = true; // Allow teacher review when AI feedback is truly incomplete
                }
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

      // Trigger point removal animation for leverage-points modes that ask about removal
      this.maybeAnimatePointRemoval(context, results);

      // Trigger residual visualization for identify-outlier mode
      const delayPromise = this.maybeShowResidualVisualization(context, results);

      this.onGradingComplete(results);

      // Return the delay promise if visualization was shown (for auto-advance handling)
      if (delayPromise) {
        results._postSubmitDelay = delayPromise;
      }
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

    // Build the scenario object - include ALL context for cartridge-specific grading
    const scenario = {
      // Common fields
      topic: context.topic,
      xVar: context.xVar,
      yVar: context.yVar,
      xUnits: context.xUnits,
      yUnits: context.yUnits,
      slope: parseFloat(context.slope),
      intercept: parseFloat(context.intercept),
      r: parseFloat(context.r),
      isInterceptMeaningful: context.interceptMeaningful !== false,
      interceptReason: context.interceptReason || null,

      // Residuals-specific fields
      selectedX: context.selectedX,
      selectedY: context.selectedY,
      predictedY: context.predictedY,
      residual: context.residual,
      residualAbs: context.residualAbs,
      overUnder: context.overUnder,
      pattern: context.pattern,
      appropriate: context.appropriate,

      // Z-score and LSRL calculation fields
      modeId: context.modeId,
      modeName: context.modeName,
      x: context.x,
      mean: context.mean,
      sd: context.sd,
      zscore: context.zscore,
      x1: context.x1,
      x2: context.x2,
      mean1: context.mean1,
      mean2: context.mean2,
      sd1: context.sd1,
      sd2: context.sd2,
      z1: context.z1,
      z2: context.z2,
      comparison: context.comparison,
      sx: context.sx,
      sy: context.sy,
      xBar: context.xBar,
      yBar: context.yBar,
      b: context.b,
      a: context.a,

      // Mode info for conditional prompts
      mode: context.mode,
      cartridgeId: this.currentCartridge?.id
    };

    // Build givenValues and gradingPairs for AI prompt template
    const givenKeys = this.currentProblem?.given ? Object.keys(this.currentProblem.given) : [];
    scenario.givenValues = givenKeys.map(k => `${k}=${this.currentProblem.given[k]}`).join(', ');

    // Build grading pairs: "fieldName: expected=X, student=Y"
    const expectedAnswers = this.currentProblem?.answers || {};
    const pairs = [];
    for (const [fieldId, studentAnswer] of Object.entries(answers)) {
      const expectedData = expectedAnswers[fieldId];
      const expected = typeof expectedData === 'object' ? expectedData?.value : expectedData;
      pairs.push(`${fieldId}: expected=${expected}, student=${studentAnswer}`);
    }
    scenario.gradingPairs = pairs.join('\n');

    // Load cartridge-specific AI prompt if available
    let aiPromptTemplate = null;
    const aiPromptFile = this.currentCartridge?.manifest?.grading?.aiPromptFile;
    if (aiPromptFile && this.currentCartridge?.aiPrompt) {
      aiPromptTemplate = this.currentCartridge.aiPrompt;
    }

    console.log('Sending AI grading request:', { scenario, answers, cartridgeId: scenario.cartridgeId });

    const response = await fetch(`${serverUrl}/api/ai/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        answers,
        preferProvider: this.preferProvider,
        aiPromptTemplate,
        cartridgeId: this.currentCartridge?.id
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
   * Submit an appeal to AI for re-evaluation with student's reasoning
   * @param {string} appealText - Student's explanation for why they think their answer is correct
   * @param {Object} previousResults - The previous grading results
   */
  async submitAppeal(appealText, previousResults) {
    const serverUrl = this.gradingEngine.serverUrl;
    const context = this.currentProblem?.context || {};
    const answers = this.inputRenderer?.getAllValues() || {};

    // Build scenario with appeal context
    const scenario = {
      topic: context.topic || this.currentCartridge?.manifest?.meta?.name,
      mode: this.currentMode,
      cartridgeId: this.currentCartridge?.id,
      r: context.r,
      slope: context.slope,
      intercept: context.intercept,
      givenValues: this.currentProblem?.given ? Object.entries(this.currentProblem.given).map(([k, v]) => `${k}=${v}`).join(', ') : '',
      previousFeedback: previousResults?.fields ? Object.entries(previousResults.fields).map(([field, result]) =>
        `${field}: score=${result.score}, feedback="${result.feedback || 'No feedback'}"`
      ).join('\n') : '',
      appealReason: appealText
    };

    // Load cartridge-specific AI prompt if available
    let aiPromptTemplate = null;
    if (this.currentCartridge?.aiPrompt) {
      aiPromptTemplate = this.currentCartridge.aiPrompt;
    }

    console.log('Sending AI appeal request:', { scenario, answers, appealText });

    try {
      const response = await fetch(`${serverUrl}/api/ai/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          answers,
          appealText,
          previousResults: previousResults?.fields,
          preferProvider: this.preferProvider,
          aiPromptTemplate,
          cartridgeId: this.currentCartridge?.id
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('AI appeal error:', result);
        throw new Error(result.error || 'AI appeal failed');
      }

      console.log('AI appeal result:', result);

      // Check if all fields are now correct
      const allCorrect = result.fields ?
        Object.values(result.fields).every(f => f.score === 'E') :
        false;

      return {
        success: true,
        allCorrect,
        fields: result.fields || result,
        feedback: result.appealResponse || result.feedback || 'Appeal reviewed'
      };
    } catch (err) {
      console.error('Appeal submission failed:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Set preferred AI provider for server grading
   * @param {string|null} provider - 'gemini', 'groq', or null (auto)
   */
  setPreferProvider(provider) {
    this.preferProvider = provider;
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

  /**
   * Animate point removal for leverage-points modes that ask about removing a point
   * Shows the effect on the regression line when the highlighted point is removed
   */
  maybeAnimatePointRemoval(context, results) {
    // Only animate for specific modes that ask about point removal effects
    const removalModes = ['predict-slope-effect', 'predict-r-effect', 'influential-analysis'];
    if (!removalModes.includes(context.modeId)) {
      return;
    }

    // Need graph engine and graph config
    if (!this.graphEngine || !context.graphConfig) {
      return;
    }

    const graphConfig = context.graphConfig;
    const points = graphConfig.points;
    const highlightIndex = graphConfig.highlight?.index;

    if (!points || highlightIndex === undefined) {
      return;
    }

    // Calculate the current regression stats (with the highlighted point)
    const currentStats = this.calculateRegression(points);

    // Calculate the new regression without the highlighted point
    const pointsWithout = points.filter((_, i) => i !== highlightIndex);
    const newStats = this.calculateRegression(pointsWithout);

    // Determine what statistics to display based on mode
    let displayMode = 'slope'; // default
    if (context.modeId === 'predict-r-effect') {
      displayMode = 'r';
    } else if (context.modeId === 'influential-analysis') {
      displayMode = 'both';
    }

    // Delay animation slightly so feedback is visible first
    setTimeout(() => {
      this.graphEngine.animatePointRemoval({
        removeIndex: highlightIndex,
        oldRegression: {
          a: currentStats.intercept,
          b: currentStats.slope,
          r: currentStats.r,
          r2: currentStats.r * currentStats.r
        },
        newRegression: {
          a: newStats.intercept,
          b: newStats.slope,
          r: newStats.r,
          r2: newStats.r * newStats.r
        },
        duration: 2000,
        displayMode: displayMode
      });
    }, 500);
  }

  /**
   * Show post-submission visualization for leverage-points modes
   * Displays visual feedback based on the user's answers (not just correct answers)
   * Returns a Promise that resolves after the visualization delay (for auto-advance)
   */
  maybeShowResidualVisualization(context, results) {
    // Need graph engine and graph config
    if (!this.graphEngine || !context.graphConfig) {
      return null;
    }

    const modeId = context.modeId;

    // Handle identify-outlier mode: show residual lines based on user's answer
    if (modeId === 'identify-outlier') {
      const residualSizeField = results.fields?.residualSize;
      if (!residualSizeField) return null;

      // Use the user's answer to show what they selected
      const userAnswer = residualSizeField.details?.studentAnswer;
      if (!userAnswer) return null;

      const residualType = userAnswer.toLowerCase();

      return new Promise((resolve) => {
        setTimeout(() => {
          this.graphEngine.showResidualLines({
            residualType,
            color: residualType === 'large' ? '#f97316' : '#3b82f6'
          });

          this.emit('postSubmitVisualization', {
            type: 'residualLines',
            residualType,
            duration: 15000
          });

          setTimeout(resolve, 15000);
        }, 500);
      });
    }

    // Handle identify-leverage mode: show leverage lines based on user's answer
    if (modeId === 'identify-leverage') {
      const leverageField = results.fields?.leverage;
      if (!leverageField) return null;

      // Use the user's answer
      const userAnswer = leverageField.details?.studentAnswer;
      if (!userAnswer) return null;

      const leverageType = userAnswer.toLowerCase();

      return new Promise((resolve) => {
        setTimeout(() => {
          this.graphEngine.showLeverageLines({
            leverageType,
            color: leverageType === 'high' ? '#f97316' : '#3b82f6'
          });

          this.emit('postSubmitVisualization', {
            type: 'leverageLines',
            leverageType,
            duration: 15000
          });

          setTimeout(resolve, 15000);
        }, 500);
      });
    }

    // Handle classify-point mode: show combined visualization based on user's answers
    if (modeId === 'classify-point') {
      const leverageField = results.fields?.leverage;
      const residualSizeField = results.fields?.residualSize;

      if (!leverageField || !residualSizeField) return null;

      // Use the user's answers
      const leverageAnswer = leverageField.details?.studentAnswer;
      const residualAnswer = residualSizeField.details?.studentAnswer;

      if (!leverageAnswer || !residualAnswer) return null;

      return new Promise((resolve) => {
        setTimeout(() => {
          this.graphEngine.showClassificationVisualization({
            leverage: leverageAnswer.toLowerCase(),
            residualSize: residualAnswer.toLowerCase()
          });

          this.emit('postSubmitVisualization', {
            type: 'classification',
            leverage: leverageAnswer,
            residualSize: residualAnswer,
            duration: 15000
          });

          setTimeout(resolve, 15000);
        }, 500);
      });
    }

    return null;
  }

  /**
   * Calculate regression statistics from points (helper for animation)
   */
  calculateRegression(points) {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0, r: 0 };

    let sumX = 0, sumY = 0;
    for (const p of points) {
      sumX += p.x;
      sumY += p.y;
    }

    const xMean = sumX / n;
    const yMean = sumY / n;

    let ssX = 0, ssY = 0, ssXY = 0;
    for (const p of points) {
      ssX += (p.x - xMean) ** 2;
      ssY += (p.y - yMean) ** 2;
      ssXY += (p.x - xMean) * (p.y - yMean);
    }

    const slope = ssX > 0 ? ssXY / ssX : 0;
    const intercept = yMean - slope * xMean;
    const r = (ssX > 0 && ssY > 0) ? ssXY / Math.sqrt(ssX * ssY) : 0;

    return { slope, intercept, r, xMean, yMean };
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

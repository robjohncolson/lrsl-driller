/**
 * Input Renderer - Dynamic input field generation
 * Supports textarea, number, choice (radio/dropdown), equation, visual-radical
 * Topic-agnostic: cartridge provides the schema
 */

import { RadicalGame } from './radical-game.js';
import { RadicalPrimeGame } from './radical-prime-game.js';

export class InputRenderer {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.fields = new Map();
    this.visualizers = new Map(); // For visual components like RadicalVisualizer
    this.onHintRequested = config.onHintRequested || (() => {});

    this.styles = {
      field: 'mb-4',
      label: 'block text-sm font-medium text-gray-700 mb-1',
      input: 'w-full border border-gray-300 rounded-lg p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all',
      textarea: 'resize-none',
      hint: 'text-sm text-gray-500 bg-gray-50 rounded p-3 mt-2',
      feedback: 'mt-2 p-3 rounded-lg',
      feedbackE: 'bg-green-100 text-green-800',
      feedbackP: 'bg-yellow-100 text-yellow-800',
      feedbackI: 'bg-red-100 text-red-800',
      hintToggle: 'text-gray-400 hover:text-purple-600 transition-colors'
    };
  }

  /**
   * Render all fields from schema
   */
  render(schema, context = {}) {
    this.container.innerHTML = '';
    this.fields.clear();
    // Destroy any existing visualizers
    for (const [id, viz] of this.visualizers) {
      if (viz.destroy) viz.destroy();
    }
    this.visualizers.clear();

    // Store context for visual components
    this.currentContext = context;

    const fields = schema.fields || schema;

    for (const field of fields) {
      const fieldEl = this.renderField(field, context);
      this.container.appendChild(fieldEl);
      this.fields.set(field.id, {
        element: fieldEl,
        config: field,
        inputEl: fieldEl.querySelector(`[data-field-id="${field.id}"]`)
      });
    }

    return this;
  }

  /**
   * Render a single field based on type
   */
  renderField(field, context) {
    const wrapper = document.createElement('div');
    wrapper.className = this.styles.field;
    wrapper.dataset.fieldWrapper = field.id;

    // Label row with hint toggle
    const labelRow = document.createElement('div');
    labelRow.className = 'flex items-center justify-between mb-1';

    const label = document.createElement('label');
    label.className = this.styles.label;
    label.textContent = this.interpolate(field.label, context);
    label.htmlFor = `field-${field.id}`;
    labelRow.appendChild(label);

    // Hint toggle button
    if (field.hint) {
      const hintBtn = document.createElement('button');
      hintBtn.type = 'button';
      hintBtn.className = this.styles.hintToggle;
      hintBtn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      `;
      hintBtn.title = 'Show hint';
      hintBtn.addEventListener('click', () => this.toggleHint(field.id));
      labelRow.appendChild(hintBtn);
    }

    wrapper.appendChild(labelRow);

    // Render input based on type
    let inputEl;
    switch (field.type) {
      case 'textarea':
        inputEl = this.renderTextarea(field, context);
        break;
      case 'number':
        inputEl = this.renderNumber(field, context);
        break;
      case 'choice':
        inputEl = this.renderChoice(field, context);
        break;
      case 'dropdown':
        inputEl = this.renderDropdown(field, context);
        break;
      case 'text':
        inputEl = this.renderText(field, context);
        break;
      case 'visual-radical':
        inputEl = this.renderVisualRadical(field, context);
        break;
      case 'visual-radical-prime':
        inputEl = this.renderVisualRadicalPrime(field, context);
        break;
      default:
        inputEl = this.renderTextarea(field, context);
    }

    // Only set data-field-id on element if not already set on inner input
    if (!inputEl._isInputWrapper) {
      inputEl.dataset.fieldId = field.id;
    }
    wrapper.appendChild(inputEl);

    // Hint container (hidden by default)
    if (field.hint) {
      const hintEl = document.createElement('div');
      hintEl.className = this.styles.hint + ' hidden';
      hintEl.dataset.hint = field.id;
      hintEl.innerHTML = this.interpolate(field.hint, context);
      wrapper.appendChild(hintEl);
    }

    // Feedback container
    const feedbackEl = document.createElement('div');
    feedbackEl.className = this.styles.feedback + ' hidden';
    feedbackEl.dataset.feedback = field.id;
    wrapper.appendChild(feedbackEl);

    return wrapper;
  }

  // ============== INPUT TYPES ==============

  renderTextarea(field, context) {
    const textarea = document.createElement('textarea');
    textarea.id = `field-${field.id}`;
    textarea.className = `${this.styles.input} ${this.styles.textarea}`;
    textarea.rows = field.rows || 3;
    textarea.placeholder = this.interpolate(field.placeholder || '', context);
    if (field.minLength) textarea.minLength = field.minLength;
    if (field.maxLength) textarea.maxLength = field.maxLength;
    return textarea;
  }

  renderNumber(field, context) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center gap-2';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = `field-${field.id}`;
    input.className = this.styles.input;
    input.step = field.step || 'any';
    input.placeholder = this.interpolate(field.placeholder || '', context);
    input.dataset.fieldId = field.id; // Set data-field-id on actual input!
    if (field.min !== undefined) input.min = field.min;
    if (field.max !== undefined) input.max = field.max;

    wrapper.appendChild(input);

    // Units label
    if (field.units) {
      const units = document.createElement('span');
      units.className = 'text-gray-500 text-sm';
      units.textContent = this.interpolate(field.units, context);
      wrapper.appendChild(units);
    }

    // Mark wrapper so it doesn't get data-field-id set on it
    wrapper._isInputWrapper = true;

    return wrapper;
  }

  renderChoice(field, context) {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex gap-4';

    const options = field.options || ['Yes', 'No'];

    options.forEach((option, i) => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 cursor-pointer';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `field-${field.id}`;
      radio.value = option;
      radio.className = 'w-4 h-4 text-purple-600 focus:ring-purple-500';
      if (i === 0) radio.dataset.fieldId = field.id; // Mark first for getValue

      const text = document.createElement('span');
      text.textContent = this.interpolate(option, context);

      label.appendChild(radio);
      label.appendChild(text);
      wrapper.appendChild(label);
    });

    // Custom querySelector for radio groups
    wrapper.querySelector = (sel) => {
      if (sel.includes('data-field-id')) {
        return wrapper.querySelector(`input[name="field-${field.id}"]:checked`) ||
               wrapper.querySelector(`input[name="field-${field.id}"]`);
      }
      return HTMLElement.prototype.querySelector.call(wrapper, sel);
    };

    return wrapper;
  }

  renderDropdown(field, context) {
    const select = document.createElement('select');
    select.id = `field-${field.id}`;
    select.className = this.styles.input;

    // Placeholder option
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = field.placeholder || 'Select...';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    // Options
    const options = field.options || [];
    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.textContent = this.interpolate(option, context);
      select.appendChild(opt);
    });

    return select;
  }

  renderText(field, context) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `field-${field.id}`;
    input.className = this.styles.input;
    input.placeholder = this.interpolate(field.placeholder || '', context);
    if (field.minLength) input.minLength = field.minLength;
    if (field.maxLength) input.maxLength = field.maxLength;
    return input;
  }

  renderVisualRadical(field, context) {
    const wrapper = document.createElement('div');
    wrapper.className = 'visual-radical-container';
    wrapper._isInputWrapper = true;

    // Get the total squares from context (radicand)
    const totalSquares = context.radicand || 12;

    // Create the game after a brief delay to ensure DOM is ready
    setTimeout(() => {
      const game = new RadicalGame(wrapper, {
        squareSize: 28,
        onAnswerChange: (answer) => {
          // Store the answer for grading
          wrapper._visualAnswer = answer;
        }
      });

      // Load the problem
      game.loadProblem(totalSquares);

      // Store reference for getValue and cleanup
      this.visualizers.set(field.id, game);
      wrapper._visualizer = game;
    }, 0);

    // Mark for data-field-id handling
    wrapper.dataset.fieldId = field.id;

    return wrapper;
  }

  renderVisualRadicalPrime(field, context) {
    const wrapper = document.createElement('div');
    wrapper.className = 'visual-radical-prime-container';
    wrapper._isInputWrapper = true;

    // Get the radicand from context
    const radicand = context.radicand || 72;

    // Create the prime factorization game after a brief delay
    setTimeout(() => {
      const game = new RadicalPrimeGame(wrapper, {
        onAnswerChange: (answer) => {
          // Store the answer for grading
          wrapper._visualAnswer = answer;
        }
      });

      // Load the problem
      game.loadProblem(radicand);

      // Store reference for getValue and cleanup
      this.visualizers.set(field.id, game);
      wrapper._visualizer = game;
    }, 0);

    // Mark for data-field-id handling
    wrapper.dataset.fieldId = field.id;

    return wrapper;
  }

  // ============== VALUE ACCESS ==============

  /**
   * Get value of a single field
   */
  getValue(fieldId) {
    const field = this.fields.get(fieldId);
    if (!field) return null;

    // Handle visual-radical type
    if (field.config.type === 'visual-radical' || field.config.type === 'visual-radical-prime') {
      const visualizer = this.visualizers.get(fieldId);
      if (visualizer) {
        return visualizer.getAnswer();
      }
      // Fallback to stored answer
      const wrapper = field.element.querySelector('.visual-radical-container, .visual-radical-prime-container');
      return wrapper?._visualAnswer || { coefficient: 1, radicand: 0 };
    }

    const input = field.inputEl;
    if (!input) return null;

    // Handle radio buttons
    if (field.config.type === 'choice') {
      const checked = this.container.querySelector(
        `input[name="field-${fieldId}"]:checked`
      );
      return checked ? checked.value : null;
    }

    return input.value;
  }

  /**
   * Get all field values
   */
  getAllValues() {
    const values = {};
    for (const [id] of this.fields) {
      values[id] = this.getValue(id);
    }
    return values;
  }

  /**
   * Set value of a field
   */
  setValue(fieldId, value) {
    const field = this.fields.get(fieldId);
    if (!field) return;

    if (field.config.type === 'choice') {
      const radio = this.container.querySelector(
        `input[name="field-${fieldId}"][value="${value}"]`
      );
      if (radio) radio.checked = true;
    } else {
      field.inputEl.value = value;
    }
  }

  /**
   * Clear all fields
   */
  clear() {
    for (const [id, field] of this.fields) {
      if (field.config.type === 'choice') {
        const radios = this.container.querySelectorAll(`input[name="field-${id}"]`);
        radios.forEach(r => r.checked = false);
      } else if (field.config.type === 'visual-radical' || field.config.type === 'visual-radical-prime') {
        // Reset the visualizer
        const visualizer = this.visualizers.get(id);
        if (visualizer) {
          visualizer.reset();
        }
      } else if (field.inputEl) {
        field.inputEl.value = '';
      }
      this.hideFeedback(id);
      this.hideHint(id);
    }
  }

  // ============== HINTS ==============

  toggleHint(fieldId) {
    const hintEl = this.container.querySelector(`[data-hint="${fieldId}"]`);
    if (!hintEl) return;

    const isHidden = hintEl.classList.contains('hidden');
    if (isHidden) {
      hintEl.classList.remove('hidden');
      this.onHintRequested(fieldId);
    } else {
      hintEl.classList.add('hidden');
    }
  }

  showHint(fieldId) {
    const hintEl = this.container.querySelector(`[data-hint="${fieldId}"]`);
    if (hintEl) {
      hintEl.classList.remove('hidden');
      this.onHintRequested(fieldId);
    }
  }

  hideHint(fieldId) {
    const hintEl = this.container.querySelector(`[data-hint="${fieldId}"]`);
    if (hintEl) hintEl.classList.add('hidden');
  }

  // ============== FEEDBACK ==============

  showFeedback(fieldId, result) {
    const feedbackEl = this.container.querySelector(`[data-feedback="${fieldId}"]`);
    if (!feedbackEl) return;

    // Build class list based on score
    const score = result.score;
    let scoreClass;
    if (score === 'E' || score === true) {
      scoreClass = this.styles.feedbackE;
    } else if (score === 'P') {
      scoreClass = this.styles.feedbackP;
    } else {
      scoreClass = this.styles.feedbackI;
    }

    // Set className directly (handles space-separated classes properly)
    // Note: no 'hidden' class - feedback should be visible
    feedbackEl.className = `${this.styles.feedback} ${scoreClass}`;
    feedbackEl.innerHTML = result.feedback || (score === 'E' ? 'Correct!' : 'Review your answer.');

    // Ensure it's visible (remove hidden if it was there)
    feedbackEl.style.display = '';
  }

  hideFeedback(fieldId) {
    const feedbackEl = this.container.querySelector(`[data-feedback="${fieldId}"]`);
    if (feedbackEl) feedbackEl.classList.add('hidden');
  }

  showAllFeedback(results) {
    for (const [fieldId, result] of Object.entries(results.fields || results)) {
      this.showFeedback(fieldId, result);
    }
  }

  /**
   * Hide all feedback
   */
  clearAllFeedback() {
    for (const [fieldId] of this.fields) {
      this.hideFeedback(fieldId);
    }
  }

  // ============== HELPERS ==============

  interpolate(template, context) {
    if (typeof template !== 'string') return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }

  /**
   * Disable all inputs
   */
  disable() {
    for (const [id, field] of this.fields) {
      if (field.config.type === 'visual-radical' || field.config.type === 'visual-radical-prime') {
        // Visual components handle their own disabling
        const wrapper = this.container.querySelector(`[data-field-id="${id}"]`);
        if (wrapper) wrapper.style.pointerEvents = 'none';
      } else if (field.inputEl) {
        field.inputEl.disabled = true;
      }
    }
  }

  /**
   * Enable all inputs
   */
  enable() {
    for (const [id, field] of this.fields) {
      if (field.config.type === 'visual-radical' || field.config.type === 'visual-radical-prime') {
        const wrapper = this.container.querySelector(`[data-field-id="${id}"]`);
        if (wrapper) wrapper.style.pointerEvents = '';
      } else if (field.inputEl) {
        field.inputEl.disabled = false;
      }
    }
  }

  /**
   * Focus first input
   */
  focusFirst() {
    const first = this.fields.values().next().value;
    // Skip visual types for focus
    if (first?.config?.type === 'visual-radical' || first?.config?.type === 'visual-radical-prime') return;
    if (first?.inputEl) first.inputEl.focus();
  }
}

export default InputRenderer;

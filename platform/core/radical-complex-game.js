/**
 * Radical Complex Game - Level 4
 * Like RadicalPrimeGame but handles negative radicands
 * √(-72) = √(-1×2×2×2×3×3) → drag out -1 (becomes i), (2,2), (3,3) → 6i√2
 */

export class RadicalComplexGame {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.config = {
      ...config
    };

    this.originalRadicand = -72;
    this.isNegative = false;
    this.absRadicand = 72;
    this.insideFactors = [];       // Factors still under the radical (positive primes)
    this.hasNegativeInside = false; // Is -1 still inside?
    this.outsidePairs = [];        // Pairs that have been extracted (numbers)
    this.hasIOutside = false;      // Has -1 been extracted as i?
    this.onAnswerChange = config.onAnswerChange || (() => {});

    this.draggedElement = null;
    this.draggedIndex = null;

    this.init();
  }

  init() {
    this.container.innerHTML = '';

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'radical-complex-game';
    this.wrapper.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Instructions -->
        <div class="text-center text-sm text-gray-600 bg-purple-50 p-2 rounded-lg border border-purple-200">
          <strong>Step 1:</strong> Click buttons to build the factorization (including −1 for negatives).
          <strong>Step 2:</strong> Drag pairs outside. Dragging −1 out gives you <strong>i</strong>.
        </div>

        <!-- Main area: Inside and Outside -->
        <div class="flex gap-4 items-stretch">

          <!-- INSIDE the radical -->
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-500 mb-2">INSIDE √ (factors to simplify)</div>
            <div class="inside-zone bg-indigo-50 rounded-lg p-4 min-h-[140px] border-2 border-indigo-300 border-dashed"
                 data-zone="inside">
              <div class="text-3xl font-bold text-indigo-600 mb-3 text-center">
                √<span class="radicand-value"></span>
              </div>
              <div class="inside-factors flex flex-wrap gap-2 justify-center min-h-[40px]">
                <!-- Prime factor chips go here -->
              </div>
              <div class="factorization-display text-sm text-indigo-500 mt-2 text-center"></div>
            </div>
          </div>

          <!-- OUTSIDE the radical -->
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-500 mb-2">OUTSIDE √ (extracted)</div>
            <div class="outside-zone bg-green-50 rounded-lg p-4 min-h-[140px] border-2 border-green-300 border-dashed"
                 data-zone="outside">
              <div class="text-3xl font-bold text-green-600 mb-3 text-center coefficient-value">1</div>
              <div class="outside-factors flex flex-wrap gap-2 justify-center min-h-[40px]">
                <!-- Extracted pairs go here -->
              </div>
              <div class="pairs-display text-sm text-green-500 mt-2 text-center"></div>
            </div>
          </div>

        </div>

        <!-- Factor buttons -->
        <div class="flex flex-col gap-2">
          <div class="text-sm text-gray-600 text-center">Click to add a factor:</div>
          <div class="factor-buttons flex items-center justify-center gap-2 flex-wrap">
            <!-- Generated dynamically -->
          </div>
          <div class="flex justify-center gap-2 mt-1">
            <button class="undo-btn bg-gray-400 hover:bg-gray-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm transition-colors">
              ↩ Undo
            </button>
            <button class="reset-btn bg-red-400 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm transition-colors">
              Reset
            </button>
          </div>
        </div>

        <!-- Answer display -->
        <div class="answer-display bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
          <div class="text-sm text-gray-600 mb-2">Your simplified form:</div>
          <div class="flex items-center justify-center gap-3">
            <div class="answer-formula text-3xl font-bold text-purple-700"></div>
          </div>
          <div class="answer-status text-sm mt-2 text-center"></div>
        </div>
      </div>
    `;
    this.container.appendChild(this.wrapper);

    // Get elements
    this.radicandValue = this.wrapper.querySelector('.radicand-value');
    this.insideFactorsEl = this.wrapper.querySelector('.inside-factors');
    this.outsideFactorsEl = this.wrapper.querySelector('.outside-factors');
    this.coefficientValue = this.wrapper.querySelector('.coefficient-value');
    this.factorizationDisplay = this.wrapper.querySelector('.factorization-display');
    this.pairsDisplay = this.wrapper.querySelector('.pairs-display');
    this.answerFormula = this.wrapper.querySelector('.answer-formula');
    this.answerStatus = this.wrapper.querySelector('.answer-status');
    this.factorButtonsContainer = this.wrapper.querySelector('.factor-buttons');
    this.insideZone = this.wrapper.querySelector('.inside-zone');
    this.outsideZone = this.wrapper.querySelector('.outside-zone');

    // Button events
    this.wrapper.querySelector('.undo-btn').addEventListener('click', () => this.undo());
    this.wrapper.querySelector('.reset-btn').addEventListener('click', () => this.reset());

    // Drop zone events
    this.setupDropZones();
  }

  setupDropZones() {
    // Allow dropping on outside zone
    this.outsideZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.outsideZone.classList.add('ring-2', 'ring-green-400');
    });

    this.outsideZone.addEventListener('dragleave', () => {
      this.outsideZone.classList.remove('ring-2', 'ring-green-400');
    });

    this.outsideZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.outsideZone.classList.remove('ring-2', 'ring-green-400');
      if (this.draggedElement) {
        if (this.draggedElement.dataset.factor === '-1') {
          this.extractNegative();
        } else if (this.draggedIndex !== null) {
          this.extractPair(this.draggedIndex);
        }
      }
    });

    // Allow dropping back to inside zone (return)
    this.insideZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.insideZone.classList.add('ring-2', 'ring-indigo-400');
    });

    this.insideZone.addEventListener('dragleave', () => {
      this.insideZone.classList.remove('ring-2', 'ring-indigo-400');
    });

    this.insideZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.insideZone.classList.remove('ring-2', 'ring-indigo-400');
      if (this.draggedElement) {
        if (this.draggedElement.dataset.isI === 'true') {
          this.returnNegative();
        } else if (this.draggedElement.dataset.pairIndex !== undefined) {
          this.returnPair(parseInt(this.draggedElement.dataset.pairIndex));
        }
      }
    });
  }

  generateFactorButtons() {
    const primes = [2, 3, 5, 7, 11, 13];

    // Add -1 button if radicand is negative
    let buttons = '';
    if (this.isNegative) {
      buttons += `
        <button class="factor-btn bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-bold transition-colors" data-factor="-1">
          ×(−1)
        </button>
      `;
    }

    buttons += primes.map(p => `
      <button class="factor-btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-colors" data-factor="${p}">
        ×${p}
      </button>
    `).join('');

    this.factorButtonsContainer.innerHTML = buttons;

    this.factorButtonsContainer.querySelectorAll('.factor-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const factor = parseInt(btn.dataset.factor);
        if (factor === -1) {
          this.addNegativeFactor();
        } else {
          this.addPrimeFactor(factor);
        }
      });
    });
  }

  loadProblem(radicand, config = {}) {
    this.originalRadicand = radicand;
    this.isNegative = radicand < 0;
    this.absRadicand = Math.abs(radicand);
    this.problemConfig = config;
    this.reset();
  }

  reset() {
    this.insideFactors = [];
    this.hasNegativeInside = false;
    this.outsidePairs = [];
    this.hasIOutside = false;
    this.actionHistory = [];
    this.generateFactorButtons();
    this.render();
    this.updateAnswer();
  }

  // Add -1 factor
  addNegativeFactor() {
    if (this.hasNegativeInside) {
      this.showMessage('−1 is already added', 'error');
      return;
    }
    if (!this.isNegative) {
      this.showMessage('This radicand is not negative', 'error');
      return;
    }

    this.actionHistory.push({ type: 'add-negative' });
    this.hasNegativeInside = true;

    this.render();
    this.updateAnswer();
  }

  // Add a prime factor
  addPrimeFactor(prime) {
    const currentProduct = this.insideFactors.reduce((a, b) => a * b, 1);

    if (currentProduct * prime > this.absRadicand) {
      this.showMessage(`Adding ${prime} would exceed ${this.absRadicand}`, 'error');
      return;
    }

    if (this.absRadicand % (currentProduct * prime) !== 0) {
      this.showMessage(`${this.absRadicand} is not divisible by ${currentProduct * prime}`, 'error');
      return;
    }

    this.actionHistory.push({ type: 'add', prime });
    this.insideFactors.push(prime);
    this.insideFactors.sort((a, b) => a - b);

    this.render();
    this.updateAnswer();
  }

  // Extract -1 as i
  extractNegative() {
    if (!this.hasNegativeInside) {
      this.showMessage('No −1 to extract', 'error');
      return;
    }

    this.actionHistory.push({ type: 'extract-negative' });
    this.hasNegativeInside = false;
    this.hasIOutside = true;

    this.render();
    this.updateAnswer();
  }

  // Return i back to -1 inside
  returnNegative() {
    if (!this.hasIOutside) return;

    this.actionHistory.push({ type: 'return-negative' });
    this.hasIOutside = false;
    this.hasNegativeInside = true;

    this.render();
    this.updateAnswer();
  }

  // Extract a pair of matching primes to outside
  extractPair(factorIndex) {
    const factor = this.insideFactors[factorIndex];

    const indices = [];
    for (let i = 0; i < this.insideFactors.length; i++) {
      if (this.insideFactors[i] === factor) {
        indices.push(i);
      }
    }

    if (indices.length < 2) {
      this.showMessage(`Need two ${factor}s to make a pair!`, 'error');
      return;
    }

    const newInside = [...this.insideFactors];
    const idx1 = indices[indices.length - 1];
    const idx2 = indices[indices.length - 2];
    newInside.splice(idx1, 1);
    newInside.splice(idx2, 1);

    this.actionHistory.push({
      type: 'extract',
      factor,
      fromIndices: [idx2, idx1]
    });

    this.insideFactors = newInside;
    this.outsidePairs.push(factor);

    this.render();
    this.updateAnswer();
  }

  // Return a pair from outside back to inside
  returnPair(pairIndex) {
    if (pairIndex >= this.outsidePairs.length) return;

    const factor = this.outsidePairs[pairIndex];

    this.actionHistory.push({
      type: 'return',
      factor,
      pairIndex
    });

    this.outsidePairs.splice(pairIndex, 1);
    this.insideFactors.push(factor, factor);
    this.insideFactors.sort((a, b) => a - b);

    this.render();
    this.updateAnswer();
  }

  undo() {
    if (this.actionHistory.length === 0) return;

    const lastAction = this.actionHistory.pop();

    if (lastAction.type === 'add') {
      const idx = this.insideFactors.lastIndexOf(lastAction.prime);
      if (idx !== -1) {
        this.insideFactors.splice(idx, 1);
      }
    } else if (lastAction.type === 'add-negative') {
      this.hasNegativeInside = false;
    } else if (lastAction.type === 'extract') {
      this.outsidePairs.pop();
      this.insideFactors.push(lastAction.factor, lastAction.factor);
      this.insideFactors.sort((a, b) => a - b);
    } else if (lastAction.type === 'extract-negative') {
      this.hasIOutside = false;
      this.hasNegativeInside = true;
    } else if (lastAction.type === 'return') {
      this.insideFactors.splice(this.insideFactors.lastIndexOf(lastAction.factor), 1);
      this.insideFactors.splice(this.insideFactors.lastIndexOf(lastAction.factor), 1);
      this.outsidePairs.splice(lastAction.pairIndex, 0, lastAction.factor);
    } else if (lastAction.type === 'return-negative') {
      this.hasNegativeInside = false;
      this.hasIOutside = true;
    }

    this.render();
    this.updateAnswer();
  }

  // ==================== RENDERING ====================

  render() {
    // Show original radicand
    this.radicandValue.textContent = this.originalRadicand;

    // Render inside factors
    this.renderInsideFactors();

    // Render outside
    this.renderOutside();

    // Calculate and show coefficient
    const numericCoeff = this.outsidePairs.reduce((a, b) => a * b, 1);
    const coeffStr = this.hasIOutside
      ? (numericCoeff === 1 ? 'i' : `${numericCoeff}i`)
      : (numericCoeff === 1 ? '1' : `${numericCoeff}`);
    this.coefficientValue.textContent = coeffStr;

    // Show factorization so far
    let factorStr = '';
    if (this.hasNegativeInside) {
      factorStr = '−1';
      if (this.insideFactors.length > 0) {
        factorStr += '×' + this.insideFactors.join('×');
      }
    } else if (this.insideFactors.length > 0) {
      factorStr = this.insideFactors.join('×');
    }

    if (factorStr) {
      this.factorizationDisplay.textContent = `= √(${factorStr})`;
    } else {
      this.factorizationDisplay.textContent = '';
    }

    // Show pairs extracted
    let pairsStr = '';
    if (this.hasIOutside) {
      pairsStr = '√(−1)=i';
    }
    if (this.outsidePairs.length > 0) {
      const pairsList = this.outsidePairs.map(p => `(${p}×${p})`).join(', ');
      pairsStr = pairsStr ? pairsStr + ', ' + pairsList : pairsList;
    }
    this.pairsDisplay.textContent = pairsStr || 'Drag factors here';

    // Update undo button
    this.wrapper.querySelector('.undo-btn').disabled = this.actionHistory.length === 0;
  }

  renderInsideFactors() {
    let html = '';

    // Render -1 if present
    if (this.hasNegativeInside) {
      html += `
        <div class="factor-chip cursor-grab ring-2 ring-pink-400 bg-pink-500 text-white px-3 py-1 rounded-full font-bold text-lg select-none"
             draggable="true"
             data-factor="-1">
          −1
        </div>
      `;
    }

    // Count occurrences of each factor
    const counts = {};
    this.insideFactors.forEach(f => {
      counts[f] = (counts[f] || 0) + 1;
    });

    // Create chips
    this.insideFactors.forEach((factor, index) => {
      const count = counts[factor];
      const hasPair = count >= 2;
      const pairClass = hasPair ? 'cursor-grab ring-2 ring-green-400' : 'opacity-60';

      html += `
        <div class="factor-chip ${pairClass} bg-indigo-500 text-white px-3 py-1 rounded-full font-bold text-lg select-none"
             draggable="${hasPair}"
             data-factor="${factor}"
             data-index="${index}">
          ${factor}
        </div>
      `;
    });

    this.insideFactorsEl.innerHTML = html || '<span class="text-gray-400 text-sm">Click buttons to build factorization</span>';

    // Add drag events for -1
    const negChip = this.insideFactorsEl.querySelector('[data-factor="-1"]');
    if (negChip) {
      negChip.addEventListener('dragstart', (e) => {
        this.draggedElement = negChip;
        this.draggedIndex = null;
        negChip.classList.add('opacity-50');
      });
      negChip.addEventListener('dragend', () => {
        negChip.classList.remove('opacity-50');
        this.draggedElement = null;
      });
    }

    // Add drag events for prime chips
    this.insideFactorsEl.querySelectorAll('.factor-chip[draggable="true"]:not([data-factor="-1"])').forEach(chip => {
      chip.addEventListener('dragstart', (e) => {
        this.draggedElement = chip;
        this.draggedIndex = parseInt(chip.dataset.index);
        chip.classList.add('opacity-50');
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('opacity-50');
        this.draggedElement = null;
        this.draggedIndex = null;
      });
    });
  }

  renderOutside() {
    let html = '';

    // Render i if extracted
    if (this.hasIOutside) {
      html += `
        <div class="pair-chip cursor-grab bg-pink-500 text-white px-3 py-1 rounded-full font-bold text-lg select-none"
             draggable="true"
             data-is-i="true">
          i
        </div>
      `;
    }

    // Render extracted pairs
    this.outsidePairs.forEach((factor, index) => {
      html += `
        <div class="pair-chip cursor-grab bg-green-500 text-white px-3 py-1 rounded-full font-bold text-lg select-none"
             draggable="true"
             data-pair-index="${index}"
             data-factor="${factor}">
          ${factor}
        </div>
      `;
    });

    this.outsideFactorsEl.innerHTML = html || '<span class="text-gray-400 text-sm">Drop factors here</span>';

    // Add drag events for i
    const iChip = this.outsideFactorsEl.querySelector('[data-is-i="true"]');
    if (iChip) {
      iChip.addEventListener('dragstart', (e) => {
        this.draggedElement = iChip;
        iChip.classList.add('opacity-50');
      });
      iChip.addEventListener('dragend', () => {
        iChip.classList.remove('opacity-50');
        this.draggedElement = null;
      });
    }

    // Add drag events for pairs
    this.outsideFactorsEl.querySelectorAll('.pair-chip:not([data-is-i])').forEach(chip => {
      chip.addEventListener('dragstart', (e) => {
        this.draggedElement = chip;
        chip.classList.add('opacity-50');
      });

      chip.addEventListener('dragend', () => {
        chip.classList.remove('opacity-50');
        this.draggedElement = null;
      });
    });
  }

  // ==================== ANSWER ====================

  updateAnswer() {
    const numericCoeff = this.outsidePairs.reduce((a, b) => a * b, 1) || 1;
    const remainingProduct = this.insideFactors.reduce((a, b) => a * b, 1) || 1;

    // Calculate what the total should be
    const signMultiplier = (this.hasNegativeInside ? -1 : 1) * (this.hasIOutside ? -1 : 1);
    const currentTotal = signMultiplier * numericCoeff * numericCoeff * remainingProduct;

    const isComplete = currentTotal === this.originalRadicand;

    // Check if fully simplified
    const counts = {};
    this.insideFactors.forEach(f => counts[f] = (counts[f] || 0) + 1);
    const hasUnextractedPairs = Object.values(counts).some(c => c >= 2);
    const needsToExtractNegative = this.isNegative && this.hasNegativeInside && !this.hasIOutside;

    let formulaHtml = '';
    let statusHtml = '';
    let statusClass = '';

    if (this.insideFactors.length === 0 && !this.hasNegativeInside && !this.hasIOutside && this.outsidePairs.length === 0) {
      formulaHtml = `√${this.originalRadicand}`;
      statusHtml = 'Click buttons to build the factorization';
      statusClass = 'text-gray-500';
    } else if (!isComplete) {
      formulaHtml = this.buildFormulaString(numericCoeff, remainingProduct);
      statusHtml = `Factorization incomplete. Keep adding factors.`;
      statusClass = 'text-amber-600';
    } else if (hasUnextractedPairs || needsToExtractNegative) {
      formulaHtml = this.buildFormulaString(numericCoeff, remainingProduct);
      statusHtml = 'You can still extract more!';
      statusClass = 'text-amber-600';
    } else {
      formulaHtml = this.buildFormulaString(numericCoeff, remainingProduct);
      statusHtml = '✓ Fully simplified!';
      statusClass = 'text-green-600 font-semibold';
    }

    this.answerFormula.innerHTML = formulaHtml;
    this.answerStatus.innerHTML = statusHtml;
    this.answerStatus.className = `text-sm mt-2 text-center ${statusClass}`;

    this.onAnswerChange({
      coefficient: numericCoeff,
      radicand: remainingProduct,
      hasI: this.hasIOutside,
      isComplete: isComplete,
      isFullySimplified: isComplete && !hasUnextractedPairs && !needsToExtractNegative,
      insideFactors: [...this.insideFactors],
      outsidePairs: [...this.outsidePairs],
      hasNegativeInside: this.hasNegativeInside
    });
  }

  buildFormulaString(coeff, radicand) {
    let result = '';

    if (this.hasIOutside) {
      if (coeff === 1) {
        result = 'i';
      } else {
        result = `${coeff}i`;
      }
    } else {
      result = coeff === 1 ? '' : `${coeff}`;
    }

    if (radicand === 1) {
      if (result === '') result = '1';
    } else {
      result += `√${radicand}`;
    }

    return result || '1';
  }

  showMessage(text, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white font-medium z-50 ${
      type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    }`;
    toast.textContent = text;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // ==================== PUBLIC API ====================

  getAnswer() {
    const coefficient = this.outsidePairs.reduce((a, b) => a * b, 1) || 1;
    const radicand = this.insideFactors.reduce((a, b) => a * b, 1) || 1;

    const signMultiplier = (this.hasNegativeInside ? -1 : 1) * (this.hasIOutside ? -1 : 1);
    const currentTotal = signMultiplier * coefficient * coefficient * radicand;
    const isComplete = currentTotal === this.originalRadicand;

    const counts = {};
    this.insideFactors.forEach(f => counts[f] = (counts[f] || 0) + 1);
    const hasUnextractedPairs = Object.values(counts).some(c => c >= 2);
    const needsToExtractNegative = this.isNegative && this.hasNegativeInside && !this.hasIOutside;

    return {
      coefficient,
      radicand,
      hasI: this.hasIOutside,
      isComplete,
      isFullySimplified: isComplete && !hasUnextractedPairs && !needsToExtractNegative
    };
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default RadicalComplexGame;

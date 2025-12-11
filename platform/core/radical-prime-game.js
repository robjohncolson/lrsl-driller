/**
 * Radical Prime Factorization Game
 * Level 2: Students build prime factorization, then drag pairs outside the radical
 * √72 = √(2×2×2×3×3) → drag out (2,2) and (3,3) → 2×3√2 = 6√2
 */

export class RadicalPrimeGame {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.config = {
      ...config
    };

    this.originalRadicand = 72;
    this.primeFactors = [];        // All prime factors of the radicand
    this.insideFactors = [];       // Factors still under the radical
    this.outsidePairs = [];        // Pairs that have been extracted
    this.onAnswerChange = config.onAnswerChange || (() => {});

    this.draggedElement = null;
    this.draggedIndex = null;

    this.init();
  }

  init() {
    this.container.innerHTML = '';

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'radical-prime-game';
    this.wrapper.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Instructions -->
        <div class="text-center text-sm text-gray-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
          <strong>Step 1:</strong> Click prime buttons to build the factorization.
          <strong>Step 2:</strong> Drag matching pairs to the outside.
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
            <div class="text-xs font-semibold text-gray-500 mb-2">OUTSIDE √ (extracted pairs)</div>
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

        <!-- Prime factor buttons -->
        <div class="flex flex-col gap-2">
          <div class="text-sm text-gray-600 text-center">Click to add a prime factor:</div>
          <div class="prime-buttons flex items-center justify-center gap-2 flex-wrap">
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
    this.primeButtonsContainer = this.wrapper.querySelector('.prime-buttons');
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
      if (this.draggedElement && this.draggedIndex !== null) {
        this.extractPair(this.draggedIndex);
      }
    });

    // Allow dropping back to inside zone (return pair)
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
      // Return pair from outside back to inside
      if (this.draggedElement && this.draggedElement.dataset.pairIndex !== undefined) {
        this.returnPair(parseInt(this.draggedElement.dataset.pairIndex));
      }
    });
  }

  generatePrimeButtons() {
    // Get all prime factors of the radicand to ensure we have buttons for them
    const neededPrimes = this.getPrimeFactors(this.originalRadicand);

    // Base primes plus any extras needed for this specific problem
    const basePrimes = [2, 3, 5, 7, 11, 13];
    const allPrimes = [...new Set([...basePrimes, ...neededPrimes])].sort((a, b) => a - b);

    this.primeButtonsContainer.innerHTML = allPrimes.map(p => `
      <button class="prime-btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-colors" data-prime="${p}">
        ×${p}
      </button>
    `).join('');

    this.primeButtonsContainer.querySelectorAll('.prime-btn').forEach(btn => {
      btn.addEventListener('click', () => this.addPrimeFactor(parseInt(btn.dataset.prime)));
    });
  }

  // Get all prime factors of a number
  getPrimeFactors(n) {
    const factors = [];
    let num = Math.abs(n);
    let divisor = 2;

    while (num > 1) {
      if (num % divisor === 0) {
        if (!factors.includes(divisor)) {
          factors.push(divisor);
        }
        num /= divisor;
      } else {
        divisor++;
      }
    }

    return factors;
  }

  loadProblem(radicand, config = {}) {
    this.originalRadicand = radicand;
    this.problemConfig = config;
    this.reset();
  }

  reset() {
    this.primeFactors = [];
    this.insideFactors = [];
    this.outsidePairs = [];
    this.actionHistory = [];
    this.generatePrimeButtons();
    this.render();
    this.updateAnswer();
  }

  // Add a prime factor (student building the factorization)
  addPrimeFactor(prime) {
    // Calculate current product
    const currentProduct = this.insideFactors.reduce((a, b) => a * b, 1);

    // Check if adding this prime would exceed the radicand
    if (currentProduct * prime > this.originalRadicand) {
      this.showMessage(`Adding ${prime} would exceed √${this.originalRadicand}`, 'error');
      return;
    }

    // Check if the radicand is divisible by this arrangement
    if (this.originalRadicand % (currentProduct * prime) !== 0) {
      this.showMessage(`${this.originalRadicand} is not divisible by ${currentProduct * prime}`, 'error');
      return;
    }

    this.actionHistory.push({ type: 'add', prime });
    this.insideFactors.push(prime);
    this.insideFactors.sort((a, b) => a - b);

    this.render();
    this.updateAnswer();
  }

  // Extract a pair of matching primes to outside
  extractPair(factorIndex) {
    const factor = this.insideFactors[factorIndex];

    // Find if there's a matching pair
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

    // Remove two instances of this factor
    const newInside = [...this.insideFactors];
    // Remove from end first to preserve indices
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
      // Remove the last added prime
      const idx = this.insideFactors.lastIndexOf(lastAction.prime);
      if (idx !== -1) {
        this.insideFactors.splice(idx, 1);
      }
    } else if (lastAction.type === 'extract') {
      // Return the pair to inside
      this.outsidePairs.pop();
      this.insideFactors.push(lastAction.factor, lastAction.factor);
      this.insideFactors.sort((a, b) => a - b);
    } else if (lastAction.type === 'return') {
      // Re-extract the pair
      this.insideFactors.splice(this.insideFactors.lastIndexOf(lastAction.factor), 1);
      this.insideFactors.splice(this.insideFactors.lastIndexOf(lastAction.factor), 1);
      this.outsidePairs.splice(lastAction.pairIndex, 0, lastAction.factor);
    }

    this.render();
    this.updateAnswer();
  }

  // ==================== RENDERING ====================

  render() {
    // Show original radicand
    this.radicandValue.textContent = this.originalRadicand;

    // Render inside factors as draggable chips
    this.renderInsideFactors();

    // Render outside pairs
    this.renderOutsidePairs();

    // Calculate and show coefficient
    const coefficient = this.outsidePairs.reduce((a, b) => a * b, 1);
    this.coefficientValue.textContent = coefficient || 1;

    // Show factorization so far
    if (this.insideFactors.length > 0) {
      this.factorizationDisplay.textContent = `= √(${this.insideFactors.join('×')})`;
    } else {
      this.factorizationDisplay.textContent = '';
    }

    // Show pairs extracted
    if (this.outsidePairs.length > 0) {
      this.pairsDisplay.textContent = `Pairs: ${this.outsidePairs.map(p => `(${p}×${p})`).join(', ')}`;
    } else {
      this.pairsDisplay.textContent = 'Drag matching pairs here';
    }

    // Update undo button
    this.wrapper.querySelector('.undo-btn').disabled = this.actionHistory.length === 0;
  }

  renderInsideFactors() {
    // Count occurrences of each factor
    const counts = {};
    this.insideFactors.forEach(f => {
      counts[f] = (counts[f] || 0) + 1;
    });

    // Create chips - highlight pairs that can be dragged
    let html = '';
    const rendered = {};

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

    this.insideFactorsEl.innerHTML = html || '<span class="text-gray-400 text-sm">Click primes to build factorization</span>';

    // Add drag events
    this.insideFactorsEl.querySelectorAll('.factor-chip[draggable="true"]').forEach(chip => {
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

  renderOutsidePairs() {
    if (this.outsidePairs.length === 0) {
      this.outsideFactorsEl.innerHTML = '<span class="text-gray-400 text-sm">Drop pairs here</span>';
      return;
    }

    let html = '';
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

    this.outsideFactorsEl.innerHTML = html;

    // Add drag events for returning pairs
    this.outsideFactorsEl.querySelectorAll('.pair-chip').forEach(chip => {
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
    const coefficient = this.outsidePairs.reduce((a, b) => a * b, 1) || 1;
    const remainingProduct = this.insideFactors.reduce((a, b) => a * b, 1) || 1;
    const currentTotal = coefficient * coefficient * remainingProduct;

    // Check if factorization is complete
    const isComplete = currentTotal === this.originalRadicand;

    // Check if fully simplified (no pairs left inside)
    const counts = {};
    this.insideFactors.forEach(f => counts[f] = (counts[f] || 0) + 1);
    const hasUnextractedPairs = Object.values(counts).some(c => c >= 2);

    let formulaHtml = '';
    let statusHtml = '';
    let statusClass = '';

    if (this.insideFactors.length === 0 && this.outsidePairs.length === 0) {
      formulaHtml = `√${this.originalRadicand}`;
      statusHtml = 'Click prime buttons to build the factorization';
      statusClass = 'text-gray-500';
    } else if (!isComplete) {
      const needed = this.originalRadicand / currentTotal;
      if (remainingProduct === 1) {
        formulaHtml = `${coefficient}`;
      } else {
        formulaHtml = coefficient > 1 ? `${coefficient}√${remainingProduct}` : `√${remainingProduct}`;
      }
      statusHtml = `Factorization incomplete (${currentTotal} ≠ ${this.originalRadicand}). Need more factors.`;
      statusClass = 'text-amber-600';
    } else if (hasUnextractedPairs) {
      if (remainingProduct === 1) {
        formulaHtml = `${coefficient}`;
      } else {
        formulaHtml = coefficient > 1 ? `${coefficient}√${remainingProduct}` : `√${remainingProduct}`;
      }
      statusHtml = 'You can still extract more pairs!';
      statusClass = 'text-amber-600';
    } else {
      // Fully simplified!
      if (remainingProduct === 1) {
        formulaHtml = `${coefficient}`;
      } else {
        formulaHtml = coefficient > 1 ? `${coefficient}√${remainingProduct}` : `√${remainingProduct}`;
      }
      statusHtml = '✓ Fully simplified!';
      statusClass = 'text-green-600 font-semibold';
    }

    this.answerFormula.innerHTML = formulaHtml;
    this.answerStatus.innerHTML = statusHtml;
    this.answerStatus.className = `text-sm mt-2 text-center ${statusClass}`;

    this.onAnswerChange({
      coefficient: coefficient,
      radicand: remainingProduct,
      isComplete: isComplete,
      isFullySimplified: isComplete && !hasUnextractedPairs,
      insideFactors: [...this.insideFactors],
      outsidePairs: [...this.outsidePairs]
    });
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
    const currentTotal = coefficient * coefficient * radicand;
    const isComplete = currentTotal === this.originalRadicand;

    // Check if any pairs remain inside
    const counts = {};
    this.insideFactors.forEach(f => counts[f] = (counts[f] || 0) + 1);
    const hasUnextractedPairs = Object.values(counts).some(c => c >= 2);

    return {
      coefficient,
      radicand,
      isComplete,
      isFullySimplified: isComplete && !hasUnextractedPairs
    };
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default RadicalPrimeGame;

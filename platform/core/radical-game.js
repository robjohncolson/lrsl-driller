/**
 * Radical Simplifier - Factor-based grouping
 * Extract perfect square FACTORS (not partitions) from the radicand
 * √48 = √(16×3) = 4√3, not √48 = √(16+16+16)
 */

export class RadicalGame {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.config = {
      squareSize: 32,
      ...config
    };

    this.originalRadicand = 12;
    this.currentRadicand = 12;
    this.coefficient = 1;
    this.extractedFactors = []; // Track what was extracted
    this.onAnswerChange = config.onAnswerChange || (() => {});

    this.init();
  }

  init() {
    this.container.innerHTML = '';

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'radical-simplifier';
    this.wrapper.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Main area -->
        <div class="flex gap-6 items-start">

          <!-- Current radicand visualization -->
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-500 mb-2">UNDER THE RADICAL</div>
            <div class="radicand-display bg-indigo-50 rounded-lg p-4 min-h-[160px] flex flex-col items-center justify-center border-2 border-indigo-200">
              <div class="text-4xl font-bold text-indigo-600 mb-2">√<span class="radicand-value"></span></div>
              <div class="squares-grid"></div>
            </div>
          </div>

          <!-- Extracted coefficient -->
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-500 mb-2">COEFFICIENT (outside √)</div>
            <div class="coefficient-display bg-green-50 rounded-lg p-4 min-h-[160px] flex flex-col items-center justify-center border-2 border-green-200">
              <div class="text-4xl font-bold text-green-600 coefficient-value">1</div>
              <div class="extracted-list text-sm text-green-600 mt-2"></div>
            </div>
          </div>

        </div>

        <!-- Action buttons -->
        <div class="flex flex-col gap-2">
          <div class="text-sm text-gray-600 text-center">Extract a perfect square factor:</div>
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <button class="extract-btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-colors" data-factor="4">
              ÷4 <span class="text-indigo-200 text-sm">(×2)</span>
            </button>
            <button class="extract-btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-colors" data-factor="9">
              ÷9 <span class="text-indigo-200 text-sm">(×3)</span>
            </button>
            <button class="extract-btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-colors" data-factor="16">
              ÷16 <span class="text-indigo-200 text-sm">(×4)</span>
            </button>
            <button class="extract-btn bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold transition-colors" data-factor="25">
              ÷25 <span class="text-indigo-200 text-sm">(×5)</span>
            </button>
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
          <div class="answer-breakdown text-sm text-gray-500 mt-2 text-center"></div>
        </div>
      </div>
    `;
    this.container.appendChild(this.wrapper);

    // Get elements
    this.radicandValue = this.wrapper.querySelector('.radicand-value');
    this.squaresGrid = this.wrapper.querySelector('.squares-grid');
    this.coefficientValue = this.wrapper.querySelector('.coefficient-value');
    this.extractedList = this.wrapper.querySelector('.extracted-list');
    this.answerFormula = this.wrapper.querySelector('.answer-formula');
    this.answerBreakdown = this.wrapper.querySelector('.answer-breakdown');

    // Button events
    this.wrapper.querySelectorAll('.extract-btn').forEach(btn => {
      btn.addEventListener('click', () => this.extractFactor(parseInt(btn.dataset.factor)));
    });
    this.wrapper.querySelector('.undo-btn').addEventListener('click', () => this.undo());
    this.wrapper.querySelector('.reset-btn').addEventListener('click', () => this.reset());
  }

  loadProblem(totalSquares, config = {}) {
    this.originalRadicand = totalSquares;
    this.problemConfig = config;
    this.reset();
  }

  reset() {
    this.currentRadicand = this.originalRadicand;
    this.coefficient = 1;
    this.extractedFactors = [];
    this.render();
    this.updateAnswer();
  }

  extractFactor(perfectSquare) {
    const root = Math.sqrt(perfectSquare);

    // If factor doesn't divide evenly, do nothing (no hint!)
    if (this.currentRadicand % perfectSquare !== 0) {
      return;
    }

    // Extract the factor
    this.extractedFactors.push({ square: perfectSquare, root: root });
    this.currentRadicand = this.currentRadicand / perfectSquare;
    this.coefficient = this.coefficient * root;

    this.render();
    this.updateAnswer();
  }

  undo() {
    if (this.extractedFactors.length > 0) {
      const last = this.extractedFactors.pop();
      this.currentRadicand = this.currentRadicand * last.square;
      this.coefficient = this.coefficient / last.root;
      this.render();
      this.updateAnswer();
    }
  }

  // ==================== RENDERING ====================

  render() {
    const size = this.config.squareSize;

    // Render radicand
    this.radicandValue.textContent = this.currentRadicand;

    // Render squares grid (show up to 25 squares visually)
    const displayCount = Math.min(this.currentRadicand, 25);
    const cols = Math.min(displayCount, 5);

    if (this.currentRadicand === 1) {
      this.squaresGrid.innerHTML = `<div class="text-green-600 text-sm font-semibold mt-2">= 1 (nothing left!)</div>`;
    } else {
      let squaresHtml = '';
      for (let i = 0; i < displayCount; i++) {
        squaresHtml += `<div class="bg-indigo-500 rounded shadow-sm" style="width: ${size}px; height: ${size}px;"></div>`;
      }
      if (this.currentRadicand > 25) {
        squaresHtml += `<div class="text-indigo-600 text-sm font-bold col-span-full mt-1">+${this.currentRadicand - 25} more</div>`;
      }
      this.squaresGrid.innerHTML = `
        <div class="grid gap-1 mt-2" style="grid-template-columns: repeat(${cols}, ${size}px);">
          ${squaresHtml}
        </div>
      `;
    }

    // Render coefficient
    this.coefficientValue.textContent = this.coefficient;

    // Render extracted factors list
    if (this.extractedFactors.length === 0) {
      this.extractedList.innerHTML = `<span class="text-gray-400">Nothing extracted yet</span>`;
    } else {
      const factors = this.extractedFactors.map(f => `√${f.square}=${f.root}`).join(', ');
      this.extractedList.innerHTML = `Extracted: ${factors}`;
    }

    // Keep all factor buttons enabled - student must figure out which works
    // (clicking invalid one shows error message)

    this.wrapper.querySelector('.undo-btn').disabled = this.extractedFactors.length === 0;
  }

  // ==================== ANSWER ====================

  updateAnswer() {
    let formulaHtml = '';
    let breakdownHtml = '';

    if (this.coefficient === 1 && this.currentRadicand === this.originalRadicand) {
      formulaHtml = `√${this.originalRadicand}`;
      breakdownHtml = `Click a button to extract a perfect square factor (e.g., if divisible by 4, extract √4=2)`;
    } else if (this.currentRadicand === 1) {
      formulaHtml = `${this.coefficient}`;
      breakdownHtml = `√${this.originalRadicand} = ${this.coefficient} (perfect square!)`;
    } else {
      formulaHtml = `${this.coefficient}√${this.currentRadicand}`;
      breakdownHtml = `√${this.originalRadicand} = √(${this.extractedFactors.map(f => f.square).join('×')}×${this.currentRadicand}) = ${this.coefficient}√${this.currentRadicand}`;
    }

    this.answerFormula.innerHTML = formulaHtml;
    this.answerBreakdown.innerHTML = breakdownHtml;

    this.onAnswerChange({
      coefficient: this.coefficient,
      radicand: this.currentRadicand,
      groups: this.extractedFactors.map(f => ({ side: f.root, count: f.square })),
      simplified: this.coefficient > 1 || this.currentRadicand === 1
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
    return {
      coefficient: this.coefficient,
      radicand: this.currentRadicand
    };
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default RadicalGame;

/**
 * Radical Simplifier - Click-to-group interface
 * Shows a pile of squares, click buttons to form 2×2, 3×3, etc. groups
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

    this.totalSquares = 12;
    this.groups = []; // Array of { side: 2|3|4, color: string }
    this.onAnswerChange = config.onAnswerChange || (() => {});

    this.init();
  }

  init() {
    this.container.innerHTML = '';

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'radical-simplifier';
    this.wrapper.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Main area: squares + groups -->
        <div class="flex gap-6 items-start">

          <!-- Remaining squares pile -->
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-500 mb-2">SQUARES REMAINING</div>
            <div class="remaining-display bg-gray-100 rounded-lg p-4 min-h-[140px] flex items-center justify-center">
              <div class="squares-grid"></div>
            </div>
          </div>

          <!-- Formed groups -->
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-500 mb-2">YOUR GROUPS</div>
            <div class="groups-display bg-green-50 rounded-lg p-4 min-h-[140px]">
              <div class="groups-container flex flex-wrap gap-3 justify-center"></div>
              <div class="no-groups-msg text-gray-400 text-center py-8">Click buttons below to form groups</div>
            </div>
          </div>

        </div>

        <!-- Action buttons -->
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <span class="text-sm text-gray-600 mr-2">Form group:</span>
          <button class="group-btn bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-colors" data-size="2">
            2×2 <span class="text-green-200 text-sm">(4)</span>
          </button>
          <button class="group-btn bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-colors" data-size="3">
            3×3 <span class="text-orange-200 text-sm">(9)</span>
          </button>
          <button class="group-btn bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-colors" data-size="4">
            4×4 <span class="text-pink-200 text-sm">(16)</span>
          </button>
          <button class="group-btn bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-colors" data-size="5">
            5×5 <span class="text-cyan-200 text-sm">(25)</span>
          </button>
          <div class="flex-1"></div>
          <button class="undo-btn bg-gray-400 hover:bg-gray-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm transition-colors">
            ↩ Undo
          </button>
          <button class="reset-btn bg-red-400 hover:bg-red-500 text-white px-3 py-2 rounded-lg text-sm transition-colors">
            Reset
          </button>
        </div>

        <!-- Answer display -->
        <div class="answer-display bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
          <div class="text-sm text-gray-600 mb-2">Your simplified form:</div>
          <div class="flex items-center gap-4">
            <div class="answer-visual flex items-center gap-2"></div>
            <div class="text-3xl font-bold text-purple-700">=</div>
            <div class="answer-formula text-3xl font-bold text-purple-700"></div>
          </div>
          <div class="answer-breakdown text-sm text-gray-500 mt-2"></div>
        </div>
      </div>
    `;
    this.container.appendChild(this.wrapper);

    // Get elements
    this.squaresGrid = this.wrapper.querySelector('.squares-grid');
    this.groupsContainer = this.wrapper.querySelector('.groups-container');
    this.noGroupsMsg = this.wrapper.querySelector('.no-groups-msg');
    this.answerVisual = this.wrapper.querySelector('.answer-visual');
    this.answerFormula = this.wrapper.querySelector('.answer-formula');
    this.answerBreakdown = this.wrapper.querySelector('.answer-breakdown');

    // Button events
    this.wrapper.querySelectorAll('.group-btn').forEach(btn => {
      btn.addEventListener('click', () => this.formGroup(parseInt(btn.dataset.size)));
    });
    this.wrapper.querySelector('.undo-btn').addEventListener('click', () => this.undoGroup());
    this.wrapper.querySelector('.reset-btn').addEventListener('click', () => this.reset());
  }

  loadProblem(totalSquares, config = {}) {
    this.totalSquares = totalSquares;
    this.problemConfig = config;
    this.reset();
  }

  reset() {
    this.groups = [];
    this.render();
    this.updateAnswer();
  }

  formGroup(side) {
    const needed = side * side;
    const remaining = this.getRemainingCount();

    if (remaining < needed) {
      this.showMessage(`Need ${needed} squares for ${side}×${side}, only ${remaining} left!`, 'error');
      return;
    }

    const colors = {
      2: '#22c55e',
      3: '#f59e0b',
      4: '#ec4899',
      5: '#06b6d4'
    };

    this.groups.push({
      side,
      count: needed,
      color: colors[side] || '#8b5cf6'
    });

    this.render();
    this.updateAnswer();
  }

  undoGroup() {
    if (this.groups.length > 0) {
      this.groups.pop();
      this.render();
      this.updateAnswer();
    }
  }

  getRemainingCount() {
    const grouped = this.groups.reduce((sum, g) => sum + g.count, 0);
    return this.totalSquares - grouped;
  }

  // ==================== RENDERING ====================

  render() {
    const remaining = this.getRemainingCount();
    const size = this.config.squareSize;

    // Render remaining squares
    const cols = Math.min(remaining, 6);
    let squaresHtml = '';
    for (let i = 0; i < remaining; i++) {
      squaresHtml += `
        <div class="bg-indigo-500 rounded shadow-sm border border-indigo-600"
             style="width: ${size}px; height: ${size}px;"></div>
      `;
    }

    if (remaining === 0) {
      this.squaresGrid.innerHTML = `<div class="text-gray-400 text-sm">All grouped!</div>`;
    } else {
      this.squaresGrid.innerHTML = `
        <div class="grid gap-1" style="grid-template-columns: repeat(${cols}, ${size}px);">
          ${squaresHtml}
        </div>
        <div class="text-center mt-2 text-indigo-600 font-bold">${remaining}</div>
      `;
    }

    // Render groups
    if (this.groups.length === 0) {
      this.groupsContainer.innerHTML = '';
      this.noGroupsMsg.style.display = '';
    } else {
      this.noGroupsMsg.style.display = 'none';
      let groupsHtml = '';

      for (const group of this.groups) {
        const gSize = Math.min(size - 4, 28);
        let groupSquares = '';
        for (let i = 0; i < group.count; i++) {
          groupSquares += `<div style="width: ${gSize}px; height: ${gSize}px; background: ${group.color}; border-radius: 2px;"></div>`;
        }

        groupsHtml += `
          <div class="group-item flex flex-col items-center p-2 bg-white rounded-lg shadow-sm border-2" style="border-color: ${group.color}">
            <div class="grid gap-0.5" style="grid-template-columns: repeat(${group.side}, ${gSize}px);">
              ${groupSquares}
            </div>
            <div class="mt-1 text-xs font-bold" style="color: ${group.color}">${group.side}×${group.side}</div>
          </div>
        `;
      }

      this.groupsContainer.innerHTML = groupsHtml;
    }

    // Update button states
    this.wrapper.querySelectorAll('.group-btn').forEach(btn => {
      const needed = Math.pow(parseInt(btn.dataset.size), 2);
      btn.disabled = remaining < needed;
    });

    this.wrapper.querySelector('.undo-btn').disabled = this.groups.length === 0;
  }

  // ==================== ANSWER ====================

  updateAnswer() {
    const remaining = this.getRemainingCount();

    // Coefficient is product of all group sides
    let coefficient = 1;
    for (const group of this.groups) {
      coefficient *= group.side;
    }

    const sqSize = 18;
    let visualHtml = '';
    let formulaHtml = '';
    let breakdownHtml = '';

    if (this.groups.length === 0) {
      visualHtml = this.renderRadicalVisual(this.totalSquares, sqSize);
      formulaHtml = `√${this.totalSquares}`;
      breakdownHtml = 'Click a button above to form a group (2×2 needs 4 squares, 3×3 needs 9, etc.)';
    } else if (remaining === 0) {
      visualHtml = this.renderCoefficientVisual(coefficient, sqSize);
      formulaHtml = `${coefficient}`;
      breakdownHtml = `Perfect square! ${this.groups.map(g => `${g.side}×${g.side}`).join(' × ')} = ${coefficient}`;
    } else {
      visualHtml = this.renderCoefficientVisual(coefficient, sqSize) +
                   `<span class="text-2xl mx-2">×</span>` +
                   this.renderRadicalVisual(remaining, sqSize);
      formulaHtml = `${coefficient}√${remaining}`;
      breakdownHtml = `${this.groups.map(g => `${g.side}`).join(' × ')} = ${coefficient} outside, ${remaining} under √`;
    }

    this.answerVisual.innerHTML = visualHtml;
    this.answerFormula.innerHTML = formulaHtml;
    this.answerBreakdown.innerHTML = breakdownHtml;

    this.onAnswerChange({
      coefficient,
      radicand: remaining,
      groups: this.groups.map(g => ({ side: g.side, count: g.count })),
      simplified: remaining === 0 || coefficient > 1
    });
  }

  renderCoefficientVisual(coefficient, sqSize) {
    return `
      <div class="flex flex-col items-center">
        <div class="text-lg font-bold text-green-600">${coefficient}</div>
        <div class="border-2 border-green-500 rounded bg-green-100"
             style="width: ${sqSize * 2}px; height: ${sqSize * 2}px;"></div>
        <div class="text-xs text-green-600 mt-1">coefficient</div>
      </div>
    `;
  }

  renderRadicalVisual(count, sqSize) {
    const cols = Math.min(count, 5);
    let squaresHtml = '';
    const displayCount = Math.min(count, 10);
    for (let i = 0; i < displayCount; i++) {
      squaresHtml += `<div class="bg-indigo-500 rounded-sm" style="width: ${sqSize - 2}px; height: ${sqSize - 2}px;"></div>`;
    }
    if (count > 10) {
      squaresHtml += `<div class="text-indigo-600 text-xs font-bold">+${count - 10}</div>`;
    }

    return `
      <div class="flex flex-col items-center">
        <div class="text-lg font-bold text-indigo-600">√${count}</div>
        <div class="relative">
          <div class="absolute -left-3 top-0 text-indigo-400 text-xl">√</div>
          <div class="grid gap-0.5 p-1 border-t-2 border-indigo-400 ml-1"
               style="grid-template-columns: repeat(${cols}, ${sqSize - 2}px);">
            ${squaresHtml}
          </div>
        </div>
        <div class="text-xs text-indigo-600 mt-1">radicand</div>
      </div>
    `;
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
    const remaining = this.getRemainingCount();
    let coefficient = 1;
    for (const group of this.groups) {
      coefficient *= group.side;
    }
    return { coefficient, radicand: remaining };
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default RadicalGame;

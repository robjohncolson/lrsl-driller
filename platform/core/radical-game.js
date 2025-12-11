/**
 * Radical Game - Physics-based Square Root Learning
 * Control a unit square with WASD + Space, jump into bins to form perfect squares
 */

export class RadicalGame {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.config = {
      squareSize: 30,
      gravity: 0.5,
      jumpForce: -12,
      moveSpeed: 5,
      ...config
    };

    this.squares = [];
    this.activeSquare = null;
    this.bins = [];
    this.keys = {};
    this.gameLoop = null;

    this.onAnswerChange = config.onAnswerChange || (() => {});

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'radical-game';
    this.wrapper.innerHTML = `
      <div class="flex flex-col gap-3">
        <!-- Instructions -->
        <div class="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg flex items-center gap-4">
          <span><strong>Controls:</strong></span>
          <span class="font-mono bg-white px-2 py-1 rounded">A/D</span> Move
          <span class="font-mono bg-white px-2 py-1 rounded">SPACE</span> Jump
          <span class="text-purple-600 font-semibold ml-auto">Jump into bins to group squares!</span>
        </div>

        <!-- Game canvas -->
        <div class="game-container relative bg-gradient-to-b from-sky-100 to-sky-200 rounded-lg border-2 border-sky-300 overflow-hidden"
             style="height: 300px;" tabindex="0">
          <canvas class="game-canvas"></canvas>
        </div>

        <!-- Answer display -->
        <div class="answer-display bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
          <div class="text-sm text-gray-600 mb-2">Your simplified form:</div>
          <div class="flex items-center gap-4">
            <div class="answer-visual flex items-center gap-2"></div>
            <div class="answer-text text-3xl font-bold text-purple-700">=</div>
            <div class="answer-formula text-3xl font-bold text-purple-700"></div>
          </div>
          <div class="answer-breakdown text-sm text-gray-500 mt-2"></div>
        </div>
      </div>
    `;
    this.container.appendChild(this.wrapper);

    // Get elements
    this.canvas = this.wrapper.querySelector('.game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.gameContainer = this.wrapper.querySelector('.game-container');
    this.answerVisual = this.wrapper.querySelector('.answer-visual');
    this.answerFormula = this.wrapper.querySelector('.answer-formula');
    this.answerBreakdown = this.wrapper.querySelector('.answer-breakdown');

    // Size canvas
    this.resizeCanvas();

    // Keyboard events
    this.gameContainer.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.gameContainer.addEventListener('keyup', (e) => this.onKeyUp(e));
    this.gameContainer.addEventListener('click', () => this.gameContainer.focus());

    // Focus for keyboard
    this.gameContainer.focus();
  }

  resizeCanvas() {
    const rect = this.gameContainer.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = 300;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '300px';
    this.groundY = this.canvas.height - 20;
  }

  loadProblem(totalSquares, config = {}) {
    this.totalSquares = totalSquares;
    this.problemConfig = config;
    this.reset();
    this.startGameLoop();
    this.gameContainer.focus();
  }

  reset() {
    // Stop existing game loop
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }

    this.squares = [];
    this.bins = [];
    this.keys = {};

    const size = this.config.squareSize;

    // Create bins on the right side
    const binWidth = 80;
    const binHeight = 100;
    const binX = this.canvas.width - binWidth - 20;

    // 2×2 bin (needs 4 squares)
    this.bins.push({
      x: binX,
      y: this.groundY - binHeight,
      width: binWidth,
      height: binHeight,
      targetCount: 4,
      side: 2,
      squares: [],
      color: '#22c55e',
      label: '2×2'
    });

    // 3×3 bin (needs 9 squares) - only if we have enough squares
    if (this.totalSquares >= 9) {
      this.bins.push({
        x: binX - binWidth - 20,
        y: this.groundY - binHeight,
        width: binWidth,
        height: binHeight,
        targetCount: 9,
        side: 3,
        squares: [],
        color: '#f59e0b',
        label: '3×3'
      });
    }

    // Create squares in a pile on the left
    const pileX = 60;
    for (let i = 0; i < this.totalSquares; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      this.squares.push({
        id: i,
        x: pileX + col * (size + 2),
        y: this.groundY - size - row * (size + 2),
        vx: 0,
        vy: 0,
        size: size,
        grounded: true,
        inBin: null,
        color: '#6366f1'
      });
    }

    // Select first square
    this.selectNextSquare();
    this.render();
    this.updateAnswer();
  }

  selectNextSquare() {
    // Find first square not in a bin
    this.activeSquare = this.squares.find(sq => sq.inBin === null) || null;
    if (this.activeSquare) {
      this.activeSquare.color = '#ec4899'; // Pink for active
    }
  }

  // ==================== GAME LOOP ====================

  startGameLoop() {
    const loop = () => {
      this.update();
      this.render();
      this.gameLoop = requestAnimationFrame(loop);
    };
    this.gameLoop = requestAnimationFrame(loop);
  }

  update() {
    if (!this.activeSquare) return;

    const sq = this.activeSquare;
    const { gravity, moveSpeed, jumpForce } = this.config;

    // Horizontal movement
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
      sq.vx = -moveSpeed;
    } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
      sq.vx = moveSpeed;
    } else {
      sq.vx *= 0.8; // Friction
    }

    // Jumping
    if ((this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp']) && sq.grounded) {
      sq.vy = jumpForce;
      sq.grounded = false;
    }

    // Apply gravity
    sq.vy += gravity;

    // Update position
    sq.x += sq.vx;
    sq.y += sq.vy;

    // Ground collision
    if (sq.y + sq.size >= this.groundY) {
      sq.y = this.groundY - sq.size;
      sq.vy = 0;
      sq.grounded = true;
    }

    // Wall collision
    if (sq.x < 0) sq.x = 0;
    if (sq.x + sq.size > this.canvas.width) sq.x = this.canvas.width - sq.size;

    // Check bin collision
    for (const bin of this.bins) {
      if (this.isInBin(sq, bin) && sq.inBin === null) {
        this.addToBin(sq, bin);
        break;
      }
    }
  }

  isInBin(sq, bin) {
    const sqCenterX = sq.x + sq.size / 2;
    const sqBottom = sq.y + sq.size;
    return sqCenterX > bin.x && sqCenterX < bin.x + bin.width &&
           sqBottom > bin.y && sq.y < bin.y + bin.height;
  }

  addToBin(sq, bin) {
    sq.inBin = bin;
    sq.color = bin.color;
    bin.squares.push(sq);

    // Position square inside bin
    const idx = bin.squares.length - 1;
    const cols = bin.side;
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const padding = (bin.width - cols * sq.size) / 2;

    sq.x = bin.x + padding + col * sq.size;
    sq.y = bin.y + bin.height - sq.size - row * sq.size - 5;
    sq.vx = 0;
    sq.vy = 0;
    sq.grounded = true;

    // Check if bin is complete
    if (bin.squares.length === bin.targetCount) {
      bin.complete = true;
    }

    // Select next square
    this.selectNextSquare();
    this.updateAnswer();

    // Check if all squares placed
    if (!this.activeSquare) {
      this.showMessage('All squares placed!', 'success');
    }
  }

  // ==================== RENDERING ====================

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ground
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, this.groundY, this.canvas.width, 20);
    ctx.fillStyle = '#a3e635';
    ctx.fillRect(0, this.groundY, this.canvas.width, 5);

    // Draw bins
    for (const bin of this.bins) {
      // Bin back
      ctx.fillStyle = bin.complete ? bin.color + '44' : '#f3f4f6';
      ctx.fillRect(bin.x, bin.y, bin.width, bin.height);

      // Bin border
      ctx.strokeStyle = bin.complete ? bin.color : '#9ca3af';
      ctx.lineWidth = bin.complete ? 4 : 2;
      ctx.strokeRect(bin.x, bin.y, bin.width, bin.height);

      // Bin label
      ctx.fillStyle = bin.complete ? bin.color : '#6b7280';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(bin.label, bin.x + bin.width / 2, bin.y - 8);

      // Progress
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px system-ui';
      ctx.fillText(`${bin.squares.length}/${bin.targetCount}`, bin.x + bin.width / 2, bin.y + bin.height + 15);
    }

    // Draw squares
    for (const sq of this.squares) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(sq.x + 3, sq.y + 3, sq.size, sq.size);

      // Square
      ctx.fillStyle = sq.color;
      ctx.fillRect(sq.x, sq.y, sq.size, sq.size);

      // Border
      ctx.strokeStyle = sq === this.activeSquare ? '#fbbf24' : '#374151';
      ctx.lineWidth = sq === this.activeSquare ? 3 : 1;
      ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);

      // Eyes for active square (fun!)
      if (sq === this.activeSquare) {
        const eyeY = sq.y + sq.size * 0.35;
        const eyeSize = 4;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(sq.x + sq.size * 0.35, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.arc(sq.x + sq.size * 0.65, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(sq.x + sq.size * 0.35 + (this.keys['KeyD'] ? 1 : this.keys['KeyA'] ? -1 : 0), eyeY, 2, 0, Math.PI * 2);
        ctx.arc(sq.x + sq.size * 0.65 + (this.keys['KeyD'] ? 1 : this.keys['KeyA'] ? -1 : 0), eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Instructions if active
    if (this.activeSquare) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('← A | D → | SPACE jump', 10, 20);
    }

    ctx.textAlign = 'left';
  }

  // ==================== INPUT ====================

  onKeyDown(e) {
    this.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
  }

  // ==================== ANSWER ====================

  updateAnswer() {
    let coefficient = 1;
    let grouped = 0;

    for (const bin of this.bins) {
      if (bin.complete) {
        coefficient *= bin.side;
        grouped += bin.targetCount;
      }
    }

    const ungrouped = this.totalSquares - grouped;
    const sqSize = 18;

    let visualHtml = '';
    let formulaHtml = '';
    let breakdownHtml = '';

    if (coefficient === 1 && ungrouped === this.totalSquares) {
      visualHtml = this.renderRadicalVisual(this.totalSquares, sqSize);
      formulaHtml = `√${this.totalSquares}`;
      breakdownHtml = 'Jump squares into bins to form perfect square groups!';
    } else if (ungrouped === 0) {
      visualHtml = this.renderCoefficientVisual(coefficient, sqSize);
      formulaHtml = `${coefficient}`;
      breakdownHtml = `Perfect! All squares grouped.`;
    } else if (coefficient === 1) {
      visualHtml = this.renderRadicalVisual(ungrouped, sqSize);
      formulaHtml = `√${ungrouped}`;
      breakdownHtml = `${ungrouped} squares remaining.`;
    } else {
      visualHtml = this.renderCoefficientVisual(coefficient, sqSize) +
                   `<span class="text-xl mx-1">×</span>` +
                   this.renderRadicalVisual(ungrouped, sqSize);
      formulaHtml = `${coefficient}√${ungrouped}`;
      const completeBins = this.bins.filter(b => b.complete).map(b => b.label).join(' + ');
      breakdownHtml = `${completeBins} complete → ${coefficient} outside | ${ungrouped} under √`;
    }

    this.answerVisual.innerHTML = visualHtml;
    this.answerFormula.innerHTML = formulaHtml;
    this.answerBreakdown.innerHTML = breakdownHtml;

    this.onAnswerChange({
      coefficient,
      radicand: ungrouped,
      groups: this.bins.filter(b => b.complete).map(b => ({ side: b.side, count: b.targetCount })),
      simplified: ungrouped === 0 || coefficient > 1
    });
  }

  renderCoefficientVisual(coefficient, sqSize) {
    return `
      <div class="flex flex-col items-center">
        <div class="text-xs text-green-600 font-bold">${coefficient}</div>
        <div class="border-2 border-green-500 rounded bg-green-100"
             style="width: ${sqSize * 1.5}px; height: ${sqSize * 1.5}px;"></div>
      </div>
    `;
  }

  renderRadicalVisual(count, sqSize) {
    const cols = Math.min(count, 4);
    let squaresHtml = '';
    for (let i = 0; i < count; i++) {
      squaresHtml += `<div class="bg-indigo-500" style="width: ${sqSize - 2}px; height: ${sqSize - 2}px;"></div>`;
    }
    return `
      <div class="flex flex-col items-center">
        <div class="text-xs text-indigo-600 font-bold">√${count}</div>
        <div class="grid gap-0.5 p-1 border-t-2 border-indigo-400"
             style="grid-template-columns: repeat(${cols}, ${sqSize - 2}px);">
          ${squaresHtml}
        </div>
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
    let coefficient = 1;
    let grouped = 0;
    for (const bin of this.bins) {
      if (bin.complete) {
        coefficient *= bin.side;
        grouped += bin.targetCount;
      }
    }
    return { coefficient, radicand: this.totalSquares - grouped };
  }

  destroy() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    this.container.innerHTML = '';
  }
}

export default RadicalGame;

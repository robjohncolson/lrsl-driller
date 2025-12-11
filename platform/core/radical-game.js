/**
 * Radical Game - Physics-based Square Root Learning
 * Control a unit square with WASD, press DOWN to enter doors
 * Doors collect squares - fill with 4 for 2×2, 9 for 3×3, etc.
 */

export class RadicalGame {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.config = {
      squareSize: 28,
      gravity: 0.6,
      jumpForce: -11,
      moveSpeed: 5,
      ...config
    };

    this.squares = [];
    this.activeSquare = null;
    this.doors = [];
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
        <div class="text-sm text-gray-600 bg-blue-50 p-2 rounded-lg flex items-center gap-3 flex-wrap">
          <span class="font-mono bg-white px-2 py-1 rounded">A/D</span> Move
          <span class="font-mono bg-white px-2 py-1 rounded">SPACE</span> Jump
          <span class="font-mono bg-white px-2 py-1 rounded text-orange-600">↓ S</span> Enter door
          <span class="text-purple-600 font-semibold ml-auto">Put 4 in a door for 2×2, 9 for 3×3!</span>
        </div>

        <!-- Game canvas -->
        <div class="game-container relative bg-gradient-to-b from-sky-100 to-sky-200 rounded-lg border-2 border-sky-300 overflow-hidden"
             style="height: 320px;" tabindex="0">
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

    this.canvas = this.wrapper.querySelector('.game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.gameContainer = this.wrapper.querySelector('.game-container');
    this.answerVisual = this.wrapper.querySelector('.answer-visual');
    this.answerFormula = this.wrapper.querySelector('.answer-formula');
    this.answerBreakdown = this.wrapper.querySelector('.answer-breakdown');

    this.resizeCanvas();

    this.gameContainer.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.gameContainer.addEventListener('keyup', (e) => this.onKeyUp(e));
    this.gameContainer.addEventListener('click', () => this.gameContainer.focus());

    this.gameContainer.focus();
  }

  resizeCanvas() {
    const rect = this.gameContainer.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = 320;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '320px';
    this.groundY = this.canvas.height - 30;
  }

  loadProblem(totalSquares, config = {}) {
    this.totalSquares = totalSquares;
    this.problemConfig = config;
    this.reset();
    this.startGameLoop();
    this.gameContainer.focus();
  }

  reset() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
      this.gameLoop = null;
    }

    this.squares = [];
    this.doors = [];
    this.keys = {};

    const size = this.config.squareSize;

    // Create 3 doors spread across the canvas
    const doorWidth = 60;
    const doorHeight = 80;
    const doorColors = ['#22c55e', '#f59e0b', '#ec4899'];
    const numDoors = 3;
    const spacing = (this.canvas.width - 100) / (numDoors + 1);

    for (let i = 0; i < numDoors; i++) {
      this.doors.push({
        id: i,
        x: 80 + spacing * (i + 1) - doorWidth / 2,
        y: this.groundY - doorHeight,
        width: doorWidth,
        height: doorHeight,
        squares: [],
        color: doorColors[i],
        label: String.fromCharCode(65 + i) // A, B, C
      });
    }

    // Create squares in a pile on the left
    const pileX = 30;
    for (let i = 0; i < this.totalSquares; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;
      this.squares.push({
        id: i,
        x: pileX + col * (size + 2),
        y: this.groundY - size - row * (size + 2),
        vx: 0,
        vy: 0,
        size: size,
        grounded: true,
        inDoor: null,
        color: '#6366f1'
      });
    }

    this.selectNextSquare();
    this.render();
    this.updateAnswer();
  }

  selectNextSquare() {
    this.activeSquare = this.squares.find(sq => sq.inDoor === null) || null;
    if (this.activeSquare) {
      this.activeSquare.color = '#818cf8';
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
      sq.vx *= 0.85;
    }

    // Jumping
    if ((this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp']) && sq.grounded) {
      sq.vy = jumpForce;
      sq.grounded = false;
    }

    // Enter door with DOWN
    if ((this.keys['KeyS'] || this.keys['ArrowDown']) && sq.grounded) {
      const door = this.getDoorAt(sq);
      if (door) {
        this.enterDoor(sq, door);
        this.keys['KeyS'] = false;
        this.keys['ArrowDown'] = false;
        return;
      }
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
  }

  getDoorAt(sq) {
    const sqCenterX = sq.x + sq.size / 2;
    for (const door of this.doors) {
      if (sqCenterX > door.x && sqCenterX < door.x + door.width) {
        return door;
      }
    }
    return null;
  }

  enterDoor(sq, door) {
    sq.inDoor = door;
    sq.color = door.color;
    door.squares.push(sq);

    // Stack square above the door
    const idx = door.squares.length - 1;
    const stackX = door.x + (door.width - sq.size) / 2;
    const stackY = door.y - sq.size - (idx * (sq.size + 2));

    sq.x = stackX;
    sq.y = stackY;
    sq.vx = 0;
    sq.vy = 0;
    sq.grounded = true;

    this.selectNextSquare();
    this.updateAnswer();

    if (!this.activeSquare) {
      this.showMessage('All squares placed!', 'success');
    }
  }

  // ==================== RENDERING ====================

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sky gradient already in CSS

    // Draw ground
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, this.groundY, this.canvas.width, 30);
    ctx.fillStyle = '#a3e635';
    ctx.fillRect(0, this.groundY, this.canvas.width, 6);

    // Draw doors
    for (const door of this.doors) {
      const count = door.squares.length;
      const side = this.getSideFromCount(count);
      const isPerfectSquare = side > 0;

      // Door frame
      ctx.fillStyle = isPerfectSquare ? door.color + '33' : '#1f2937';
      ctx.fillRect(door.x, door.y, door.width, door.height);

      // Door opening
      ctx.fillStyle = '#000';
      ctx.fillRect(door.x + 5, door.y + 5, door.width - 10, door.height - 5);

      // Door frame border
      ctx.strokeStyle = isPerfectSquare ? door.color : '#4b5563';
      ctx.lineWidth = isPerfectSquare ? 4 : 2;
      ctx.strokeRect(door.x, door.y, door.width, door.height);

      // Count display above door
      ctx.fillStyle = isPerfectSquare ? door.color : '#9ca3af';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';

      // Show count and what it equals
      if (count === 0) {
        ctx.fillText('0', door.x + door.width / 2, door.y - 8);
      } else if (isPerfectSquare) {
        ctx.fillStyle = door.color;
        ctx.fillText(`${count} = ${side}×${side} ✓`, door.x + door.width / 2, door.y - 8);
      } else {
        ctx.fillText(`${count}`, door.x + door.width / 2, door.y - 8);
      }

      // Door label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText(door.label, door.x + door.width / 2, door.y + door.height - 15);
    }

    // Draw stacked squares on doors
    for (const door of this.doors) {
      for (const sq of door.squares) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(sq.x + 2, sq.y + 2, sq.size, sq.size);

        ctx.fillStyle = sq.color;
        ctx.fillRect(sq.x, sq.y, sq.size, sq.size);

        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;
        ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);
      }
    }

    // Draw active square
    if (this.activeSquare) {
      const sq = this.activeSquare;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(sq.x + 3, sq.y + 3, sq.size, sq.size);

      // Square body
      ctx.fillStyle = sq.color;
      ctx.fillRect(sq.x, sq.y, sq.size, sq.size);

      // Border
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);

      // Cute eyes
      const eyeY = sq.y + sq.size * 0.35;
      const eyeSize = 5;
      const lookDir = this.keys['KeyD'] || this.keys['ArrowRight'] ? 2 :
                      this.keys['KeyA'] || this.keys['ArrowLeft'] ? -2 : 0;

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(sq.x + sq.size * 0.33, eyeY, eyeSize, 0, Math.PI * 2);
      ctx.arc(sq.x + sq.size * 0.67, eyeY, eyeSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(sq.x + sq.size * 0.33 + lookDir, eyeY, 2.5, 0, Math.PI * 2);
      ctx.arc(sq.x + sq.size * 0.67 + lookDir, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Show hint when over a door
      const doorBelow = this.getDoorAt(sq);
      if (doorBelow && sq.grounded) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('↓ S to enter', sq.x + sq.size / 2, sq.y - 8);
      }
    }

    // Remaining squares in pile
    for (const sq of this.squares) {
      if (sq.inDoor === null && sq !== this.activeSquare) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(sq.x + 2, sq.y + 2, sq.size, sq.size);

        ctx.fillStyle = '#a5b4fc';
        ctx.fillRect(sq.x, sq.y, sq.size, sq.size);

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1;
        ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);
      }
    }

    // Instructions
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('A/D move | SPACE jump | S enter door', 8, 16);

    // Remaining count
    const remaining = this.squares.filter(s => s.inDoor === null).length;
    ctx.textAlign = 'right';
    ctx.fillText(`${remaining} remaining`, this.canvas.width - 8, 16);

    ctx.textAlign = 'left';
  }

  getSideFromCount(count) {
    if (count === 0) return 0;
    const sqrt = Math.sqrt(count);
    return Number.isInteger(sqrt) ? sqrt : 0;
  }

  // ==================== INPUT ====================

  onKeyDown(e) {
    this.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
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
    const completedDoors = [];

    for (const door of this.doors) {
      const count = door.squares.length;
      const side = this.getSideFromCount(count);
      if (side > 1) {
        coefficient *= side;
        grouped += count;
        completedDoors.push({ label: door.label, side, count });
      }
    }

    // Ungrouped = not in a complete perfect square door
    let ungrouped = 0;
    for (const door of this.doors) {
      const count = door.squares.length;
      const side = this.getSideFromCount(count);
      if (side <= 1 && count > 0) {
        ungrouped += count;
      }
    }
    // Plus remaining not in any door
    ungrouped += this.squares.filter(s => s.inDoor === null).length;

    const sqSize = 16;
    let visualHtml = '';
    let formulaHtml = '';
    let breakdownHtml = '';

    if (coefficient === 1 && ungrouped === this.totalSquares) {
      visualHtml = this.renderRadicalVisual(this.totalSquares, sqSize);
      formulaHtml = `√${this.totalSquares}`;
      breakdownHtml = 'Move squares into doors. Fill a door with 4 for 2×2, 9 for 3×3, etc.';
    } else if (ungrouped === 0 && coefficient > 1) {
      visualHtml = this.renderCoefficientVisual(coefficient, sqSize);
      formulaHtml = `${coefficient}`;
      breakdownHtml = `Perfect! ${completedDoors.map(d => `Door ${d.label}: ${d.side}×${d.side}`).join(', ')}`;
    } else if (coefficient === 1) {
      visualHtml = this.renderRadicalVisual(ungrouped, sqSize);
      formulaHtml = `√${ungrouped}`;
      breakdownHtml = `${ungrouped} squares not in complete groups yet.`;
    } else {
      visualHtml = this.renderCoefficientVisual(coefficient, sqSize) +
                   `<span class="text-xl mx-1">×</span>` +
                   this.renderRadicalVisual(ungrouped, sqSize);
      formulaHtml = `${coefficient}√${ungrouped}`;
      breakdownHtml = `${completedDoors.map(d => `${d.side}×${d.side}`).join(' × ')} = ${coefficient} | ${ungrouped} under √`;
    }

    this.answerVisual.innerHTML = visualHtml;
    this.answerFormula.innerHTML = formulaHtml;
    this.answerBreakdown.innerHTML = breakdownHtml;

    this.onAnswerChange({
      coefficient,
      radicand: ungrouped,
      groups: completedDoors.map(d => ({ side: d.side, count: d.count })),
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
    const cols = Math.min(count, 5);
    let squaresHtml = '';
    for (let i = 0; i < Math.min(count, 15); i++) {
      squaresHtml += `<div class="bg-indigo-500" style="width: ${sqSize - 2}px; height: ${sqSize - 2}px;"></div>`;
    }
    if (count > 15) {
      squaresHtml += `<div class="text-xs text-indigo-600">+${count - 15}</div>`;
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
    for (const door of this.doors) {
      const count = door.squares.length;
      const side = this.getSideFromCount(count);
      if (side > 1) {
        coefficient *= side;
        grouped += count;
      }
    }

    let ungrouped = 0;
    for (const door of this.doors) {
      const count = door.squares.length;
      const side = this.getSideFromCount(count);
      if (side <= 1 && count > 0) {
        ungrouped += count;
      }
    }
    ungrouped += this.squares.filter(s => s.inDoor === null).length;

    return { coefficient, radicand: ungrouped };
  }

  destroy() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    this.container.innerHTML = '';
  }
}

export default RadicalGame;

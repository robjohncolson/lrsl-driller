/**
 * Radical Visualizer - Interactive Square Root Learning Tool
 * Students arrange unit squares into perfect square groups to understand
 * that √n means finding the side of a square with area n
 */

export class RadicalVisualizer {
  constructor(container, config = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.config = {
      squareSize: 40, // Size of each unit square in pixels
      gridCols: 10,
      gridRows: 6,
      ...config
    };

    this.squares = []; // All unit squares
    this.groups = []; // Formed perfect square groups
    this.selectedSquares = new Set();
    this.draggedSquare = null;
    this.dragOffset = { x: 0, y: 0 };

    this.onAnswerChange = config.onAnswerChange || (() => {});

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    // Create main wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'radical-visualizer';
    this.wrapper.innerHTML = `
      <div class="flex flex-col gap-4">
        <!-- Instructions -->
        <div class="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <strong>Goal:</strong> Arrange unit squares into perfect square groups (2×2, 3×3, etc.)
          <br>Click squares to select, then click "Group" to form a perfect square.
        </div>

        <!-- Canvas area -->
        <div class="flex gap-4">
          <!-- Workspace grid -->
          <div class="flex-1">
            <div class="text-xs font-semibold text-gray-500 mb-1">WORKSPACE</div>
            <div class="workspace-container relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"
                 style="min-height: 280px;">
              <canvas class="workspace-canvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-3">
          <button class="group-btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            Group Selected
          </button>
          <button class="ungroup-btn bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            Ungroup
          </button>
          <button class="reset-btn bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm">
            Reset
          </button>
          <div class="flex-1"></div>
          <div class="selection-info text-sm text-gray-600"></div>
        </div>

        <!-- Answer display -->
        <div class="answer-display bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
          <div class="text-sm text-gray-600 mb-2">Your simplified form:</div>
          <div class="answer-text text-2xl font-bold text-purple-700">√<span class="radicand">?</span></div>
          <div class="answer-breakdown text-sm text-gray-500 mt-2"></div>
        </div>
      </div>
    `;
    this.container.appendChild(this.wrapper);

    // Get elements
    this.canvas = this.wrapper.querySelector('.workspace-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.workspaceContainer = this.wrapper.querySelector('.workspace-container');
    this.groupBtn = this.wrapper.querySelector('.group-btn');
    this.ungroupBtn = this.wrapper.querySelector('.ungroup-btn');
    this.resetBtn = this.wrapper.querySelector('.reset-btn');
    this.selectionInfo = this.wrapper.querySelector('.selection-info');
    this.answerText = this.wrapper.querySelector('.answer-text');
    this.answerBreakdown = this.wrapper.querySelector('.answer-breakdown');

    // Size canvas
    this.resizeCanvas();

    // Event listeners
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

    this.groupBtn.addEventListener('click', () => this.groupSelected());
    this.ungroupBtn.addEventListener('click', () => this.ungroupSelected());
    this.resetBtn.addEventListener('click', () => this.reset());

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.canvas.addEventListener('touchend', () => this.onMouseUp());

    this.updateButtons();
  }

  resizeCanvas() {
    const rect = this.workspaceContainer.getBoundingClientRect();
    this.canvas.width = rect.width || 400;
    this.canvas.height = 280;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '280px';
  }

  /**
   * Load a problem with N unit squares
   */
  loadProblem(totalSquares, config = {}) {
    this.totalSquares = totalSquares;
    this.problemConfig = config;
    this.reset();
  }

  reset() {
    this.squares = [];
    this.groups = [];
    this.selectedSquares.clear();
    this.draggedSquare = null;

    const size = this.config.squareSize;
    const cols = Math.ceil(Math.sqrt(this.totalSquares));
    const padding = 20;

    // Create unit squares in a grid arrangement
    for (let i = 0; i < this.totalSquares; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      this.squares.push({
        id: i,
        x: padding + col * (size + 4),
        y: padding + row * (size + 4),
        size: size,
        grouped: false,
        groupId: null,
        color: '#6366f1' // Indigo
      });
    }

    this.render();
    this.updateAnswer();
    this.updateButtons();
  }

  // ==================== MOUSE/TOUCH HANDLING ====================

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  findSquareAt(x, y) {
    // Check in reverse order (top squares first)
    for (let i = this.squares.length - 1; i >= 0; i--) {
      const sq = this.squares[i];
      if (x >= sq.x && x <= sq.x + sq.size && y >= sq.y && y <= sq.y + sq.size) {
        return sq;
      }
    }
    return null;
  }

  onMouseDown(e) {
    const pos = this.getCanvasPos(e);
    const sq = this.findSquareAt(pos.x, pos.y);

    if (sq) {
      if (e.shiftKey) {
        // Shift+click: toggle selection
        if (this.selectedSquares.has(sq.id)) {
          this.selectedSquares.delete(sq.id);
        } else {
          this.selectedSquares.add(sq.id);
        }
      } else if (this.selectedSquares.has(sq.id)) {
        // Clicked on already selected - start dragging all selected
        this.draggedSquare = sq;
        this.dragOffset = { x: pos.x - sq.x, y: pos.y - sq.y };
        this.isDraggingGroup = true;
      } else {
        // Click without shift: select only this one
        this.selectedSquares.clear();
        this.selectedSquares.add(sq.id);
        this.draggedSquare = sq;
        this.dragOffset = { x: pos.x - sq.x, y: pos.y - sq.y };
        this.isDraggingGroup = false;
      }
    } else {
      // Clicked empty space - clear selection
      this.selectedSquares.clear();
    }

    this.render();
    this.updateButtons();
  }

  onMouseMove(e) {
    if (!this.draggedSquare) return;

    const pos = this.getCanvasPos(e);
    const newX = pos.x - this.dragOffset.x;
    const newY = pos.y - this.dragOffset.y;

    if (this.isDraggingGroup && this.selectedSquares.size > 1) {
      // Move all selected squares
      const dx = newX - this.draggedSquare.x;
      const dy = newY - this.draggedSquare.y;

      for (const id of this.selectedSquares) {
        const sq = this.squares.find(s => s.id === id);
        if (sq) {
          sq.x += dx;
          sq.y += dy;
        }
      }
    } else {
      // Move just the dragged square
      this.draggedSquare.x = newX;
      this.draggedSquare.y = newY;
    }

    this.render();
  }

  onMouseUp(e) {
    if (this.draggedSquare) {
      // Snap to grid
      const gridSize = this.config.squareSize + 2;

      if (this.isDraggingGroup && this.selectedSquares.size > 1) {
        for (const id of this.selectedSquares) {
          const sq = this.squares.find(s => s.id === id);
          if (sq) {
            sq.x = Math.round(sq.x / gridSize) * gridSize;
            sq.y = Math.round(sq.y / gridSize) * gridSize;
          }
        }
      } else {
        this.draggedSquare.x = Math.round(this.draggedSquare.x / gridSize) * gridSize;
        this.draggedSquare.y = Math.round(this.draggedSquare.y / gridSize) * gridSize;
      }

      this.draggedSquare = null;
      this.isDraggingGroup = false;
      this.render();
    }
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, shiftKey: false });
  }

  onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  // ==================== GROUPING ====================

  groupSelected() {
    if (this.selectedSquares.size < 4) return;

    // Check if selection forms a perfect square
    const n = this.selectedSquares.size;
    const side = Math.sqrt(n);

    if (!Number.isInteger(side)) {
      this.showMessage('Selection must be a perfect square (4, 9, 16, 25...)', 'error');
      return;
    }

    // Check if squares are arranged in a grid
    const selectedList = Array.from(this.selectedSquares).map(id =>
      this.squares.find(s => s.id === id)
    );

    if (!this.isSquareArrangement(selectedList, side)) {
      this.showMessage('Arrange squares in a ' + side + '×' + side + ' grid first!', 'error');
      return;
    }

    // Create group
    const groupId = this.groups.length;
    const colors = ['#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
    const color = colors[groupId % colors.length];

    for (const sq of selectedList) {
      sq.grouped = true;
      sq.groupId = groupId;
      sq.color = color;
    }

    this.groups.push({
      id: groupId,
      side: side,
      squareIds: Array.from(this.selectedSquares),
      color: color
    });

    this.selectedSquares.clear();
    this.render();
    this.updateAnswer();
    this.updateButtons();
    this.showMessage(`Grouped ${n} squares as ${side}×${side}!`, 'success');
  }

  isSquareArrangement(squares, side) {
    if (squares.length !== side * side) return false;

    // Get bounding box
    const xs = squares.map(s => s.x);
    const ys = squares.map(s => s.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);

    // Check each expected position
    const gridSize = this.config.squareSize + 2;
    const tolerance = 10;

    for (let row = 0; row < side; row++) {
      for (let col = 0; col < side; col++) {
        const expectedX = minX + col * gridSize;
        const expectedY = minY + row * gridSize;

        const found = squares.some(s =>
          Math.abs(s.x - expectedX) < tolerance &&
          Math.abs(s.y - expectedY) < tolerance
        );

        if (!found) return false;
      }
    }

    return true;
  }

  ungroupSelected() {
    // Find groups that have selected squares
    const groupsToRemove = new Set();

    for (const id of this.selectedSquares) {
      const sq = this.squares.find(s => s.id === id);
      if (sq && sq.grouped) {
        groupsToRemove.add(sq.groupId);
      }
    }

    // Ungroup all squares in those groups
    for (const groupId of groupsToRemove) {
      for (const sq of this.squares) {
        if (sq.groupId === groupId) {
          sq.grouped = false;
          sq.groupId = null;
          sq.color = '#6366f1';
        }
      }
    }

    // Remove the groups
    this.groups = this.groups.filter(g => !groupsToRemove.has(g.id));

    this.selectedSquares.clear();
    this.render();
    this.updateAnswer();
    this.updateButtons();
  }

  // ==================== RENDERING ====================

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    const gridSize = this.config.squareSize + 2;

    for (let x = 0; x < this.canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }

    // Draw squares
    for (const sq of this.squares) {
      const isSelected = this.selectedSquares.has(sq.id);

      // Shadow for depth
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(sq.x + 2, sq.y + 2, sq.size, sq.size);

      // Square fill
      ctx.fillStyle = sq.color;
      ctx.fillRect(sq.x, sq.y, sq.size, sq.size);

      // Border
      ctx.strokeStyle = isSelected ? '#fbbf24' : '#374151';
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeRect(sq.x, sq.y, sq.size, sq.size);

      // Selection highlight
      if (isSelected) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fillRect(sq.x, sq.y, sq.size, sq.size);
      }
    }

    // Draw group labels
    for (const group of this.groups) {
      const groupSquares = this.squares.filter(s => s.groupId === group.id);
      if (groupSquares.length === 0) continue;

      const minX = Math.min(...groupSquares.map(s => s.x));
      const minY = Math.min(...groupSquares.map(s => s.y));
      const maxX = Math.max(...groupSquares.map(s => s.x + s.size));
      const maxY = Math.max(...groupSquares.map(s => s.y + s.size));

      // Draw group border
      ctx.strokeStyle = group.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(minX - 2, minY - 2, maxX - minX + 4, maxY - minY + 4);
      ctx.setLineDash([]);

      // Draw side label
      ctx.fillStyle = '#fff';
      ctx.fillRect(minX - 5, minY - 20, 30, 18);
      ctx.fillStyle = group.color;
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(`${group.side}×${group.side}`, minX, minY - 6);
    }
  }

  // ==================== ANSWER CALCULATION ====================

  updateAnswer() {
    const grouped = this.groups.reduce((sum, g) => sum + g.squareIds.length, 0);
    const ungrouped = this.totalSquares - grouped;

    // Calculate coefficient (product of group sides)
    let coefficient = 1;
    for (const group of this.groups) {
      coefficient *= group.side;
    }

    // Build answer display
    let answerHtml = '';
    let breakdownHtml = '';

    if (this.groups.length === 0) {
      answerHtml = `√${this.totalSquares}`;
      breakdownHtml = `No groups yet. Select squares and click "Group" to form perfect squares.`;
    } else if (ungrouped === 0 && coefficient > 1) {
      // Perfect simplification with no remainder
      answerHtml = `${coefficient}`;
      breakdownHtml = `${this.groups.map(g => `${g.side}×${g.side}`).join(' + ')} = ${coefficient}² = ${coefficient * coefficient} ✓`;
    } else if (ungrouped === 0) {
      answerHtml = `${coefficient}`;
      breakdownHtml = `Perfect square! √${this.totalSquares} = ${coefficient}`;
    } else if (coefficient === 1) {
      answerHtml = `√${ungrouped}`;
      breakdownHtml = `${ungrouped} squares remaining under radical`;
    } else {
      answerHtml = `${coefficient}√${ungrouped}`;
      breakdownHtml = `Groups: ${this.groups.map(g => g.side).join(' × ')} = ${coefficient} outside | ${ungrouped} under radical`;
    }

    this.answerText.innerHTML = answerHtml;
    this.answerBreakdown.innerHTML = breakdownHtml;

    // Notify parent
    this.onAnswerChange({
      coefficient,
      radicand: ungrouped,
      groups: this.groups.map(g => ({ side: g.side, count: g.squareIds.length })),
      simplified: ungrouped === 0 || (coefficient > 1 && ungrouped < this.totalSquares)
    });
  }

  updateButtons() {
    const selectedCount = this.selectedSquares.size;
    const hasGroupedSelected = Array.from(this.selectedSquares).some(id => {
      const sq = this.squares.find(s => s.id === id);
      return sq && sq.grouped;
    });

    // Can group if selected count is a perfect square >= 4
    const canGroup = selectedCount >= 4 && Number.isInteger(Math.sqrt(selectedCount));
    this.groupBtn.disabled = !canGroup;
    this.ungroupBtn.disabled = !hasGroupedSelected;

    // Selection info
    if (selectedCount === 0) {
      this.selectionInfo.textContent = 'Click squares to select';
    } else if (canGroup) {
      const side = Math.sqrt(selectedCount);
      this.selectionInfo.textContent = `${selectedCount} selected (${side}×${side}) - Ready to group!`;
      this.selectionInfo.className = 'selection-info text-sm text-green-600 font-semibold';
    } else {
      const nextPerfect = this.nextPerfectSquare(selectedCount);
      this.selectionInfo.textContent = `${selectedCount} selected (need ${nextPerfect} for ${Math.sqrt(nextPerfect)}×${Math.sqrt(nextPerfect)})`;
      this.selectionInfo.className = 'selection-info text-sm text-orange-600';
    }
  }

  nextPerfectSquare(n) {
    const sqrt = Math.ceil(Math.sqrt(n));
    return sqrt * sqrt;
  }

  showMessage(text, type = 'info') {
    // Simple toast message
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
    const grouped = this.groups.reduce((sum, g) => sum + g.squareIds.length, 0);
    const ungrouped = this.totalSquares - grouped;
    let coefficient = 1;
    for (const group of this.groups) {
      coefficient *= group.side;
    }
    return { coefficient, radicand: ungrouped };
  }

  isFullySimplified() {
    // Check if the remaining radicand has no perfect square factors > 1
    const { radicand } = this.getAnswer();
    if (radicand === 0) return true;

    for (let i = 2; i * i <= radicand; i++) {
      if (radicand % (i * i) === 0) return false;
    }
    return true;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export default RadicalVisualizer;

/**
 * Roster Modal - Teacher class roster management
 * Allows teachers to organize students by class periods (A-G) and map usernames to real names
 */

export class RosterModal {
  constructor(config = {}) {
    this.serverUrl = config.serverUrl || null;
    this.teacherPassword = config.teacherPassword || null;
    this.isOpen = false;
    this.students = [];
    this.filteredStudents = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.pendingChanges = new Map(); // username -> { real_name?, class_period? }

    this.modal = null;
    this.backdrop = null;
  }

  /**
   * Set teacher password for API calls
   */
  setTeacherPassword(password) {
    this.teacherPassword = password;
  }

  /**
   * Create the modal DOM element
   */
  createModal() {
    // Backdrop
    this.backdrop = document.createElement('div');
    this.backdrop.id = 'roster-modal-backdrop';
    this.backdrop.className = 'fixed inset-0 bg-black/50 z-50 hidden';
    this.backdrop.addEventListener('click', () => this.close());

    // Modal
    this.modal = document.createElement('div');
    this.modal.id = 'roster-modal';
    this.modal.className = 'fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl z-50 hidden flex flex-col overflow-hidden';
    this.modal.innerHTML = `
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold flex items-center gap-2">
              <span>Class Roster Management</span>
            </h2>
            <p class="text-sm text-purple-200">Organize students by class period</p>
          </div>
          <button id="roster-close-btn" class="p-2 hover:bg-white/20 rounded-full transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="px-6 py-3 bg-gray-50 border-b flex flex-wrap items-center gap-3 flex-shrink-0">
        <!-- Period Tabs -->
        <div class="flex items-center gap-1 bg-white rounded-lg border p-1">
          <button data-period="all" class="roster-period-tab px-3 py-1 text-sm rounded font-medium bg-purple-600 text-white">All</button>
          <button data-period="A" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">A</button>
          <button data-period="B" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">B</button>
          <button data-period="C" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">C</button>
          <button data-period="D" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">D</button>
          <button data-period="E" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">E</button>
          <button data-period="F" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">F</button>
          <button data-period="G" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">G</button>
          <button data-period="unassigned" class="roster-period-tab px-3 py-1 text-sm rounded font-medium text-gray-600 hover:bg-gray-100">?</button>
        </div>

        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <input type="text" id="roster-search" placeholder="Search by username or name..."
            class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
        </div>

        <!-- Refresh -->
        <button id="roster-refresh-btn" class="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Refresh">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>

      <!-- Table Container -->
      <div class="flex-1 overflow-auto px-6 py-4">
        <table class="w-full">
          <thead class="sticky top-0 bg-white">
            <tr class="border-b text-left text-sm text-gray-500">
              <th class="py-2 px-2 font-medium">Username</th>
              <th class="py-2 px-2 font-medium">Real Name</th>
              <th class="py-2 px-2 font-medium w-24">Period</th>
              <th class="py-2 px-2 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody id="roster-table-body">
            <!-- Rows populated dynamically -->
          </tbody>
        </table>

        <!-- Empty State -->
        <div id="roster-empty" class="hidden text-center py-12 text-gray-500">
          <div class="text-4xl mb-3">👥</div>
          <p class="font-medium">No students found</p>
          <p class="text-sm">Try adjusting your filters or search</p>
        </div>

        <!-- Loading State -->
        <div id="roster-loading" class="hidden text-center py-12 text-gray-500">
          <div class="text-4xl mb-3 animate-pulse">📋</div>
          <p class="font-medium">Loading roster...</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 bg-gray-50 border-t flex items-center justify-between flex-shrink-0">
        <div id="roster-stats" class="text-sm text-gray-600">
          <!-- Stats populated dynamically -->
        </div>
        <div class="flex items-center gap-2">
          <button id="roster-save-all-btn" class="hidden px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
            Save All Changes
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdrop);
    document.body.appendChild(this.modal);

    // Wire up events
    this.modal.querySelector('#roster-close-btn').addEventListener('click', () => this.close());

    // Period tabs
    this.modal.querySelectorAll('.roster-period-tab').forEach(tab => {
      tab.addEventListener('click', () => this.setFilter(tab.dataset.period));
    });

    // Search
    const searchInput = this.modal.querySelector('#roster-search');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.applyFilters();
    });

    // Refresh
    this.modal.querySelector('#roster-refresh-btn').addEventListener('click', () => this.refresh());

    // Save all
    this.modal.querySelector('#roster-save-all-btn').addEventListener('click', () => this.saveAllChanges());

    // ESC to close
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._escHandler);
  }

  /**
   * Open the modal
   */
  async open() {
    if (!this.modal) {
      this.createModal();
    }

    this.isOpen = true;
    this.backdrop.classList.remove('hidden');
    this.modal.classList.remove('hidden');

    await this.refresh();
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.modal) return;

    // Check for unsaved changes
    if (this.pendingChanges.size > 0) {
      if (!confirm('You have unsaved changes. Close anyway?')) {
        return;
      }
      this.pendingChanges.clear();
    }

    this.isOpen = false;
    this.backdrop.classList.add('hidden');
    this.modal.classList.add('hidden');
  }

  /**
   * Set period filter
   */
  setFilter(period) {
    this.currentFilter = period;

    // Update tab styling
    this.modal.querySelectorAll('.roster-period-tab').forEach(tab => {
      if (tab.dataset.period === period) {
        tab.classList.add('bg-purple-600', 'text-white');
        tab.classList.remove('text-gray-600', 'hover:bg-gray-100');
      } else {
        tab.classList.remove('bg-purple-600', 'text-white');
        tab.classList.add('text-gray-600', 'hover:bg-gray-100');
      }
    });

    this.applyFilters();
  }

  /**
   * Apply current filters and search
   */
  applyFilters() {
    this.filteredStudents = this.students.filter(s => {
      // Period filter
      if (this.currentFilter !== 'all') {
        if (this.currentFilter === 'unassigned') {
          if (s.class_period !== null) return false;
        } else {
          if (s.class_period !== this.currentFilter) return false;
        }
      }

      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery;
        const matchesUsername = s.username.toLowerCase().includes(query);
        const matchesName = s.real_name && s.real_name.toLowerCase().includes(query);
        if (!matchesUsername && !matchesName) return false;
      }

      return true;
    });

    this.renderTable();
    this.updateStats();
  }

  /**
   * Fetch roster from server
   */
  async fetchRoster() {
    if (!this.serverUrl || !this.teacherPassword) {
      return [];
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/roster`, {
        headers: {
          'x-teacher-password': this.teacherPassword
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roster');
      }

      return await response.json();
    } catch (err) {
      console.error('Failed to fetch roster:', err);
      return [];
    }
  }

  /**
   * Refresh roster data
   */
  async refresh() {
    this.showLoading(true);
    this.students = await this.fetchRoster();
    this.pendingChanges.clear();
    this.updateSaveAllButton();
    this.applyFilters();
    this.showLoading(false);
  }

  /**
   * Render the table
   */
  renderTable() {
    const tbody = this.modal.querySelector('#roster-table-body');
    const emptyState = this.modal.querySelector('#roster-empty');

    if (this.filteredStudents.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    tbody.innerHTML = this.filteredStudents.map(student => {
      const pending = this.pendingChanges.get(student.username);
      const currentName = pending?.real_name !== undefined ? pending.real_name : (student.real_name || '');
      const currentPeriod = pending?.class_period !== undefined ? pending.class_period : student.class_period;
      const hasPending = !!pending;
      const missingName = !currentName;

      return `
        <tr class="border-b hover:bg-gray-50 ${hasPending ? 'bg-yellow-50' : ''} ${missingName ? 'bg-amber-50' : ''}" data-username="${student.username}">
          <td class="py-2 px-2">
            <div class="font-medium text-gray-800">${student.username}</div>
            <div class="text-xs text-gray-400">${this.formatDate(student.created_at)}</div>
          </td>
          <td class="py-2 px-2">
            <input type="text"
              class="roster-name-input w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${missingName ? 'border-amber-400' : 'border-gray-200'}"
              value="${this.escapeHtml(currentName)}"
              placeholder="Enter real name..."
              data-username="${student.username}"
              data-field="real_name">
          </td>
          <td class="py-2 px-2">
            <select class="roster-period-select w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-200"
              data-username="${student.username}"
              data-field="class_period">
              <option value="" ${currentPeriod === null ? 'selected' : ''}>--</option>
              <option value="A" ${currentPeriod === 'A' ? 'selected' : ''}>A</option>
              <option value="B" ${currentPeriod === 'B' ? 'selected' : ''}>B</option>
              <option value="C" ${currentPeriod === 'C' ? 'selected' : ''}>C</option>
              <option value="D" ${currentPeriod === 'D' ? 'selected' : ''}>D</option>
              <option value="E" ${currentPeriod === 'E' ? 'selected' : ''}>E</option>
              <option value="F" ${currentPeriod === 'F' ? 'selected' : ''}>F</option>
              <option value="G" ${currentPeriod === 'G' ? 'selected' : ''}>G</option>
            </select>
          </td>
          <td class="py-2 px-2">
            <button class="roster-save-row-btn px-2 py-1 text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-colors ${hasPending ? '' : 'opacity-50'}"
              data-username="${student.username}"
              ${hasPending ? '' : 'disabled'}>
              Save
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Wire up input events
    tbody.querySelectorAll('.roster-name-input').forEach(input => {
      input.addEventListener('input', (e) => this.handleFieldChange(e.target.dataset.username, 'real_name', e.target.value));
    });

    tbody.querySelectorAll('.roster-period-select').forEach(select => {
      select.addEventListener('change', (e) => this.handleFieldChange(e.target.dataset.username, 'class_period', e.target.value || null));
    });

    tbody.querySelectorAll('.roster-save-row-btn').forEach(btn => {
      btn.addEventListener('click', () => this.saveRow(btn.dataset.username));
    });
  }

  /**
   * Handle field change
   */
  handleFieldChange(username, field, value) {
    const student = this.students.find(s => s.username === username);
    if (!student) return;

    const originalValue = field === 'real_name' ? (student.real_name || '') : student.class_period;
    const isChanged = value !== originalValue;

    if (!this.pendingChanges.has(username)) {
      this.pendingChanges.set(username, {});
    }

    const pending = this.pendingChanges.get(username);

    if (isChanged) {
      pending[field] = value;
    } else {
      delete pending[field];
    }

    // Clean up empty pending objects
    if (Object.keys(pending).length === 0) {
      this.pendingChanges.delete(username);
    }

    // Update row styling
    const row = this.modal.querySelector(`tr[data-username="${username}"]`);
    if (row) {
      const hasPending = this.pendingChanges.has(username);
      row.classList.toggle('bg-yellow-50', hasPending);

      const saveBtn = row.querySelector('.roster-save-row-btn');
      if (saveBtn) {
        saveBtn.disabled = !hasPending;
        saveBtn.classList.toggle('opacity-50', !hasPending);
      }
    }

    this.updateSaveAllButton();
  }

  /**
   * Save a single row
   */
  async saveRow(username) {
    const pending = this.pendingChanges.get(username);
    if (!pending) return;

    try {
      const response = await fetch(`${this.serverUrl}/api/roster/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-password': this.teacherPassword
        },
        body: JSON.stringify(pending)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save');
      }

      const updated = await response.json();

      // Update local data
      const student = this.students.find(s => s.username === username);
      if (student) {
        Object.assign(student, updated);
      }

      // Clear pending
      this.pendingChanges.delete(username);

      // Re-render
      this.applyFilters();
      this.updateStats();

      // Show success briefly
      this.showToast(`Saved ${username}`);
    } catch (err) {
      console.error('Failed to save row:', err);
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  /**
   * Save all pending changes
   */
  async saveAllChanges() {
    if (this.pendingChanges.size === 0) return;

    const assignments = [];
    for (const [username, changes] of this.pendingChanges) {
      assignments.push({ username, ...changes });
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/roster/bulk-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-password': this.teacherPassword
        },
        body: JSON.stringify({ assignments })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save');
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        console.warn('Some updates failed:', result.errors);
        this.showToast(`Saved ${result.updated}, ${result.errors.length} failed`, 'warning');
      } else {
        this.showToast(`Saved ${result.updated} students`);
      }

      // Refresh to get latest data
      await this.refresh();
    } catch (err) {
      console.error('Failed to save all:', err);
      this.showToast(`Error: ${err.message}`, 'error');
    }
  }

  /**
   * Update stats display
   */
  updateStats() {
    const stats = this.modal.querySelector('#roster-stats');

    // Count by period
    const periodCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, unassigned: 0 };
    for (const s of this.students) {
      if (s.class_period) {
        periodCounts[s.class_period] = (periodCounts[s.class_period] || 0) + 1;
      } else {
        periodCounts.unassigned++;
      }
    }

    const total = this.students.length;
    const showing = this.filteredStudents.length;

    let html = `<span class="font-medium">${showing}</span> of ${total} students`;

    if (periodCounts.unassigned > 0) {
      html += ` <span class="text-amber-600 ml-2">&#9888; ${periodCounts.unassigned} unassigned</span>`;
    }

    stats.innerHTML = html;
  }

  /**
   * Update save all button visibility
   */
  updateSaveAllButton() {
    const btn = this.modal.querySelector('#roster-save-all-btn');
    if (this.pendingChanges.size > 0) {
      btn.classList.remove('hidden');
      btn.textContent = `Save All Changes (${this.pendingChanges.size})`;
    } else {
      btn.classList.add('hidden');
    }
  }

  /**
   * Show/hide loading state
   */
  showLoading(show) {
    const loading = this.modal.querySelector('#roster-loading');
    const tbody = this.modal.querySelector('#roster-table-body');

    if (show) {
      loading.classList.remove('hidden');
      tbody.innerHTML = '';
    } else {
      loading.classList.add('hidden');
    }
  }

  /**
   * Show a toast notification
   */
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-600' : type === 'warning' ? 'bg-amber-600' : 'bg-green-600';
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-[60] transition-opacity`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  /**
   * Format date for display
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Escape HTML for safe rendering
   */
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

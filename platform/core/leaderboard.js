/**
 * Leaderboard Module - Rankings and display
 */

import { getAvatarForUsername } from './user-system.js';

export class Leaderboard {
  constructor(config = {}) {
    this.serverUrl = config.serverUrl || null;
    this.currentPeriod = 'all';
    this.isOpen = false;
    this.currentUsername = null;

    // DOM elements (set via setElements)
    this.panel = null;
    this.backdrop = null;
    this.list = null;
    this.loading = null;
    this.empty = null;
    this.offline = null;

    // Callbacks
    this.onOpen = config.onOpen || (() => {});
    this.onClose = config.onClose || (() => {});
  }

  /**
   * Set DOM element references
   */
  setElements(elements) {
    this.panel = elements.panel;
    this.backdrop = elements.backdrop;
    this.list = elements.list;
    this.loading = elements.loading;
    this.empty = elements.empty;
    this.offline = elements.offline;
  }

  /**
   * Set current user for highlighting
   */
  setCurrentUser(username) {
    this.currentUsername = username;
  }

  /**
   * Open leaderboard panel
   */
  open() {
    if (!this.panel) return;

    this.isOpen = true;
    this.panel.classList.remove('translate-x-full');
    if (this.backdrop) {
      this.backdrop.classList.remove('hidden');
    }
    this.refresh();
    this.onOpen();
  }

  /**
   * Close leaderboard panel
   */
  close() {
    if (!this.panel) return;

    this.isOpen = false;
    this.panel.classList.add('translate-x-full');
    if (this.backdrop) {
      this.backdrop.classList.add('hidden');
    }
    this.onClose();
  }

  /**
   * Toggle open/closed
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Set period filter
   */
  setPeriod(period) {
    this.currentPeriod = period;
    if (this.isOpen) {
      this.refresh();
    }
  }

  /**
   * Fetch leaderboard data from server
   */
  async fetchData(period = 'all', limit = 20) {
    if (!this.serverUrl) return null;

    try {
      const response = await fetch(`${this.serverUrl}/api/leaderboard?period=${period}&limit=${limit}`);
      return await response.json();
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
      return null;
    }
  }

  /**
   * Refresh leaderboard data
   */
  async refresh() {
    if (!this.list) return;

    // Show loading
    this.showState('loading');

    // Check if server is configured
    if (!this.serverUrl) {
      this.showState('offline');
      return;
    }

    try {
      const data = await this.fetchData(this.currentPeriod, 20);

      if (!data || data.length === 0) {
        this.showState('empty');
        return;
      }

      this.renderList(data);
      this.showState('list');
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      this.showState('offline');
    }
  }

  /**
   * Show specific state
   */
  showState(state) {
    if (this.loading) this.loading.classList.toggle('hidden', state !== 'loading');
    if (this.list) this.list.classList.toggle('hidden', state !== 'list');
    if (this.empty) this.empty.classList.toggle('hidden', state !== 'empty');
    if (this.offline) this.offline.classList.toggle('hidden', state !== 'offline');
  }

  /**
   * Render leaderboard list
   */
  renderList(data) {
    if (!this.list) return;

    this.list.innerHTML = '';

    data.forEach((entry, index) => {
      const rank = index + 1;
      const isCurrentUser = entry.username === this.currentUsername;
      const avatar = getAvatarForUsername(entry.username);

      const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
      const rankClass = rank <= 3 ? 'text-2xl' : 'text-lg font-bold text-gray-400';

      const el = document.createElement('div');
      el.className = `p-4 rounded-xl ${isCurrentUser ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50'} ${rank <= 3 ? 'shadow-md' : ''} opacity-0 transform translate-y-4 transition-all duration-300`;

      el.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="${rankClass} w-10 text-center">${rankIcon}</div>
          <div class="text-2xl">${avatar}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-800 truncate">${entry.username}</span>
              ${isCurrentUser ? '<span class="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">YOU</span>' : ''}
            </div>
            ${entry.real_name ? `<div class="text-xs text-gray-500">${entry.real_name}</div>` : ''}
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-yellow-600">${entry.weighted_score || 0} pts</div>
            <div class="text-xs text-gray-500 flex gap-1 justify-end">
              ${entry.gold > 0 ? `<span>⭐${entry.gold}</span>` : ''}
              ${entry.silver > 0 ? `<span>🥈${entry.silver}</span>` : ''}
              ${entry.bronze > 0 ? `<span>🥉${entry.bronze}</span>` : ''}
              ${entry.tin > 0 ? `<span>○${entry.tin}</span>` : ''}
            </div>
          </div>
        </div>
      `;

      this.list.appendChild(el);

      // Staggered animation
      setTimeout(() => {
        el.classList.remove('opacity-0', 'translate-y-4');
        el.classList.add('opacity-100', 'translate-y-0');
      }, index * 50);
    });
  }

  /**
   * Create leaderboard panel HTML
   */
  static createPanelHTML() {
    return `
      <div id="leaderboard-panel" class="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out">
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🏆</span>
              <h2 class="text-xl font-bold text-white">Class Leaderboard</h2>
            </div>
            <button id="close-leaderboard" class="p-2 hover:bg-white/20 rounded-full transition-colors">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Period Filter -->
          <div class="px-6 py-3 bg-gray-50 border-b flex gap-2">
            <button data-period="today" class="leaderboard-period-btn px-3 py-1 text-sm rounded-full bg-white border border-gray-200 text-gray-600 hover:border-yellow-400">Today</button>
            <button data-period="week" class="leaderboard-period-btn px-3 py-1 text-sm rounded-full bg-white border border-gray-200 text-gray-600 hover:border-yellow-400">This Week</button>
            <button data-period="all" class="leaderboard-period-btn px-3 py-1 text-sm rounded-full bg-yellow-400 text-white border border-yellow-400">All Time</button>
          </div>

          <!-- Content -->
          <div id="leaderboard-content" class="flex-1 overflow-y-auto p-4">
            <div id="leaderboard-loading" class="flex items-center justify-center h-32">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
            <div id="leaderboard-list" class="space-y-3 hidden"></div>
            <div id="leaderboard-empty" class="text-center text-gray-500 py-8 hidden">
              <span class="text-4xl block mb-2">📊</span>
              <p>No data yet. Be the first to earn a star!</p>
            </div>
            <div id="leaderboard-offline" class="text-center text-gray-500 py-8 hidden">
              <span class="text-4xl block mb-2">📡</span>
              <p>Connect to the server to see the leaderboard.</p>
            </div>
          </div>

          <!-- Legend -->
          <div class="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
            <div class="flex items-center gap-4 justify-center">
              <span title="Gold (4 pts)">⭐ = 4pts</span>
              <span title="Silver (3 pts)">🥈 = 3pts</span>
              <span title="Bronze (2 pts)">🥉 = 2pts</span>
              <span title="Tin (1 pt)">○ = 1pt</span>
            </div>
          </div>
        </div>
      </div>
      <div id="leaderboard-backdrop" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden"></div>
    `;
  }
}

// Factory function
export function createLeaderboard(config) {
  return new Leaderboard(config);
}

export default Leaderboard;

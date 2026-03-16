const TIME_PERIOD_ACTIVE_CLASS = 'time-period-btn px-3 py-1 text-sm rounded-full bg-green-600 text-white';
const TIME_PERIOD_INACTIVE_CLASS = 'time-period-btn px-3 py-1 text-sm rounded-full bg-white border border-gray-200 text-gray-600 hover:border-green-400';

export class TimeAnalyticsPanel {
  constructor(config = {}) {
    this.getServerUrl = config.getServerUrl || (() => null);
    this.getTeacherPassword = config.getTeacherPassword || (() => null);
    this.getAvatarForUsername = config.getAvatarForUsername || (() => '?');
    this.fetchFn = config.fetchFn || globalThis.fetch?.bind(globalThis);
    this.documentLike = config.documentLike || globalThis.document || null;
    this.state = {
      currentTimePeriod: 'today'
    };
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  querySelectorAll(selector) {
    return this.documentLike?.querySelectorAll?.(selector) || [];
  }

  openPanel() {
    this.getElement('time-analytics-panel')?.classList.remove('translate-x-full');
    this.getElement('time-analytics-backdrop')?.classList.remove('hidden');
    return this.loadTimeAnalytics();
  }

  closePanel() {
    this.getElement('time-analytics-panel')?.classList.add('translate-x-full');
    this.getElement('time-analytics-backdrop')?.classList.add('hidden');
  }

  formatTimeDisplay(ms) {
    if (!ms || ms < 1000) return '0m';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  }

  renderTimeAnalyticsList(students) {
    const list = this.getElement('time-analytics-list');
    if (!list) return;

    const maxTime = Math.max(...students.map((student) => student.totalActiveMs), 1);

    list.innerHTML = students.map((student, index) => {
      const timePercent = (student.totalActiveMs / maxTime) * 100;
      const avatar = this.getAvatarForUsername(student.username);
      const lastActive = student.lastActive ? new Date(student.lastActive).toLocaleString() : 'N/A';

      return `
        <div class="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? 'bg-green-100' : 'bg-gray-100'} text-lg">
              ${index < 3 ? ['🥇', '🥈', '🥉'][index] : avatar}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-800 truncate">${student.username}</span>
                <span class="font-bold text-green-700">${this.formatTimeDisplay(student.totalActiveMs)}</span>
              </div>
              <div class="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-green-400 to-teal-500 rounded-full transition-all duration-500" style="width: ${timePercent}%"></div>
              </div>
              <div class="flex justify-between mt-1 text-xs text-gray-500">
                <span>${student.sessionCount || 0} sessions</span>
                <span>${student.problemsCompleted || 0}/${student.problemsAttempted || 0} problems</span>
                <span>Last: ${lastActive}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async loadTimeAnalytics() {
    const loading = this.getElement('time-analytics-loading');
    const list = this.getElement('time-analytics-list');
    const empty = this.getElement('time-analytics-empty');

    loading?.classList.remove('hidden');
    list?.classList.add('hidden');
    empty?.classList.add('hidden');

    try {
      const response = await this.fetchFn(`${this.getServerUrl()}/api/time-tracking/class-summary?period=${this.state.currentTimePeriod}`, {
        headers: { 'x-teacher-password': this.getTeacherPassword() || 'stats123' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch time data');
      }

      const data = await response.json();
      loading?.classList.add('hidden');

      this.getElement('total-class-time').textContent = this.formatTimeDisplay(data.totalClassTime);
      this.getElement('total-students-active').textContent = data.students?.length || 0;
      const averageTime = data.students?.length > 0 ? data.totalClassTime / data.students.length : 0;
      this.getElement('avg-time-per-student').textContent = this.formatTimeDisplay(averageTime);

      if (!data.students || data.students.length === 0) {
        empty?.classList.remove('hidden');
      } else {
        list?.classList.remove('hidden');
        this.renderTimeAnalyticsList(data.students);
      }
    } catch (err) {
      console.error('Failed to load time analytics:', err);
      loading?.classList.add('hidden');
      empty?.classList.remove('hidden');
      const emptyText = empty?.querySelector?.('p');
      if (emptyText) {
        emptyText.textContent = 'Failed to load time data.';
      }
    }
  }

  setPeriod(period) {
    this.state.currentTimePeriod = period;

    this.querySelectorAll('.time-period-btn').forEach((button) => {
      button.className = button.dataset.period === period
        ? TIME_PERIOD_ACTIVE_CLASS
        : TIME_PERIOD_INACTIVE_CLASS;
    });

    return this.loadTimeAnalytics();
  }
}

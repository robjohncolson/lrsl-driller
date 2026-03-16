const REVIEW_FILTER_ACTIVE_CLASS = 'review-filter-btn px-3 py-1 text-sm rounded-full bg-purple-600 text-white';
const REVIEW_FILTER_INACTIVE_CLASS = 'review-filter-btn px-3 py-1 text-sm rounded-full bg-white border border-gray-200 text-gray-600';

export class TeacherReviewPanel {
  constructor(config = {}) {
    this.getServerUrl = config.getServerUrl || (() => null);
    this.getTeacherPassword = config.getTeacherPassword || (() => null);
    this.isTeacherModeActive = config.isTeacherModeActive || (() => false);
    this.getWebRTCManager = config.getWebRTCManager || (() => null);
    this.celebration = config.celebration || null;
    this.playTeacherAlert = config.playTeacherAlert || (() => {});
    this.onLoadReviewProblem = config.onLoadReviewProblem || (async () => {});
    this.fetchFn = config.fetchFn || globalThis.fetch?.bind(globalThis);
    this.documentLike = config.documentLike || globalThis.document || null;
    this.windowLike = config.windowLike || globalThis.window || globalThis;
    this.state = {
      currentReviewFilter: 'pending',
      pendingReviewsCache: [],
      teacherAlertActive: false,
      pendingGrades: {},
      activeReviewId: null
    };
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  querySelector(selector) {
    return this.documentLike?.querySelector?.(selector) || null;
  }

  updateFilterButtons() {
    const pendingButton = this.getElement('review-filter-pending');
    const reviewedButton = this.getElement('review-filter-reviewed');

    if (!pendingButton || !reviewedButton) return;

    const pendingActive = this.state.currentReviewFilter === 'pending';
    pendingButton.className = pendingActive ? REVIEW_FILTER_ACTIVE_CLASS : REVIEW_FILTER_INACTIVE_CLASS;
    reviewedButton.className = pendingActive ? REVIEW_FILTER_INACTIVE_CLASS : REVIEW_FILTER_ACTIVE_CLASS;
  }

  setFilter(filter) {
    this.state.currentReviewFilter = filter;
    this.updateFilterButtons();
    return this.loadPendingReviews();
  }

  openPanel() {
    this.getElement('teacher-review-panel')?.classList.remove('translate-x-full');
    this.getElement('teacher-review-backdrop')?.classList.remove('hidden');
    return this.loadPendingReviews();
  }

  closePanel() {
    this.getElement('teacher-review-panel')?.classList.add('translate-x-full');
    this.getElement('teacher-review-backdrop')?.classList.add('hidden');
  }

  clearReviewState() {
    this.state.pendingReviewsCache = [];
    this.state.teacherAlertActive = false;
    this.state.pendingGrades = {};
    this.state.activeReviewId = null;
  }

  updateReviewBadge(count) {
    const headerBadge = this.getElement('header-review-count');
    const panelBadge = this.getElement('review-count-badge');
    const alertCount = this.getElement('alert-review-count');

    if (!headerBadge || !panelBadge) return;

    if (count > 0) {
      headerBadge.textContent = count;
      headerBadge.style.display = 'inline';
      panelBadge.textContent = count;
      panelBadge.classList.remove('hidden');
      if (alertCount) {
        alertCount.textContent = count;
      }
    } else {
      headerBadge.style.display = 'none';
      panelBadge.classList.add('hidden');
      this.hideTeacherAlert();
    }
  }

  async loadPendingReviews() {
    console.log('loadPendingReviews called, filter:', this.state.currentReviewFilter);

    const loading = this.getElement('teacher-review-loading');
    const list = this.getElement('teacher-review-list');
    const empty = this.getElement('teacher-review-empty');

    loading?.classList.remove('hidden');
    list?.classList.add('hidden');
    empty?.classList.add('hidden');

    try {
      const url = `${this.getServerUrl()}/api/teacher-review?status=${this.state.currentReviewFilter}`;
      console.log('Fetching reviews from:', url, 'with password:', this.getTeacherPassword());

      const response = await this.fetchFn(url, {
        headers: { 'x-teacher-password': this.getTeacherPassword() || 'stats123' }
      });

      console.log('Response status:', response.status);
      if (!response.ok) throw new Error('Failed to fetch reviews: ' + response.status);

      const reviews = await response.json();
      console.log('Reviews fetched:', reviews);
      this.state.pendingReviewsCache = reviews;

      loading?.classList.add('hidden');

      if (reviews.length === 0) {
        empty?.classList.remove('hidden');
        const message = this.state.currentReviewFilter === 'pending'
          ? 'No pending reviews!'
          : 'No reviewed items yet.';
        empty?.querySelector?.('p')?.replaceChildren?.();
        const emptyText = empty?.querySelector?.('p');
        if (emptyText) {
          emptyText.textContent = message;
        }
      } else {
        list?.classList.remove('hidden');
        this.renderReviewList(reviews);
      }

      if (this.state.currentReviewFilter === 'pending') {
        this.updateReviewBadge(reviews.length);
        if (reviews.length > 0 && this.isTeacherModeActive()) {
          const overlay = this.getElement('teacher-alert-overlay');
          if (overlay && overlay.classList.contains('hidden')) {
            overlay.classList.remove('hidden');
            this.state.teacherAlertActive = true;
            const alertCount = this.getElement('alert-review-count');
            if (alertCount) {
              alertCount.textContent = reviews.length;
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      loading?.classList.add('hidden');
      empty?.classList.remove('hidden');
      const emptyText = empty?.querySelector?.('p');
      if (emptyText) {
        emptyText.textContent = 'Failed to load reviews.';
      }
    }
  }

  showTeacherAlert(message) {
    const overlay = this.getElement('teacher-alert-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    this.state.teacherAlertActive = true;

    const alertCount = this.getElement('alert-review-count');
    if (alertCount) {
      const currentCount = parseInt(alertCount.textContent, 10) || 0;
      alertCount.textContent = currentCount + 1;
    }

    this.playTeacherAlert();

    Promise.resolve(this.loadPendingReviews())
      .catch((err) => console.warn('Failed to refresh pending reviews after alert:', err));

    console.log('Teacher alert shown for:', message?.username, message?.topic);
  }

  hideTeacherAlert() {
    this.getElement('teacher-alert-overlay')?.classList.add('hidden');
    this.state.teacherAlertActive = false;
  }

  getGradeBorderColor(grade) {
    switch (grade) {
      case 'E': return 'border-green-500';
      case 'P': return 'border-yellow-500';
      case 'I': return 'border-red-500';
      default: return 'border-gray-300';
    }
  }

  getGradeTextColor(grade) {
    switch (grade) {
      case 'E': return 'text-green-600';
      case 'P': return 'text-yellow-600';
      case 'I': return 'text-red-600';
      default: return 'text-gray-400';
    }
  }

  renderReviewList(reviews) {
    const list = this.getElement('teacher-review-list');
    if (!list) return;

    list.innerHTML = reviews.map((review) => {
      const answers = review.student_answers || {};
      const context = review.scenario_context || {};
      const keywordResults = review.keyword_results || {};
      const teacherGrades = review.teacher_grades || {};
      const expectedAnswers = review.expected_answers || {};
      const isReviewed = review.status === 'reviewed';
      const realName = review.real_name || null;
      const fields = review.field_ids || Object.keys(answers) || ['slope', 'intercept', 'correlation'];
      const cartridgeName = review.cartridge_name || 'LSRL Interpretation';

      const formatAnswer = (fieldId) => {
        const answer = answers[fieldId];
        if (answer === null || answer === undefined) return '(empty)';
        if (typeof answer === 'object') {
          if ('coefficient' in answer && 'radicand' in answer) {
            const coefficient = answer.coefficient || 1;
            const radicand = answer.radicand || 1;
            const hasI = answer.hasI || false;
            if (radicand === 1) {
              return hasI ? `${coefficient}i` : `${coefficient}`;
            }
            return hasI ? `${coefficient}i&radic;${radicand}` : `${coefficient}&radic;${radicand}`;
          }
          return JSON.stringify(answer);
        }
        return answer;
      };

      const formatExpected = (fieldId) => {
        const expected = expectedAnswers[fieldId];
        if (!expected) return null;
        if (typeof expected === 'object' && expected.value !== undefined) {
          return typeof expected.value === 'number' ? expected.value.toFixed(2) : expected.value;
        }
        return typeof expected === 'number' ? expected.toFixed(2) : expected;
      };

      return `
        <div class="bg-white border rounded-lg shadow-sm p-4" data-review-id="${review.id}" data-fields="${fields.join(',')}">
          <div class="flex justify-between items-start mb-3">
            <div>
              <span class="font-semibold text-gray-800">${realName || review.username}</span>
              ${realName ? `<span class="text-gray-500 text-xs ml-1">(${review.username})</span>` : ''}
              <span class="text-purple-600 text-xs ml-2 px-2 py-0.5 bg-purple-50 rounded">${cartridgeName}</span>
            </div>
            <span class="text-xs text-gray-400">${new Date(review.submitted_at).toLocaleString()}</span>
          </div>

          <div class="text-sm text-gray-600 mb-3 bg-gray-50 rounded p-2">
            <div class="font-medium text-gray-700 mb-1">${review.scenario_topic || 'Practice Problem'}</div>
            <div class="grid grid-cols-2 gap-1 text-xs">
              <div><strong>x:</strong> ${context.xVar || '?'} (${context.xUnits || '?'})</div>
              <div><strong>y:</strong> ${context.yVar || '?'} (${context.yUnits || '?'})</div>
              <div><strong>Equation:</strong> y = ${context.intercept || '?'} + ${context.slope || '?'}x</div>
              <div><strong>r:</strong> ${context.r || '?'}</div>
            </div>
          </div>

          <div class="space-y-3">
            ${fields.map((field) => {
              const expected = formatExpected(field);
              return `
              <div class="border-l-4 ${this.getGradeBorderColor(isReviewed ? teacherGrades[field] : keywordResults[field]?.score)} pl-3">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700 capitalize">${field.replace(/([A-Z])/g, ' $1').trim()}</span>
                  ${isReviewed
                    ? `<span class="font-bold ${this.getGradeTextColor(teacherGrades[field])}">${teacherGrades[field] || '?'}</span>`
                    : `<div class="flex gap-1">
                        <button onclick="setReviewGrade('${review.id}', '${field}', 'E')" class="grade-btn px-2 py-0.5 text-xs rounded ${teacherGrades[field] === 'E' ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-green-100'}">E</button>
                        <button onclick="setReviewGrade('${review.id}', '${field}', 'P')" class="grade-btn px-2 py-0.5 text-xs rounded ${teacherGrades[field] === 'P' ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-yellow-100'}">P</button>
                        <button onclick="setReviewGrade('${review.id}', '${field}', 'I')" class="grade-btn px-2 py-0.5 text-xs rounded ${teacherGrades[field] === 'I' ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-red-100'}">I</button>
                      </div>`
                  }
                </div>
                <p class="text-sm text-gray-600 mt-1 italic">"${formatAnswer(field)}"</p>
                ${expected ? `<p class="text-xs text-green-600 mt-1">Expected: ${expected}</p>` : ''}
                ${keywordResults[field]?.feedback ? `<p class="text-xs text-gray-400 mt-1">Auto: ${keywordResults[field].score} - ${keywordResults[field].feedback}</p>` : ''}
              </div>
            `;
            }).join('')}
          </div>

          ${!isReviewed ? `
            <div class="mt-4 flex justify-between">
              <button onclick="loadReviewProblem(${review.id})" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                View & Grade
              </button>
              <button onclick="submitTeacherGrades('${review.id}')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Quick Grade
              </button>
            </div>
          ` : `
            <div class="mt-3 text-xs text-green-600 text-right">
              Reviewed ${review.reviewed_at ? new Date(review.reviewed_at).toLocaleString() : ''}
            </div>
          `}
        </div>
      `;
    }).join('');
  }

  setReviewGrade(reviewId, field, grade) {
    if (!this.state.pendingGrades[reviewId]) {
      this.state.pendingGrades[reviewId] = {};
    }
    this.state.pendingGrades[reviewId][field] = grade;

    const reviewElement = this.querySelector(`[data-review-id="${reviewId}"]`);
    if (!reviewElement) return;

    const fieldElements = reviewElement.querySelectorAll('.border-l-4');
    fieldElements.forEach((fieldElement) => {
      const gradeButton = fieldElement.querySelector(`button[onclick*="'${field}'"]`);
      if (!gradeButton) return;

      fieldElement.querySelectorAll('.grade-btn').forEach((button) => {
        const buttonGrade = button.textContent;
        button.className = `grade-btn px-2 py-0.5 text-xs rounded ${buttonGrade === grade
          ? (grade === 'E' ? 'bg-green-500 text-white' : grade === 'P' ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white')
          : 'bg-gray-100 hover:bg-gray-200'}`;
      });
    });
  }

  async submitTeacherGrades(reviewId) {
    const grades = this.state.pendingGrades[reviewId];
    const reviewElement = this.querySelector(`[data-review-id="${reviewId}"]`);
    const fields = reviewElement?.dataset.fields?.split(',') || ['slope', 'intercept', 'correlation'];
    const missingFields = fields.filter((field) => !grades || !grades[field]);

    if (missingFields.length > 0) {
      this.celebration?.showToast?.(`Please grade all fields: ${missingFields.join(', ')}`, 'warning');
      return;
    }

    try {
      const review = this.state.pendingReviewsCache.find((item) => item.id === reviewId);
      const webrtcManager = this.getWebRTCManager();
      if (webrtcManager?.isActive && review?.username) {
        webrtcManager.sendTo(review.username, 'review_grade', {
          reviewId,
          grades,
          feedback: 'Teacher reviewed your work'
        });
      }

      const response = await this.fetchFn(`${this.getServerUrl()}/api/teacher-review/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-password': this.getTeacherPassword() || 'stats123'
        },
        body: JSON.stringify({ grades })
      });

      if (!response.ok) throw new Error('Failed to submit grades');

      this.celebration?.showToast?.('Grades submitted!', 'success');
      delete this.state.pendingGrades[reviewId];
      await this.loadPendingReviews();
    } catch (err) {
      console.error('Failed to submit grades:', err);
      this.celebration?.showToast?.('Failed to submit grades', 'error');
    }
  }

  async openReviewProblem(reviewId) {
    const review = this.state.pendingReviewsCache.find((item) => item.id === reviewId);
    if (!review) {
      this.celebration?.showToast?.('Review not found', 'error');
      return;
    }

    console.log('Loading review problem:', review);
    this.closePanel();
    await this.onLoadReviewProblem(review);
    this.state.activeReviewId = reviewId;
  }

  async submitActiveReviewGrades(grades) {
    if (!this.state.activeReviewId) {
      return false;
    }

    try {
      const response = await this.fetchFn(`${this.getServerUrl()}/api/teacher-review/${this.state.activeReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-password': this.getTeacherPassword() || 'stats123'
        },
        body: JSON.stringify({ grades })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      this.celebration?.showToast?.('Student review submitted!', 'success');
      this.state.activeReviewId = null;
      await this.loadPendingReviews();
      return true;
    } catch (err) {
      console.error('Failed to submit review:', err);
      return false;
    }
  }

  installGlobalHandlers() {
    if (!this.windowLike) return;

    this.windowLike.setReviewGrade = (reviewId, field, grade) => this.setReviewGrade(reviewId, field, grade);
    this.windowLike.submitTeacherGrades = (reviewId) => this.submitTeacherGrades(reviewId);
    this.windowLike.loadReviewProblem = (reviewId) => this.openReviewProblem(reviewId);
  }
}

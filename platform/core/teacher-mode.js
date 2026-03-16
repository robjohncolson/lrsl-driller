const TEACHER_CARTRIDGE_SHORTCUTS = [
  { alias: 'exp', name: 'Experimental Design' },
  { alias: 'inf', name: 'Design Choices + Inference' },
  { alias: 'lsrl', name: 'LSRL Interpretation' },
  { alias: 'calc', name: 'LSRL Calculations' },
  { alias: 'res', name: 'Residuals' },
  { alias: 'lev', name: 'Leverage Points' },
  { alias: 'rad', name: 'Radicals' },
  { alias: 'poly', name: 'Graphing Polynomials' },
  { alias: 'addsub', name: 'Add/Subtract Polynomials' },
  { alias: 'samp', name: 'Sampling/Data' },
  { alias: 'mit', name: 'MIT 6.0001' },
  { alias: 'prob', name: 'Probability & RVs' },
  { alias: 'u5', name: 'Sampling Distributions' },
  { alias: 'u6', name: 'Inference for Proportions' },
  { alias: 'u7', name: 'Inference for Means (7.1-7.2)' },
  { alias: 'div', name: 'Dividing Polynomials' }
];

export class TeacherModeController {
  constructor(config = {}) {
    this.userSystem = config.userSystem || null;
    this.celebration = config.celebration || null;
    this.getServerUrl = config.getServerUrl || (() => null);
    this.ensureRosterModal = config.ensureRosterModal || (async () => null);
    this.loadPendingReviews = config.loadPendingReviews || (() => {});
    this.clearPendingReviews = config.clearPendingReviews || (() => {});
    this.updateReviewBadge = config.updateReviewBadge || (() => {});
    this.hideTeacherAlert = config.hideTeacherAlert || (() => {});
    this.initVideoSourceToggle = config.initVideoSourceToggle || (() => {});
    this.fetchFn = config.fetchFn || globalThis.fetch?.bind(globalThis);
    this.documentLike = config.documentLike || globalThis.document || null;
    this.rtcPeerConnectionCtor = config.rtcPeerConnectionCtor ?? globalThis.RTCPeerConnection;
    this.state = {
      isTeacher: false,
      teacherPassword: null
    };
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  showCartridgeShortcuts() {
    const shortcutsSection = this.getElement('cartridge-shortcuts');
    const shortcutList = this.getElement('shortcut-list');
    if (!shortcutsSection || !shortcutList) return;

    shortcutList.innerHTML = TEACHER_CARTRIDGE_SHORTCUTS.map((shortcut) =>
      `<div class="flex justify-between"><span class="text-amber-700 font-bold">?c=${shortcut.alias}</span><span class="text-gray-500">${shortcut.name}</span></div>`
    ).join('');

    shortcutsSection.classList.remove('hidden');
  }

  async activate(password, showToast = true) {
    this.state.isTeacher = true;
    this.state.teacherPassword = password;

    await this.userSystem?.setMeta?.('teacherMode', { enabled: true, password });

    this.getElement('teacher-badge')?.classList.remove('hidden');
    this.getElement('teacher-review-btn')?.style?.setProperty('display', 'flex');
    this.getElement('time-analytics-btn')?.style?.setProperty('display', 'flex');
    this.getElement('roster-btn')?.style?.setProperty('display', 'flex');

    const webrtcButton = this.getElement('webrtc-toggle-btn');
    if (webrtcButton && this.rtcPeerConnectionCtor) {
      webrtcButton.style?.setProperty('display', 'flex');
    }

    const videoSourceSetting = this.getElement('video-source-setting');
    if (videoSourceSetting) {
      videoSourceSetting.classList.remove('hidden');
      this.initVideoSourceToggle();
    }

    this.getElement('preload-animations-setting')?.classList.remove('hidden');

    const teacherReviewPanel = this.getElement('teacher-review-panel');
    if (teacherReviewPanel) {
      teacherReviewPanel.classList.remove('hidden');
      teacherReviewPanel.classList.add('translate-x-full');
    }

    const timeAnalyticsPanel = this.getElement('time-analytics-panel');
    if (timeAnalyticsPanel) {
      timeAnalyticsPanel.classList.remove('hidden');
      timeAnalyticsPanel.classList.add('translate-x-full');
    }

    const rosterModal = await this.ensureRosterModal();
    rosterModal?.setTeacherPassword?.(password);

    if (showToast) {
      this.celebration?.showToast?.('Welcome, Teacher!', 'success');
    }

    this.showCartridgeShortcuts();

    Promise.resolve(this.loadPendingReviews())
      .catch((err) => console.warn('Failed to load pending reviews during teacher activation:', err));
  }

  async deactivate(clearPersistence = true) {
    this.state.isTeacher = false;
    this.state.teacherPassword = null;

    if (clearPersistence) {
      await this.userSystem?.setMeta?.('teacherMode', { enabled: false, password: null });
    }

    this.getElement('teacher-badge')?.classList.add('hidden');
    this.getElement('teacher-review-btn')?.style?.setProperty('display', 'none');
    this.getElement('time-analytics-btn')?.style?.setProperty('display', 'none');
    this.getElement('roster-btn')?.style?.setProperty('display', 'none');
    this.getElement('webrtc-toggle-btn')?.style?.setProperty('display', 'none');
    this.getElement('video-source-setting')?.classList.add('hidden');
    this.getElement('preload-animations-setting')?.classList.add('hidden');
    this.getElement('cartridge-shortcuts')?.classList.add('hidden');
    this.getElement('teacher-progression-panel')?.classList.add('hidden');

    const teacherReviewPanel = this.getElement('teacher-review-panel');
    if (teacherReviewPanel) {
      teacherReviewPanel.classList.add('hidden');
      teacherReviewPanel.classList.add('translate-x-full');
    }

    this.getElement('teacher-review-backdrop')?.classList.add('hidden');

    const timeAnalyticsPanel = this.getElement('time-analytics-panel');
    if (timeAnalyticsPanel) {
      timeAnalyticsPanel.classList.add('hidden');
      timeAnalyticsPanel.classList.add('translate-x-full');
    }

    this.getElement('time-analytics-backdrop')?.classList.add('hidden');

    this.clearPendingReviews();
    this.updateReviewBadge(0);
    this.hideTeacherAlert();
  }

  async validatePassword(password) {
    if (!this.fetchFn) {
      throw new Error('fetch is not available');
    }

    const response = await this.fetchFn(`${this.getServerUrl()}/api/auth/teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return response.json();
  }

  async checkPersistence() {
    try {
      const savedTeacher = await this.userSystem?.getMeta?.('teacherMode');
      if (savedTeacher?.enabled && savedTeacher?.password) {
        await this.activate(savedTeacher.password, false);

        this.validatePassword(savedTeacher.password)
          .then(async (result) => {
            if (!result.valid) {
              console.warn('Teacher password no longer valid; disabling cached teacher mode.');
              await this.deactivate(true);
            }
          })
          .catch((err) => {
            console.warn('Teacher mode revalidation deferred:', err);
          });

        return true;
      }
    } catch (err) {
      console.warn('Could not check teacher persistence:', err);
    }

    return false;
  }
}

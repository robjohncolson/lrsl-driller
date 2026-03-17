export class RealtimeController {
  constructor(config = {}) {
    this.wsClient = config.wsClient || null;
    this.assetCache = config.assetCache || null;
    this.assetResolver = config.assetResolver || null;
    this.userSystem = config.userSystem || null;
    this.celebration = config.celebration || null;
    this.getAvatarForUsername = config.getAvatarForUsername || (() => '?');
    this.isTeacherModeActive = config.isTeacherModeActive || (() => false);
    this.getCurrentUsername = config.getCurrentUsername || (() => this.userSystem?.currentUser?.username || null);
    this.showTeacherAlert = config.showTeacherAlert || (() => {});
    this.applyTeacherGrades = config.applyTeacherGrades || (async () => {});
    this.loadWebRTCManager = config.loadWebRTCManager || (() => import('./webrtc-manager.js'));
    this.loadP2PAssetTransfer = config.loadP2PAssetTransfer || (() => import('./p2p-asset-transfer.js'));
    this.documentLike = config.documentLike || globalThis.document || null;
    this.windowLike = config.windowLike || globalThis.window || globalThis;
    this.state = {
      webrtcManager: null,
      p2pAssetTransfer: null,
      processedReviewIds: new Set()
    };
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  getWebRTCManager() {
    return this.state.webrtcManager;
  }

  hasProcessedReview(reviewId) {
    return this.state.processedReviewIds.has(reviewId);
  }

  markProcessedReview(reviewId) {
    if (reviewId) {
      this.state.processedReviewIds.add(reviewId);
    }
  }

  updateOnlineDisplay(users) {
    const count = this.getElement('online-count');
    const list = this.getElement('online-list');
    if (count) count.textContent = users.length;
    if (!list) return;

    if (users.length === 0) {
      list.innerHTML = '<div class="px-3 py-2 text-sm text-gray-400 italic">No one else online</div>';
      return;
    }

    const currentUsername = this.getCurrentUsername();
    const isTeacher = this.isTeacherModeActive();
    list.innerHTML = users.map((username) => {
      const isYou = username === currentUsername;
      const avatar = this.getAvatarForUsername(username);
      const clickable = isTeacher && !isYou;

      return `
        <div class="px-3 py-1.5 flex items-center gap-2 ${isYou ? 'bg-purple-50' : 'hover:bg-gray-50'} ${clickable ? 'cursor-pointer' : ''}"
             ${clickable ? `onclick="openStudentDetail('${username}')"` : ''}>
          <span class="text-lg">${avatar}</span>
          <span class="w-2 h-2 bg-green-500 rounded-full"></span>
          <span class="text-sm text-gray-700 ${clickable ? 'hover:text-indigo-600 hover:underline' : ''}">${username}</span>
          ${isYou ? '<span class="text-xs text-purple-600 ml-auto">(you)</span>' : ''}
          ${clickable ? '<span class="text-xs text-indigo-400 ml-auto">👁️</span>' : ''}
        </div>
      `;
    }).join('');
  }

  updateConnectionStatus(connected) {
    const dot = this.getElement('connection-dot');
    if (!dot) return;
    dot.className = connected
      ? 'w-2 h-2 bg-green-500 rounded-full animate-pulse'
      : 'w-2 h-2 bg-gray-400 rounded-full';
  }

  async handleSocketConnectionChange(connected) {
    this.updateConnectionStatus(connected);

    if (!connected || !this.wsClient?.currentUsername || this.state.p2pAssetTransfer) {
      return;
    }

    const { P2PAssetTransfer } = await this.loadP2PAssetTransfer();
    this.state.p2pAssetTransfer = new P2PAssetTransfer(this.wsClient, this.assetCache, this.wsClient.currentUsername);
    this.assetResolver?.setPeerManager?.(this.state.p2pAssetTransfer);
  }

  handleTeacherReviewSubmitted(message) {
    if (this.isTeacherModeActive()) {
      this.showTeacherAlert(message);
    }
  }

  async handleTeacherReviewCompleted(message) {
    if (message.reviewId && this.hasProcessedReview(message.reviewId)) {
      return false;
    }

    this.markProcessedReview(message.reviewId);
    await this.applyTeacherGrades(message);
    return true;
  }

  async initWebRTCManager(role) {
    if (this.state.webrtcManager) {
      this.state.webrtcManager.destroy();
    }

    const { WebRTCManager } = await this.loadWebRTCManager();
    this.state.webrtcManager = new WebRTCManager({
      wsClient: this.wsClient,
      role,
      username: this.getCurrentUsername(),
      onMessage: (fromUsername, type, payload, msgId) => this.handleWebRTCMessage(fromUsername, type, payload, msgId),
      onConnectionChange: (peerUsername, state) => {
        console.log(`[WebRTC] ${peerUsername}: ${state}`);
        this.updateWebRTCStatusUI();
      },
      onLatencyUpdate: () => {
        this.updateWebRTCStatusUI();
      }
    });

    return this.state.webrtcManager;
  }

  async handleWebRTCActivate(message) {
    if (this.state.webrtcManager) return;
    if (!this.isTeacherModeActive() && this.getCurrentUsername()) {
      const manager = await this.initWebRTCManager('student');
      manager.connectToTeacher(message.teacherUsername);
    }
  }

  handleWebRTCDeactivate() {
    const manager = this.state.webrtcManager;
    if (!manager || this.isTeacherModeActive()) {
      return;
    }

    manager.disconnectFromTeacher();
    manager.destroy();
    this.state.webrtcManager = null;
    this.updateWebRTCStatusUI();
  }

  handleWebRTCSignal(message) {
    this.state.webrtcManager?.handleSignalingMessage(message);
  }

  handleP2PAssetSignal(message) {
    this.state.p2pAssetTransfer?.handleSignalingMessage?.(message);
  }

  async handleWebRTCMessage(fromUsername, type, payload) {
    switch (type) {
      case 'review_submit':
        if (this.isTeacherModeActive()) {
          this.showTeacherAlert({
            username: payload.username,
            topic: payload.topic
          });
        }
        break;

      case 'review_grade':
        if (payload.reviewId && this.hasProcessedReview(payload.reviewId)) {
          return false;
        }
        this.markProcessedReview(payload.reviewId);
        await this.applyTeacherGrades({
          username: this.getCurrentUsername(),
          reviewId: payload.reviewId,
          grades: payload.grades,
          feedback: payload.feedback
        });
        return true;

      case 'channel_ready':
        console.log(`[WebRTC] Channel ready with ${fromUsername} (${payload.role})`);
        break;
    }

    return false;
  }

  updateWebRTCStatusUI() {
    const dot = this.getElement('webrtc-status-dot');
    const panel = this.getElement('webrtc-peer-list');
    const manager = this.state.webrtcManager;
    if (!dot) return;

    if (!manager || !manager.isActive) {
      dot.className = 'w-2 h-2 bg-gray-400 rounded-full';
      if (panel) {
        panel.innerHTML = '<p class="text-xs text-gray-400 italic">No connections</p>';
      }
      return;
    }

    const peers = manager.getConnectedPeers();
    dot.className = peers.length > 0
      ? 'w-2 h-2 bg-green-500 rounded-full'
      : 'w-2 h-2 bg-yellow-500 rounded-full animate-pulse';

    if (!panel) return;

    if (peers.length === 0) {
      panel.innerHTML = '<p class="text-xs text-gray-400 italic">Waiting for connections...</p>';
      return;
    }

    panel.innerHTML = peers.map((peerUsername) => {
      const latency = manager.getLatency(peerUsername);
      const latencyText = latency !== null ? `${latency}ms` : '...';
      const latencyColor = latency !== null && latency < 50 ? 'text-green-600' : 'text-yellow-600';
      return `<div class="flex items-center justify-between py-1 text-sm">
        <span class="flex items-center gap-1">
          <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          ${peerUsername}
        </span>
        <span class="${latencyColor} text-xs font-mono">${latencyText}</span>
      </div>`;
    }).join('');
  }

  async toggleTeacherWebRTC() {
    if (!this.isTeacherModeActive()) {
      return false;
    }

    const manager = this.state.webrtcManager;
    if (manager && manager.isActive) {
      manager.deactivate();
      manager.destroy();
      this.state.webrtcManager = null;
      this.updateWebRTCStatusUI();
      this.celebration?.showToast?.('WebRTC direct connect disabled', 'info');
      return false;
    }

    const nextManager = await this.initWebRTCManager('teacher');
    nextManager.activate();
    this.updateWebRTCStatusUI();
    this.celebration?.showToast?.('WebRTC direct connect enabled', 'success');
    return true;
  }

  sendTeacherReviewSubmission(payload) {
    const manager = this.state.webrtcManager;
    if (!manager || !manager.isActive) {
      return false;
    }

    const peers = manager.getConnectedPeers();
    if (peers.length === 0) {
      return false;
    }

    return manager.sendTo(peers[0], 'review_submit', payload);
  }

  toggleOnlineDropdown() {
    this.getElement('online-dropdown')?.classList.toggle('hidden');
  }

  hideOnlineDropdown() {
    this.getElement('online-dropdown')?.classList.add('hidden');
  }

  toggleStatusPanel() {
    this.getElement('webrtc-status-panel')?.classList.toggle('hidden');
  }

  closeStatusPanel() {
    this.getElement('webrtc-status-panel')?.classList.add('hidden');
  }

  destroyP2PAssetTransfer() {
    if (!this.state.p2pAssetTransfer) return;
    this.state.p2pAssetTransfer.destroy?.();
    this.state.p2pAssetTransfer = null;
    this.assetResolver?.setPeerManager?.(null);
  }

  cleanup() {
    if (this.state.webrtcManager) {
      this.state.webrtcManager.destroy();
      this.state.webrtcManager = null;
    }
    this.destroyP2PAssetTransfer();
    this.assetCache?.revokeBlobUrls?.();
  }

  installEventListeners() {
    this.getElement('online-btn')?.addEventListener?.('click', () => this.toggleOnlineDropdown());

    this.documentLike?.addEventListener?.('click', (event) => {
      if (!event.target?.closest?.('#online-indicator')) {
        this.hideOnlineDropdown();
      }
    });

    this.getElement('webrtc-toggle-btn')?.addEventListener?.('click', async () => {
      await this.toggleTeacherWebRTC();
    });

    this.getElement('webrtc-toggle-btn')?.addEventListener?.('contextmenu', (event) => {
      event.preventDefault();
      this.toggleStatusPanel();
    });

    this.getElement('close-webrtc-panel')?.addEventListener?.('click', () => this.closeStatusPanel());
    this.windowLike?.addEventListener?.('beforeunload', () => this.cleanup());
  }
}

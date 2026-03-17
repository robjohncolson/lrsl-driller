import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RealtimeController } from '../../platform/core/realtime-controller.ts';

const appHtmlPath = join(process.cwd(), 'platform', 'app.html');
const appHtmlContent = readFileSync(appHtmlPath, 'utf-8');

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    add: (...tokens) => tokens.forEach((token) => classes.add(token)),
    remove: (...tokens) => tokens.forEach((token) => classes.delete(token)),
    toggle(token) {
      if (classes.has(token)) {
        classes.delete(token);
        return false;
      }
      classes.add(token);
      return true;
    },
    contains: (token) => classes.has(token)
  };
}

function createElement({ classes = [], textContent = '' } = {}) {
  const handlers = new Map();

  return {
    classList: createClassList(classes),
    textContent,
    innerHTML: '',
    className: '',
    style: {},
    addEventListener(eventName, handler) {
      handlers.set(eventName, handler);
    },
    dispatch(eventName, detail = {}) {
      const handler = handlers.get(eventName);
      if (handler) {
        return handler({ target: this, preventDefault() {}, ...detail });
      }
      return undefined;
    }
  };
}

function createDocumentLike() {
  const handlers = new Map();
  const elements = new Map([
    ['online-count', createElement()],
    ['online-list', createElement()],
    ['connection-dot', createElement()],
    ['online-dropdown', createElement({ classes: ['hidden'] })],
    ['online-btn', createElement()],
    ['webrtc-toggle-btn', createElement()],
    ['webrtc-status-dot', createElement()],
    ['webrtc-peer-list', createElement()],
    ['webrtc-status-panel', createElement({ classes: ['hidden'] })],
    ['close-webrtc-panel', createElement()]
  ]);

  return {
    getElementById(id) {
      return elements.get(id) || null;
    },
    addEventListener(eventName, handler) {
      handlers.set(eventName, handler);
    },
    dispatch(eventName, detail = {}) {
      const handler = handlers.get(eventName);
      if (handler) {
        return handler(detail);
      }
      return undefined;
    }
  };
}

function createController(overrides = {}) {
  const documentLike = overrides.documentLike || createDocumentLike();
  const celebration = overrides.celebration || { showToast: vi.fn() };

  return new RealtimeController({
    wsClient: overrides.wsClient || { currentUsername: 'teacher1', send: vi.fn() },
    assetCache: overrides.assetCache || { revokeBlobUrls: vi.fn() },
    assetResolver: overrides.assetResolver || { setPeerManager: vi.fn() },
    userSystem: overrides.userSystem || { currentUser: { username: 'teacher1' } },
    celebration,
    getAvatarForUsername: overrides.getAvatarForUsername || ((username) => username.slice(0, 1).toUpperCase()),
    isTeacherModeActive: overrides.isTeacherModeActive || (() => true),
    getCurrentUsername: overrides.getCurrentUsername || (() => 'teacher1'),
    showTeacherAlert: overrides.showTeacherAlert || vi.fn(),
    applyTeacherGrades: overrides.applyTeacherGrades || vi.fn().mockResolvedValue(undefined),
    loadWebRTCManager: overrides.loadWebRTCManager || vi.fn(async () => ({ WebRTCManager: class {} })),
    loadP2PAssetTransfer: overrides.loadP2PAssetTransfer || vi.fn(async () => ({ P2PAssetTransfer: class {} })),
    documentLike,
    windowLike: overrides.windowLike || { addEventListener: vi.fn() }
  });
}

describe('Realtime controller extraction', () => {
  it('imports and wires the shared realtime controller module', () => {
    expect(appHtmlContent).toContain("import { RealtimeController } from './core/realtime-controller.ts';");
    expect(appHtmlContent).toContain('realtimeController = new RealtimeController({');
    expect(appHtmlContent).toContain('realtimeController.installEventListeners();');
  });

  it('renders the online list with teacher-only student detail affordances', () => {
    const documentLike = createDocumentLike();
    const controller = createController({
      documentLike,
      getCurrentUsername: () => 'teacher1',
      isTeacherModeActive: () => true
    });

    controller.updateOnlineDisplay(['alice', 'teacher1']);

    expect(documentLike.getElementById('online-count').textContent).toBe('2');
    expect(documentLike.getElementById('online-list').innerHTML).toContain("openStudentDetail('alice')");
    expect(documentLike.getElementById('online-list').innerHTML).toContain('cursor-pointer');
    expect(documentLike.getElementById('online-list').innerHTML).toContain('👁️');
    expect(documentLike.getElementById('online-list').innerHTML).toContain('(you)');
  });

  it('updates connection state and lazily wires the P2P asset transfer on socket connect', async () => {
    const documentLike = createDocumentLike();
    const setPeerManager = vi.fn();
    const assetResolver = { setPeerManager };
    const assetCache = {};
    const p2pInstances = [];
    const loadP2PAssetTransfer = vi.fn(async () => ({
      P2PAssetTransfer: class P2PAssetTransfer {
        constructor(wsClient, cache, username) {
          this.wsClient = wsClient;
          this.cache = cache;
          this.username = username;
          this.destroy = vi.fn();
          this.handleSignalingMessage = vi.fn();
          p2pInstances.push(this);
        }
      }
    }));
    const controller = createController({
      documentLike,
      assetResolver,
      assetCache,
      loadP2PAssetTransfer,
      wsClient: { currentUsername: 'alice', send: vi.fn() }
    });

    await controller.handleSocketConnectionChange(true);

    expect(documentLike.getElementById('connection-dot').className).toContain('bg-green-500');
    expect(loadP2PAssetTransfer).toHaveBeenCalledTimes(1);
    expect(p2pInstances).toHaveLength(1);
    expect(p2pInstances[0].username).toBe('alice');
    expect(setPeerManager).toHaveBeenCalledWith(p2pInstances[0]);
  });

  it('toggles teacher WebRTC, updates the status UI, and can cleanly deactivate', async () => {
    const documentLike = createDocumentLike();
    const managerInstances = [];
    const loadWebRTCManager = vi.fn(async () => ({
      WebRTCManager: class WebRTCManager {
        constructor(config) {
          this.config = config;
          this.isActive = false;
          this.connectedPeers = [];
          this.destroy = vi.fn();
          managerInstances.push(this);
        }
        activate() {
          this.isActive = true;
        }
        deactivate() {
          this.isActive = false;
        }
        getConnectedPeers() {
          return this.connectedPeers;
        }
        getLatency() {
          return null;
        }
      }
    }));
    const celebration = { showToast: vi.fn() };
    const controller = createController({
      documentLike,
      celebration,
      loadWebRTCManager,
      isTeacherModeActive: () => true,
      getCurrentUsername: () => 'teacher1'
    });

    const enabled = await controller.toggleTeacherWebRTC();

    expect(enabled).toBe(true);
    expect(loadWebRTCManager).toHaveBeenCalledTimes(1);
    expect(managerInstances).toHaveLength(1);
    expect(documentLike.getElementById('webrtc-status-dot').className).toContain('bg-yellow-500');
    expect(documentLike.getElementById('webrtc-peer-list').innerHTML).toContain('Waiting for connections...');
    expect(celebration.showToast).toHaveBeenCalledWith('WebRTC direct connect enabled', 'success');

    const disabled = await controller.toggleTeacherWebRTC();

    expect(disabled).toBe(false);
    expect(managerInstances[0].destroy).toHaveBeenCalled();
    expect(documentLike.getElementById('webrtc-status-dot').className).toContain('bg-gray-400');
    expect(celebration.showToast).toHaveBeenCalledWith('WebRTC direct connect disabled', 'info');
  });

  it('sends student review submissions over WebRTC and deduplicates teacher grade delivery', async () => {
    const sendTo = vi.fn(() => true);
    const applyTeacherGrades = vi.fn().mockResolvedValue(undefined);
    const controller = createController({
      applyTeacherGrades,
      getCurrentUsername: () => 'alice'
    });

    controller.state.webrtcManager = {
      isActive: true,
      getConnectedPeers: () => ['teacher1'],
      sendTo,
      getLatency: () => null
    };

    const sent = controller.sendTeacherReviewSubmission({
      reviewData: { id: 'review-1' },
      username: 'alice',
      topic: 'LSRL',
      cartridgeId: 'lsrl-interpretation'
    });

    expect(sent).toBe(true);
    expect(sendTo).toHaveBeenCalledWith('teacher1', 'review_submit', {
      reviewData: { id: 'review-1' },
      username: 'alice',
      topic: 'LSRL',
      cartridgeId: 'lsrl-interpretation'
    });

    const firstDelivery = await controller.handleWebRTCMessage('teacher1', 'review_grade', {
      reviewId: 'review-1',
      grades: { slope: 'E' },
      feedback: 'Teacher reviewed your work'
    });
    const secondDelivery = await controller.handleWebRTCMessage('teacher1', 'review_grade', {
      reviewId: 'review-1',
      grades: { slope: 'E' },
      feedback: 'Teacher reviewed your work'
    });

    expect(firstDelivery).toBe(true);
    expect(secondDelivery).toBe(false);
    expect(applyTeacherGrades).toHaveBeenCalledTimes(1);
    expect(applyTeacherGrades).toHaveBeenCalledWith({
      username: 'alice',
      reviewId: 'review-1',
      grades: { slope: 'E' },
      feedback: 'Teacher reviewed your work'
    });
  });

  it('cleans up realtime transports and cached blob URLs', () => {
    const destroyManager = vi.fn();
    const destroyP2P = vi.fn();
    const revokeBlobUrls = vi.fn();
    const setPeerManager = vi.fn();
    const controller = createController({
      assetCache: { revokeBlobUrls },
      assetResolver: { setPeerManager }
    });

    controller.state.webrtcManager = { destroy: destroyManager };
    controller.state.p2pAssetTransfer = { destroy: destroyP2P };

    controller.cleanup();

    expect(destroyManager).toHaveBeenCalledTimes(1);
    expect(destroyP2P).toHaveBeenCalledTimes(1);
    expect(setPeerManager).toHaveBeenCalledWith(null);
    expect(revokeBlobUrls).toHaveBeenCalledTimes(1);
    expect(controller.getWebRTCManager()).toBeNull();
  });
});

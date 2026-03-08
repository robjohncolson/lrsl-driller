import { readFileSync } from 'node:fs';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Platform } from '../platform/platform.js';
import { GameEngine } from '../platform/core/game-engine.js';
import { parseQueryParams, restoreStateFromURL, updateURL } from '../platform/core/url-state.js';

const manifest = JSON.parse(
  readFileSync(
    new URL('../cartridges/apstats-u5-sampling-dist/manifest.json', import.meta.url),
    'utf8'
  )
);

const CARTRIDGE_ID = manifest.meta.id;
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    dump: () => ({ ...store })
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  configurable: true
});

function getModeId(modeNumber) {
  return manifest.modes[modeNumber - 1]?.id ?? null;
}

function getModeNumber(modeId) {
  const index = manifest.modes.findIndex((mode) => mode.id === modeId);
  return index >= 0 ? index + 1 : null;
}

function getRequiredGoldForMode(modeNumber) {
  const mode = manifest.modes[modeNumber - 1];
  if (!mode || mode.unlockedBy === 'default') {
    return 0;
  }

  return mode.unlockedBy?.gold ?? 1;
}

function setModeGold(engine, modeNumber, gold) {
  const modeId = getModeId(modeNumber);
  if (!modeId) {
    throw new Error(`Unknown mode number: ${modeNumber}`);
  }

  engine.starsPerMode[modeId] = {
    gold,
    silver: 0,
    bronze: 0,
    tin: 0
  };
}

function persistProgress({
  activeModeNumber = 1,
  unlockThroughModeNumber = 1,
  completedModeNumbers = null
} = {}) {
  const engine = new GameEngine();
  engine.loadCartridge(manifest);

  engine.starCounts = { gold: 0, silver: 0, bronze: 0, tin: 0 };

  const completedModes = completedModeNumbers ?? Array.from(
    { length: Math.max(0, unlockThroughModeNumber - 1) },
    (_, index) => index + 1
  );

  for (const modeNumber of completedModes) {
    const requiredGold = getRequiredGoldForMode(modeNumber + 1);
    setModeGold(engine, modeNumber, requiredGold);
    engine.starCounts.gold += requiredGold;
  }

  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);
  engine.currentTier = getModeId(activeModeNumber);
  engine.saveState();

  return engine.getState();
}

function createLoader() {
  return {
    load: vi.fn(async (cartridgeId) => ({
      manifest: {
        ...manifest,
        meta: {
          ...manifest.meta,
          id: cartridgeId
        }
      },
      gradingRules: {
        gradeField: vi.fn(() => ({ score: 'E', feedback: 'Correct' }))
      }
    })),
    getModes: vi.fn(() => manifest.modes),
    getMode: vi.fn((modeId) => manifest.modes.find((mode) => mode.id === modeId)),
    generateProblem: vi.fn(async (modeId) => ({
      context: { modeId },
      answers: {},
      scenario: `Problem for ${modeId}`,
      graphConfig: null
    }))
  };
}

function createPlatformUnderTest(loader) {
  const platform = new Platform();
  platform.cartridgeLoader = loader;

  // These callbacks normally update DOM widgets in app.html.
  platform.gameEngine.onStarEarned = () => {};
  platform.gameEngine.onTierUnlocked = () => {};
  platform.gameEngine.onStreakUpdate = () => {};

  return platform;
}

async function initDeepLink(search) {
  const parsed = parseQueryParams(search);
  const loader = createLoader();
  const platform = createPlatformUnderTest(loader);

  // Mirror the current app init order: parse URL -> load cartridge -> restore state -> set mode -> normalize URL.
  await platform.loadCartridge(parsed.cartridge);

  const resolution = restoreStateFromURL(parsed, {
    modes: manifest.modes,
    state: platform.gameEngine.getState(),
    currentMode: platform.currentMode,
    getRequiredGold: (modeId) => platform.gameEngine.getRequiredGold(modeId)
  });

  if (resolution.modeId && resolution.modeId !== platform.currentMode) {
    const didSet = platform.setMode(resolution.modeId, resolution.forceAccess);
    expect(didSet).toBe(true);
  }

  updateURL(parsed.cartridge, resolution.modeNumber, {
    location: new URL(`https://example.test/platform/app.html${search}`),
    history: global.history
  });

  return {
    parsed,
    loader,
    platform,
    state: platform.gameEngine.getState()
  };
}

function completeActiveMode(platform) {
  const currentModeId = platform.currentMode;
  const currentIndex = platform.gameEngine.getModeIndex(currentModeId);

  platform.gameEngine.setTier(currentModeId, true);
  platform.gameEngine.awardStar('gold', currentModeId);

  const state = platform.gameEngine.getState();
  const nextModeId = state.modeOrder[currentIndex + 1] ?? null;
  const didAdvance = nextModeId ? platform.setMode(nextModeId) : false;

  if (didAdvance) {
    updateURL(CARTRIDGE_ID, getModeNumber(nextModeId));
  }

  return {
    nextModeId,
    didAdvance,
    state
  };
}

describe('Deep-link: Path A - Direct Navigation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    global.history = { replaceState: vi.fn() };
    global.window = {
      location: new URL('https://example.test/platform/app.html'),
      history: global.history
    };
  });

  test('loads correct cartridge from URL params', async () => {
    persistProgress({
      activeModeNumber: 1,
      unlockThroughModeNumber: 3
    });

    const result = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=3`);

    expect(result.loader.load).toHaveBeenCalledWith(CARTRIDGE_ID, null);
    expect(result.platform.currentCartridge.manifest.meta.id).toBe(CARTRIDGE_ID);
    expect(result.platform.currentMode).toBe(getModeId(3));
    expect(history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining(`cartridge=${CARTRIDGE_ID}`)
    );
    expect(history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining('mode=3')
    );
  });

  test('loads mode 1 when no mode param specified', async () => {
    const result = await initDeepLink(`?cartridge=${CARTRIDGE_ID}`);

    expect(result.platform.currentMode).toBe(getModeId(1));
    expect(result.state.currentTier).toBe(getModeId(1));
  });

  test('redirects to first locked prerequisite if mode is locked', async () => {
    persistProgress({
      activeModeNumber: 2,
      completedModeNumbers: [1, 2]
    });

    const result = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=5`);

    expect(result.platform.currentMode).toBe(getModeId(3));
    expect(history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining('mode=3')
    );
  });
});

describe('Deep-link: Path B - URL Restoration After Refresh', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    global.history = { replaceState: vi.fn() };
    global.window = {
      location: new URL('https://example.test/platform/app.html'),
      history: global.history
    };
  });

  test('preserves mode after page refresh', async () => {
    persistProgress({
      activeModeNumber: 5,
      unlockThroughModeNumber: 5
    });

    const firstLoad = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=5`);
    const refreshedLoad = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=5`);

    expect(firstLoad.platform.currentMode).toBe(getModeId(5));
    expect(refreshedLoad.platform.currentMode).toBe(getModeId(5));
    expect(refreshedLoad.state.currentTier).toBe(getModeId(5));
  });

  test('preserves progress state after refresh', async () => {
    persistProgress({
      activeModeNumber: 3,
      completedModeNumbers: [1, 2]
    });

    // The core platform persists progression state today (tier + stars per mode), not in-progress input drafts.
    const refreshedLoad = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=3`);

    expect(refreshedLoad.platform.currentMode).toBe(getModeId(3));
    expect(refreshedLoad.state.starsPerMode[getModeId(1)].gold).toBe(1);
    expect(refreshedLoad.state.starsPerMode[getModeId(2)].gold).toBe(1);
    expect(refreshedLoad.state.unlockedTiers).toContain(getModeId(3));
  });

  test('URL restoration respects progression gating', async () => {
    persistProgress({
      activeModeNumber: 2,
      completedModeNumbers: [1, 2]
    });

    const refreshedLoad = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=5`);

    expect(refreshedLoad.platform.currentMode).toBe(getModeId(3));
    expect(refreshedLoad.platform.currentMode).not.toBe(getModeId(5));
  });
});

describe('Deep-link: Progression After Deep-Link Entry', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    global.history = { replaceState: vi.fn() };
    global.window = {
      location: new URL('https://example.test/platform/app.html'),
      history: global.history
    };
  });

  test('completing deep-linked mode advances to next', async () => {
    persistProgress({
      activeModeNumber: 5,
      unlockThroughModeNumber: 5
    });

    const result = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=5`);
    const completion = completeActiveMode(result.platform);

    expect(completion.didAdvance).toBe(true);
    expect(completion.nextModeId).toBe(getModeId(6));
    expect(result.platform.currentMode).toBe(getModeId(6));
  });

  test('completing last mode shows completion state', async () => {
    persistProgress({
      activeModeNumber: manifest.modes.length,
      unlockThroughModeNumber: manifest.modes.length
    });

    const result = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=${manifest.modes.length}`);
    const completion = completeActiveMode(result.platform);

    expect(completion.nextModeId).toBeNull();
    expect(completion.didAdvance).toBe(false);
    expect(result.platform.currentMode).toBe(getModeId(manifest.modes.length));
  });

  test('the 5-7 to 5-2 regression does not occur', async () => {
    persistProgress({
      activeModeNumber: 7,
      unlockThroughModeNumber: 7
    });

    const result = await initDeepLink(`?cartridge=${CARTRIDGE_ID}&mode=7`);
    const completion = completeActiveMode(result.platform);

    expect(completion.didAdvance).toBe(true);
    expect(completion.nextModeId).toBe(getModeId(8));
    expect(completion.nextModeId).not.toBe(getModeId(2));
    expect(result.platform.currentMode).not.toBe(getModeId(2));
  });
});

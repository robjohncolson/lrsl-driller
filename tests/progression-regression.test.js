import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { GameEngine } from '../platform/core/game-engine.js';
import { Platform } from '../platform/platform.js';

const unit5Manifest = JSON.parse(
  readFileSync(
    new URL('../cartridges/apstats-u5-sampling-dist/manifest.json', import.meta.url),
    'utf8'
  )
);

const lsrlManifest = JSON.parse(
  readFileSync(
    new URL('../cartridges/lsrl-interpretation/manifest.json', import.meta.url),
    'utf8'
  )
);

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
    })
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  configurable: true
});

function createEngine() {
  return new GameEngine({
    onStreakUpdate: vi.fn(),
    onStarEarned: vi.fn(),
    onTierUnlocked: vi.fn()
  });
}

function getModeId(manifest, modeNumber) {
  return manifest.modes[modeNumber - 1]?.id ?? null;
}

function getModeNumberByPrefix(manifest, prefix) {
  const index = manifest.modes.findIndex((mode) => mode.name.startsWith(prefix));

  if (index < 0) {
    throw new Error(`No mode found with prefix "${prefix}"`);
  }

  return index + 1;
}

function getRequiredGoldForMode(manifest, modeNumber) {
  const mode = manifest.modes[modeNumber - 1];
  if (!mode || mode.unlockedBy === 'default') {
    return 0;
  }

  return mode.unlockedBy?.gold ?? 1;
}

function setModeGold(engine, modeId, gold) {
  engine.starsPerMode[modeId] = {
    gold,
    silver: 0,
    bronze: 0,
    tin: 0
  };
}

function buildCompletedModeNumbers(activeModeNumber) {
  return Array.from(
    { length: Math.max(0, activeModeNumber - 1) },
    (_, index) => index + 1
  );
}

function persistProgress(
  manifest,
  {
    activeModeNumber = 1,
    completedModeNumbers = buildCompletedModeNumbers(activeModeNumber)
  } = {}
) {
  const engine = createEngine();
  engine.loadCartridge(manifest);
  engine.starCounts = { gold: 0, silver: 0, bronze: 0, tin: 0 };

  for (const modeNumber of completedModeNumbers) {
    const modeId = getModeId(manifest, modeNumber);
    const gold = getRequiredGoldForMode(manifest, modeNumber + 1);
    setModeGold(engine, modeId, gold);
    engine.starCounts.gold += gold;
  }

  engine.unlockedTiers = [];
  engine.checkUnlocks(engine.unlockRules);
  engine.currentTier = getModeId(manifest, activeModeNumber);
  engine.saveState();

  return engine.getState();
}

function createLoader(manifestsById) {
  let activeManifest = null;

  return {
    load: vi.fn(async (cartridgeId) => {
      activeManifest = manifestsById[cartridgeId];
      if (!activeManifest) {
        throw new Error(`Unknown cartridge: ${cartridgeId}`);
      }

      return {
        id: cartridgeId,
        manifest: activeManifest,
        gradingRules: {
          gradeField: vi.fn(() => ({ score: 'E', feedback: 'Correct' }))
        }
      };
    }),
    getModes: vi.fn(() => activeManifest?.modes ?? []),
    getMode: vi.fn((modeId) => activeManifest?.modes.find((mode) => mode.id === modeId)),
    generateProblem: vi.fn(async (modeId) => ({
      context: { modeId },
      answers: {},
      scenario: `Problem for ${modeId}`,
      graphConfig: null
    }))
  };
}

function createPlatform(manifestsById) {
  const platform = new Platform();
  platform.cartridgeLoader = createLoader(manifestsById);

  // Keep progression tests in Node without DOM event dispatch.
  platform.gameEngine.onStarEarned = () => {};
  platform.gameEngine.onTierUnlocked = () => {};
  platform.gameEngine.onStreakUpdate = () => {};

  return platform;
}

async function loadPlatformWithProgress(manifest, progress = {}) {
  persistProgress(manifest, progress);

  const platform = createPlatform({
    [unit5Manifest.meta.id]: unit5Manifest,
    [lsrlManifest.meta.id]: lsrlManifest
  });

  await platform.loadCartridge(manifest.meta.id);
  return platform;
}

// Mirrors the sequential next-mode lookup used by the app-level auto-advance flow.
function completeCurrentMode(platform, { penalties = 0 } = {}) {
  const completedModeId = platform.currentMode;
  const currentIndex = platform.gameEngine.getModeIndex(completedModeId);

  platform.gameEngine.resetHintsForNewProblem();
  for (let index = 0; index < penalties; index++) {
    platform.gameEngine.useHint(`hint-${index}`);
  }

  const result = platform.gameEngine.recordResult(`field-${completedModeId}`, 'E', true);
  const state = platform.gameEngine.getState();
  const nextModeId = state.modeOrder[currentIndex + 1] ?? null;
  const nextModeUnlocked = nextModeId ? state.unlockedTiers.includes(nextModeId) : false;
  const didAdvance = nextModeUnlocked ? platform.setMode(nextModeId) : false;

  return {
    completedModeId,
    nextModeId,
    didAdvance,
    result,
    state
  };
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('Progression: Star Award -> Unlock -> Advance', () => {
  test('completing modes 1 through 7 advances to the immediate next mode', async () => {
    for (let modeNumber = 1; modeNumber <= 7; modeNumber++) {
      localStorageMock.clear();

      const platform = await loadPlatformWithProgress(unit5Manifest, {
        activeModeNumber: modeNumber
      });

      const completion = completeCurrentMode(platform);

      expect(completion.didAdvance).toBe(true);
      expect(completion.nextModeId).toBe(getModeId(unit5Manifest, modeNumber + 1));
      expect(platform.currentMode).toBe(getModeId(unit5Manifest, modeNumber + 1));
    }
  });

  test('completing the last mode does not wrap to the beginning', async () => {
    const lastModeNumber = unit5Manifest.modes.length;
    const platform = await loadPlatformWithProgress(unit5Manifest, {
      activeModeNumber: lastModeNumber
    });

    const completion = completeCurrentMode(platform);

    expect(completion.nextModeId).toBeNull();
    expect(completion.didAdvance).toBe(false);
    expect(platform.currentMode).toBe(getModeId(unit5Manifest, lastModeNumber));
    expect(platform.currentMode).not.toBe(getModeId(unit5Manifest, 1));
  });

  test('completing Topic 5.7 advances to Topic 5.8, not back to Topic 5.2', async () => {
    const topic57Capstone = getModeNumberByPrefix(unit5Manifest, '5.7 Cap');
    const topic58Start = getModeNumberByPrefix(unit5Manifest, '5.8a');
    const topic52Start = getModeNumberByPrefix(unit5Manifest, '5.2a');

    const platform = await loadPlatformWithProgress(unit5Manifest, {
      activeModeNumber: topic57Capstone
    });

    const completion = completeCurrentMode(platform);

    expect(completion.didAdvance).toBe(true);
    expect(completion.nextModeId).toBe(getModeId(unit5Manifest, topic58Start));
    expect(completion.nextModeId).not.toBe(getModeId(unit5Manifest, topic52Start));
    expect(platform.currentMode).toBe(getModeId(unit5Manifest, topic58Start));
    expect(platform.currentMode).not.toBe(getModeId(unit5Manifest, topic52Start));
  });

  test('mode 2 gold unlocks mode 3 but does not leak to later modes', () => {
    const engine = createEngine();
    const mode1Id = getModeId(unit5Manifest, 1);
    const mode2Id = getModeId(unit5Manifest, 2);
    const mode3Id = getModeId(unit5Manifest, 3);
    const mode4Id = getModeId(unit5Manifest, 4);

    engine.loadCartridge(unit5Manifest);

    engine.recordResult(`field-${mode1Id}`, 'E', true);
    expect(engine.isModeUnlocked(mode2Id)).toBe(true);

    const setMode2 = engine.setTier(mode2Id);
    expect(setMode2).toBe(true);

    engine.recordResult(`field-${mode2Id}`, 'E', true);

    expect(engine.isModeUnlocked(mode3Id)).toBe(true);
    expect(engine.isModeUnlocked(mode4Id)).toBe(false);
    expect(engine.onTierUnlocked).toHaveBeenCalledWith(
      expect.objectContaining({ id: mode3Id })
    );
  });
});

describe('Progression: Edge Cases', () => {
  test('a tin star still records completion but does not unlock the next mode', async () => {
    const platform = await loadPlatformWithProgress(unit5Manifest, {
      activeModeNumber: 1
    });

    const completion = completeCurrentMode(platform, { penalties: 3 });

    expect(completion.result.isCorrect).toBe(true);
    expect(completion.state.starsPerMode[completion.completedModeId].tin).toBe(1);
    expect(completion.state.starCounts.tin).toBe(1);
    expect(completion.didAdvance).toBe(false);
    expect(platform.currentMode).toBe(getModeId(unit5Manifest, 1));
    expect(completion.state.unlockedTiers).not.toContain(getModeId(unit5Manifest, 2));
  });

  test('rapid back-to-back completions keep the mode index moving forward', async () => {
    const topic57Start = getModeNumberByPrefix(unit5Manifest, '5.7a');
    const platform = await loadPlatformWithProgress(unit5Manifest, {
      activeModeNumber: topic57Start
    });

    const firstCompletion = completeCurrentMode(platform);
    const secondCompletion = completeCurrentMode(platform);

    expect(firstCompletion.didAdvance).toBe(true);
    expect(firstCompletion.nextModeId).toBe(getModeId(unit5Manifest, topic57Start + 1));
    expect(secondCompletion.didAdvance).toBe(true);
    expect(secondCompletion.nextModeId).toBe(getModeId(unit5Manifest, topic57Start + 2));
    expect(platform.currentMode).toBe(getModeId(unit5Manifest, topic57Start + 2));
    expect(platform.gameEngine.getModeIndex(platform.currentMode)).toBe(topic57Start + 1);
  });

  test('cartridge switch preserves per-cartridge progress', () => {
    persistProgress(unit5Manifest, { activeModeNumber: 5 });
    persistProgress(lsrlManifest, { activeModeNumber: 2 });

    const engine = createEngine();

    engine.loadCartridge(unit5Manifest);
    expect(engine.currentTier).toBe(getModeId(unit5Manifest, 5));
    expect(engine.isModeUnlocked(getModeId(unit5Manifest, 5))).toBe(true);
    expect(engine.getModeGoldStars(getModeId(unit5Manifest, 4))).toBe(1);

    engine.loadCartridge(lsrlManifest);
    expect(engine.currentTier).toBe(getModeId(lsrlManifest, 2));
    expect(engine.isModeUnlocked(getModeId(lsrlManifest, 2))).toBe(true);
    expect(engine.getModeGoldStars(getModeId(lsrlManifest, 1))).toBe(1);

    engine.loadCartridge(unit5Manifest);
    expect(engine.currentTier).toBe(getModeId(unit5Manifest, 5));
    expect(engine.isModeUnlocked(getModeId(unit5Manifest, 5))).toBe(true);
    expect(engine.getModeGoldStars(getModeId(unit5Manifest, 4))).toBe(1);
  });
});

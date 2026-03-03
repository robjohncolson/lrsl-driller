import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../../platform/core/game-engine.js';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

function createProgressionEngine(cartridgeId = 'progression-floor-test') {
  const engine = new GameEngine({
    onStreakUpdate: vi.fn(),
    onStarEarned: vi.fn(),
    onTierUnlocked: vi.fn()
  });

  engine.modeOrder = ['l01', 'l02', 'l03', 'l04', 'l05', 'l06'];

  const tierRules = [
    { id: 'l01', unlockedBy: 'default' },
    { id: 'l02', unlockedBy: { gold: 1 } },
    { id: 'l03', unlockedBy: { gold: 1 } },
    { id: 'l04', unlockedBy: { gold: 1 } },
    { id: 'l05', unlockedBy: { gold: 1 } },
    { id: 'l06', unlockedBy: { gold: 3 } }
  ];

  engine.unlockRules = tierRules;
  engine.cartridgeId = cartridgeId;
  engine.storagePrefix = `driller_${cartridgeId}_`;
  engine.starsPerMode = {};

  engine.modeOrder.forEach((modeId) => {
    engine.starsPerMode[modeId] = { gold: 0, silver: 0, bronze: 0, tin: 0 };
  });

  engine.unlockedTiers = [];
  engine.currentTier = null;
  engine.checkUnlocks(tierRules);

  return { engine, tierRules };
}

describe('GameEngine progression floor', () => {
  let engine;
  let tierRules;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    ({ engine, tierRules } = createProgressionEngine());
  });

  it('setProgressionFloor sets floor index and current tier', () => {
    engine.setProgressionFloor('l04');

    expect(engine.progressionFloor).toBe(3);
    expect(engine.currentTier).toBe('l04');
  });

  it('clearProgressionFloor resets floor to null', () => {
    engine.setProgressionFloor('l04');
    engine.clearProgressionFloor();

    expect(engine.progressionFloor).toBe(null);
  });

  it('floor level unlocks unconditionally with no prior progress', () => {
    engine.setProgressionFloor('l04');
    engine.checkUnlocks(tierRules);

    expect(engine.isModeUnlocked('l01')).toBe(true);
    expect(engine.isModeUnlocked('l02')).toBe(false);
    expect(engine.isModeUnlocked('l03')).toBe(false);
    expect(engine.isModeUnlocked('l04')).toBe(true);
  });

  it('level above floor unlocks when previous has gold', () => {
    engine.setProgressionFloor('l04');
    engine.starsPerMode.l04.gold = 1;
    engine.checkUnlocks(tierRules);

    expect(engine.isModeUnlocked('l05')).toBe(true);
  });

  it('level above floor stays locked without gold on previous', () => {
    engine.setProgressionFloor('l04');
    engine.checkUnlocks(tierRules);

    expect(engine.isModeUnlocked('l05')).toBe(false);
  });

  it('capstone above floor still requires gold:3', () => {
    engine.setProgressionFloor('l04');
    engine.starsPerMode.l04.gold = 1;
    engine.starsPerMode.l05.gold = 2;
    engine.checkUnlocks(tierRules);

    expect(engine.isModeUnlocked('l06')).toBe(false);

    engine.starsPerMode.l05.gold = 3;
    engine.checkUnlocks(tierRules);

    expect(engine.isModeUnlocked('l06')).toBe(true);
  });

  it('floor coexists with earned progress below', () => {
    engine.starsPerMode.l01.gold = 1;
    engine.checkUnlocks(tierRules);
    engine.setProgressionFloor('l04');
    engine.checkUnlocks(tierRules);

    expect(engine.isModeUnlocked('l01')).toBe(true);
    expect(engine.isModeUnlocked('l02')).toBe(true);
    expect(engine.isModeUnlocked('l03')).toBe(false);
    expect(engine.isModeUnlocked('l04')).toBe(true);
  });

  it('no floor: sequential system unchanged', () => {
    engine.progressionFloor = null;
    engine.starsPerMode.l01.gold = 1;
    engine.recheckUnlocks();

    expect(engine.isModeUnlocked('l01')).toBe(true);
    expect(engine.isModeUnlocked('l02')).toBe(true);
    expect(engine.isModeUnlocked('l03')).toBe(false);
  });

  it('saveState persists floor, loadState restores it', () => {
    engine.setProgressionFloor('l04');
    engine.saveState();

    const { engine: reloadedEngine } = createProgressionEngine();
    reloadedEngine.progressionFloor = null;
    reloadedEngine.loadState();

    expect(reloadedEngine.progressionFloor).toBe(3);
  });

  it('resetProgress clears floor', () => {
    engine.setProgressionFloor('l04');
    engine.resetProgress();

    expect(engine.progressionFloor).toBe(null);
    expect(engine.unlockedTiers).toEqual(['l01']);
    expect(engine.currentTier).toBe('l01');
  });
});

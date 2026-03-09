import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildShareURL,
  parseQueryParams,
  restoreStateFromURL,
  updateURL
} from '../../platform/core/url-state.js';

const modes = [
  { id: 'l01', name: 'Level 1', unlockedBy: 'default' },
  { id: 'l02', name: 'Level 2', unlockedBy: { gold: 1 } },
  { id: 'l03', name: 'Level 3', unlockedBy: { gold: 1 } },
  { id: 'l04', name: 'Level 4', unlockedBy: { gold: 2 } }
];

function createState(completedModeIds = []) {
  const starsPerMode = {};
  for (const mode of completedModeIds) {
    starsPerMode[mode] = { gold: 2, silver: 0, bronze: 0, tin: 0 };
  }

  return {
    starsPerMode,
    unlockedTiers: ['l01', ...completedModeIds.filter((modeId) => modeId !== 'l01')]
  };
}

describe('url-state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses cartridge and numeric mode params', () => {
    expect(parseQueryParams('?cartridge=cartridge-a&mode=3')).toEqual({
      cartridge: 'cartridge-a',
      mode: 3,
      level: null,
      start: null,
      hasMode: true,
      hasLevel: false,
      hasStart: false
    });
  });

  it('resolves mode links to the requested mode with forced access', () => {
    const parsed = parseQueryParams('?cartridge=cartridge-a&mode=3');
    const resolution = restoreStateFromURL(parsed, {
      modes,
      state: createState(['l01', 'l02']),
      currentMode: 'l01',
      getRequiredGold: (modeId) => modes.find((mode) => mode.id === modeId)?.unlockedBy?.gold ?? 0
    });

    expect(resolution.modeId).toBe('l03');
    expect(resolution.modeNumber).toBe(3);
    expect(resolution.forceAccess).toBe(true);
    expect(resolution.progressionFloorModeId).toBe('l03');
    expect(resolution.wasRedirected).toBe(false);
  });

  it('grants direct access to locked modes via URL (no redirect)', () => {
    const parsed = parseQueryParams('?cartridge=cartridge-a&mode=4');
    const resolution = restoreStateFromURL(parsed, {
      modes,
      state: {
        starsPerMode: {
          l01: { gold: 1 },
          l02: { gold: 1 }
        },
        unlockedTiers: ['l01', 'l02', 'l03']
      },
      currentMode: 'l01',
      getRequiredGold: (modeId) => modes.find((mode) => mode.id === modeId)?.unlockedBy?.gold ?? 0
    });

    expect(resolution.modeId).toBe('l04');
    expect(resolution.modeNumber).toBe(4);
    expect(resolution.forceAccess).toBe(true);
    expect(resolution.progressionFloorModeId).toBe('l04');
    expect(resolution.showNotification).toBe(true);
    expect(resolution.wasRedirected).toBe(false);
  });

  it('mode links for already-unlocked modes do not show notification', () => {
    const parsed = parseQueryParams('?cartridge=cartridge-a&mode=2');
    const resolution = restoreStateFromURL(parsed, {
      modes,
      state: createState(['l01', 'l02']),
      currentMode: 'l01',
      isTeacher: false
    });

    expect(resolution.modeId).toBe('l02');
    expect(resolution.forceAccess).toBe(true);
    expect(resolution.showNotification).toBe(false);
  });

  it('returns direct level links as forced-access mode selections', () => {
    const parsed = parseQueryParams('?cartridge=cartridge-a&level=l04');
    const resolution = restoreStateFromURL(parsed, {
      modes,
      state: createState(['l01']),
      currentMode: 'l01',
      isTeacher: false
    });

    expect(resolution.modeId).toBe('l04');
    expect(resolution.modeNumber).toBe(4);
    expect(resolution.forceAccess).toBe(true);
    expect(resolution.progressionFloorModeId).toBe('l04');
    expect(resolution.showNotification).toBe(true);
  });

  it('returns direct start links as forced-access mode selections', () => {
    const parsed = parseQueryParams('?cartridge=cartridge-a&start=2');
    const resolution = restoreStateFromURL(parsed, {
      modes,
      state: createState(['l01']),
      currentMode: 'l01'
    });

    expect(resolution.modeId).toBe('l03');
    expect(resolution.modeNumber).toBe(3);
    expect(resolution.forceAccess).toBe(true);
    expect(resolution.progressionFloorModeId).toBe('l03');
  });

  it('updates the browser URL with canonical cartridge and mode params', () => {
    const history = { replaceState: vi.fn() };
    const location = new URL('https://example.test/platform/app.html?c=short&level=l04');
    const updated = updateURL('cartridge-a', 4, { location, history });

    expect(updated).toBe('https://example.test/platform/app.html?cartridge=cartridge-a&mode=4');
    expect(history.replaceState).toHaveBeenCalledWith(
      {},
      '',
      'https://example.test/platform/app.html?cartridge=cartridge-a&mode=4'
    );
  });

  it('builds share URLs from the current page origin and path', () => {
    const shareUrl = buildShareURL('cartridge-a', 2, {
      location: new URL('https://example.test/platform/app.html?mode=99')
    });

    expect(shareUrl).toBe('https://example.test/platform/app.html?cartridge=cartridge-a&mode=2');
  });
});

function getLocationValue(locationOverride = null) {
  const locationLike =
    locationOverride ??
    globalThis.window?.location ??
    globalThis.location ??
    null;

  if (!locationLike) {
    return null;
  }

  if (locationLike instanceof URL) {
    return new URL(locationLike.toString());
  }

  if (typeof locationLike === 'string') {
    return new URL(locationLike);
  }

  if (typeof locationLike.href === 'string') {
    return new URL(locationLike.href);
  }

  return new URL(String(locationLike));
}

function parseIntegerParam(rawValue, { min = 1 } = {}) {
  if (rawValue == null || rawValue === '') {
    return null;
  }

  const value = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(value) || value < min) {
    return null;
  }

  return value;
}

function getDefaultRequiredGold(modeId, modes) {
  const mode = modes.find((entry) => entry.id === modeId);
  if (!mode || mode.unlockedBy === 'default') {
    return 0;
  }

  return mode.unlockedBy?.gold ?? 1;
}

export function parseQueryParams(search = null) {
  const resolvedSearch =
    typeof search === 'string'
      ? search
      : getLocationValue(search)?.search ?? '';

  const params = new URLSearchParams(resolvedSearch);
  const rawMode = params.get('mode');
  const rawStart = params.get('start');

  return {
    cartridge: params.get('cartridge') || params.get('c'),
    mode: parseIntegerParam(rawMode, { min: 1 }),
    level: params.get('level'),
    start: parseIntegerParam(rawStart, { min: 0 }),
    hasMode: params.has('mode'),
    hasLevel: params.has('level'),
    hasStart: params.has('start')
  };
}

export function getModeIdFromNumber(modeNumber, modes = []) {
  if (!Number.isInteger(modeNumber) || modeNumber < 1) {
    return null;
  }

  return modes[modeNumber - 1]?.id ?? null;
}

export function getModeNumber(modeId, modes = []) {
  const index = modes.findIndex((mode) => mode.id === modeId);
  return index >= 0 ? index + 1 : null;
}

export function findFirstIncompletePrerequisite(
  requestedModeNumber,
  {
    modes = [],
    state = {},
    getRequiredGold = (modeId) => getDefaultRequiredGold(modeId, modes)
  } = {}
) {
  if (!Number.isInteger(requestedModeNumber) || requestedModeNumber <= 1) {
    return null;
  }

  for (let currentModeNumber = 1; currentModeNumber < requestedModeNumber; currentModeNumber++) {
    const currentModeId = getModeIdFromNumber(currentModeNumber, modes);
    const nextModeId = getModeIdFromNumber(currentModeNumber + 1, modes);

    if (!currentModeId || !nextModeId) {
      return null;
    }

    const earnedGold = state?.starsPerMode?.[currentModeId]?.gold ?? 0;
    const requiredGold = Number(getRequiredGold(nextModeId) ?? 0);

    if (earnedGold < requiredGold) {
      return currentModeId;
    }
  }

  return null;
}

export function restoreStateFromURL(
  parsedQuery,
  {
    modes = [],
    state = {},
    currentMode = null,
    isTeacher = false,
    getRequiredGold = (modeId) => getDefaultRequiredGold(modeId, modes)
  } = {}
) {
  const fallbackModeId = currentMode ?? modes[0]?.id ?? null;
  const fallbackModeNumber = getModeNumber(fallbackModeId, modes);
  const parsed = parsedQuery ?? {};

  if (!modes.length) {
    return {
      modeId: null,
      modeNumber: null,
      forceAccess: false,
      progressionFloorModeId: null,
      showNotification: false,
      source: 'empty',
      isValidRequest: false,
      shouldUpdateURL: false,
      wasRedirected: false
    };
  }

  if (parsed.hasLevel || parsed.hasStart) {
    let targetMode = null;

    if (parsed.hasLevel) {
      targetMode = modes.find((mode) => mode.id === parsed.level) ?? null;
    } else if (parsed.start != null) {
      targetMode = modes[parsed.start] ?? null;
    }

    if (!targetMode) {
      return {
        modeId: fallbackModeId,
        modeNumber: fallbackModeNumber,
        forceAccess: false,
        progressionFloorModeId: null,
        showNotification: false,
        source: parsed.hasLevel ? 'invalid-level' : 'invalid-start',
        isValidRequest: false,
        shouldUpdateURL: true,
        wasRedirected: false
      };
    }

    const studentUnlocked =
      targetMode.unlockedBy === 'default' ||
      state?.unlockedTiers?.includes(targetMode.id);

    return {
      modeId: targetMode.id,
      modeNumber: getModeNumber(targetMode.id, modes),
      forceAccess: true,
      progressionFloorModeId: targetMode.id,
      showNotification: !isTeacher && !studentUnlocked,
      source: parsed.hasLevel ? 'level' : 'start',
      isValidRequest: true,
      shouldUpdateURL: true,
      wasRedirected: false
    };
  }

  if (parsed.hasMode) {
    const requestedModeId = getModeIdFromNumber(parsed.mode, modes);
    if (!requestedModeId) {
      return {
        modeId: fallbackModeId,
        modeNumber: fallbackModeNumber,
        forceAccess: false,
        progressionFloorModeId: null,
        showNotification: false,
        source: 'invalid-mode',
        isValidRequest: false,
        shouldUpdateURL: true,
        wasRedirected: false
      };
    }

    // Direct URL is the authorization — bypass progression gating
    const requestedMode = modes.find((m) => m.id === requestedModeId);
    const studentUnlocked =
      requestedMode?.unlockedBy === 'default' ||
      state?.unlockedTiers?.includes(requestedModeId);

    return {
      modeId: requestedModeId,
      modeNumber: parsed.mode,
      forceAccess: true,
      progressionFloorModeId: requestedModeId,
      showNotification: !isTeacher && !studentUnlocked,
      source: 'mode',
      isValidRequest: true,
      shouldUpdateURL: true,
      wasRedirected: false
    };
  }

  return {
    modeId: fallbackModeId,
    modeNumber: fallbackModeNumber,
    forceAccess: false,
    progressionFloorModeId: null,
    showNotification: false,
    source: 'default',
    isValidRequest: true,
    shouldUpdateURL: true,
    wasRedirected: false
  };
}

export function resolveInitialMode(requestedModeNumber, options = {}) {
  return restoreStateFromURL(
    {
      mode: requestedModeNumber,
      hasMode: requestedModeNumber != null,
      hasLevel: false,
      hasStart: false,
      level: null,
      start: null
    },
    options
  );
}

export function buildShareURL(cartridgeId, modeNumber, { location = null } = {}) {
  const currentUrl =
    getLocationValue(location) ??
    new URL('https://example.test/platform/app.html');

  const url = new URL(currentUrl.pathname, currentUrl.origin);
  if (cartridgeId) {
    url.searchParams.set('cartridge', cartridgeId);
  }

  if (modeNumber != null) {
    url.searchParams.set('mode', String(modeNumber));
  }

  return url.toString();
}

export function updateURL(
  cartridgeId,
  modeNumber,
  {
    location = null,
    history = globalThis.window?.history ?? globalThis.history ?? null
  } = {}
) {
  const currentUrl =
    getLocationValue(location) ??
    new URL('https://example.test/platform/app.html');

  const url = new URL(currentUrl.toString());

  if (cartridgeId) {
    url.searchParams.set('cartridge', cartridgeId);
  } else {
    url.searchParams.delete('cartridge');
  }

  if (modeNumber != null) {
    url.searchParams.set('mode', String(modeNumber));
  } else {
    url.searchParams.delete('mode');
  }

  url.searchParams.delete('c');
  url.searchParams.delete('level');
  url.searchParams.delete('start');

  if (history?.replaceState) {
    history.replaceState({}, '', url.toString());
  }

  return url.toString();
}

export default {
  buildShareURL,
  findFirstIncompletePrerequisite,
  getModeIdFromNumber,
  getModeNumber,
  parseQueryParams,
  resolveInitialMode,
  restoreStateFromURL,
  updateURL
};

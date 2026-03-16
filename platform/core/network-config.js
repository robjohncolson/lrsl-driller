export const DEFAULT_SERVER_URL = 'https://lrsl-driller-production.up.railway.app';
export const DEFAULT_SERVER_DETECT_TIMEOUT_MS = 2500;

export function toWebSocketUrl(url) {
  return url.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
}

export function isPrivateHostname(hostname = '') {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return true;
  }
  if (hostname.endsWith('.local')) return true;
  if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;

  const private172 = hostname.match(/^172\.(\d+)\.\d+\.\d+$/);
  return !!private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31;
}

export function canUseLocalSignaling(locationLike) {
  return isPrivateHostname(locationLike?.hostname || '');
}

export function getLocalSignalingUrl(locationLike) {
  const wsProtocol = locationLike?.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${locationLike.host}/ws-signaling`;
}

export async function detectNetworkConfig({
  defaultServerUrl = DEFAULT_SERVER_URL,
  fetchFn = fetch,
  locationLike = window.location,
  timeoutMs = DEFAULT_SERVER_DETECT_TIMEOUT_MS
} = {}) {
  const remoteConfig = {
    serverUrl: defaultServerUrl,
    signalingUrl: toWebSocketUrl(defaultServerUrl),
    usedLocalSignaling: false
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(defaultServerUrl, {
      signal: controller.signal,
      method: 'HEAD'
    });

    if (response.ok || response.status === 404) {
      return remoteConfig;
    }
  } catch {
    // Fall through to local-signaling decision below.
  } finally {
    clearTimeout(timeout);
  }

  if (canUseLocalSignaling(locationLike)) {
    return {
      serverUrl: defaultServerUrl,
      signalingUrl: getLocalSignalingUrl(locationLike),
      usedLocalSignaling: true
    };
  }

  return remoteConfig;
}

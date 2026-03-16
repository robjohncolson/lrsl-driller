import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SERVER_URL,
  canUseLocalSignaling,
  detectNetworkConfig,
  getLocalSignalingUrl,
  toWebSocketUrl
} from '../../platform/core/network-config.js';

describe('network-config', () => {
  it('converts HTTP(S) URLs to WebSocket URLs', () => {
    expect(toWebSocketUrl('https://example.test')).toBe('wss://example.test');
    expect(toWebSocketUrl('http://localhost:5173')).toBe('ws://localhost:5173');
  });

  it('only allows local signaling on private/dev hosts', () => {
    expect(canUseLocalSignaling({ hostname: 'localhost' })).toBe(true);
    expect(canUseLocalSignaling({ hostname: '192.168.1.23' })).toBe(true);
    expect(canUseLocalSignaling({ hostname: 'app.vercel.app' })).toBe(false);
  });

  it('keeps the Railway API URL when local signaling is selected', async () => {
    const config = await detectNetworkConfig({
      defaultServerUrl: DEFAULT_SERVER_URL,
      fetchFn: async () => {
        throw new Error('timeout');
      },
      locationLike: {
        protocol: 'http:',
        host: '192.168.1.25:5173',
        hostname: '192.168.1.25'
      },
      timeoutMs: 10
    });

    expect(config.serverUrl).toBe(DEFAULT_SERVER_URL);
    expect(config.usedLocalSignaling).toBe(true);
    expect(config.signalingUrl).toBe(getLocalSignalingUrl({
      protocol: 'http:',
      host: '192.168.1.25:5173'
    }));
  });

  it('does not fall back to insecure same-host signaling on public HTTPS hosts', async () => {
    const config = await detectNetworkConfig({
      defaultServerUrl: DEFAULT_SERVER_URL,
      fetchFn: async () => {
        throw new Error('timeout');
      },
      locationLike: {
        protocol: 'https:',
        host: 'lrsl-driller.vercel.app',
        hostname: 'lrsl-driller.vercel.app'
      },
      timeoutMs: 10
    });

    expect(config.serverUrl).toBe(DEFAULT_SERVER_URL);
    expect(config.usedLocalSignaling).toBe(false);
    expect(config.signalingUrl).toBe('wss://lrsl-driller-production.up.railway.app');
  });

  it('uses remote signaling when Railway responds before timeout', async () => {
    const config = await detectNetworkConfig({
      defaultServerUrl: DEFAULT_SERVER_URL,
      fetchFn: async () => ({ ok: true, status: 200 }),
      locationLike: {
        protocol: 'http:',
        host: 'localhost:5173',
        hostname: 'localhost'
      },
      timeoutMs: 10
    });

    expect(config.usedLocalSignaling).toBe(false);
    expect(config.signalingUrl).toBe('wss://lrsl-driller-production.up.railway.app');
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssetResolver } from '../../platform/core/asset-resolver.js';
import { AssetCache } from '../../platform/core/asset-cache.js';

// Mock URL.createObjectURL / revokeObjectURL
let blobUrlCounter = 0;
beforeEach(() => {
  blobUrlCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(() => `blob:mock-${++blobUrlCounter}`);
  globalThis.URL.revokeObjectURL = vi.fn();
});

// Mock fetch
let fetchResponses;
beforeEach(() => {
  fetchResponses = {};
  globalThis.fetch = vi.fn(async (url) => {
    const resp = fetchResponses[url];
    if (resp) {
      return { ok: true, blob: async () => resp };
    }
    return { ok: false };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AssetResolver', () => {
  let cache;
  let resolver;

  beforeEach(() => {
    cache = new AssetCache();
    resolver = new AssetResolver(cache);
  });

  describe('resolve', () => {
    it('returns null for missing path or cartridgeId', async () => {
      expect(await resolver.resolve(null, 'assets/foo.mp4')).toBeNull();
      expect(await resolver.resolve('cart1', null)).toBeNull();
      expect(await resolver.resolve('cart1', '')).toBeNull();
    });

    it('returns cached blob URL on second call', async () => {
      const blob = new Blob(['video data'], { type: 'video/mp4' });
      fetchResponses['https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart1/Foo.mp4'] = blob;

      const url1 = await resolver.resolve('cart1', 'assets/Foo.mp4');
      expect(url1).toBe('blob:mock-1');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const url2 = await resolver.resolve('cart1', 'assets/Foo.mp4');
      expect(url2).toBe('blob:mock-1');
      // No additional fetch calls
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('fetches from Supabase when useSupabase is true', async () => {
      const blob = new Blob(['supabase'], { type: 'video/mp4' });
      fetchResponses['https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart1/Video.mp4'] = blob;

      const url = await resolver.resolve('cart1', 'assets/Video.mp4');
      expect(url).toBe('blob:mock-1');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart1/Video.mp4'
      );
    });

    it('falls back to local path when Supabase fails', async () => {
      const blob = new Blob(['local'], { type: 'video/mp4' });
      fetchResponses['/cartridges/cart1/assets/Video.mp4'] = blob;

      const url = await resolver.resolve('cart1', 'assets/Video.mp4');
      expect(url).toBe('blob:mock-1');
      // First tried Supabase (failed), then local
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('falls back to GitHub when Supabase and local fail', async () => {
      const blob = new Blob(['github'], { type: 'video/mp4' });
      fetchResponses['https://raw.githubusercontent.com/robjohncolson/lrsl-driller/main/cartridges/cart1/assets/Video.mp4'] = blob;

      const url = await resolver.resolve('cart1', 'assets/Video.mp4');
      expect(url).toBe('blob:mock-1');
      // Supabase (fail), local (fail), GitHub (success)
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    it('returns null when all tiers fail', async () => {
      const url = await resolver.resolve('cart1', 'assets/Nonexistent.mp4');
      expect(url).toBeNull();
      // Supabase, local, GitHub — all failed
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    it('skips Supabase when useSupabase is false', async () => {
      resolver.setUseSupabase(false);
      const blob = new Blob(['local'], { type: 'video/mp4' });
      fetchResponses['/cartridges/cart1/assets/Video.mp4'] = blob;

      const url = await resolver.resolve('cart1', 'assets/Video.mp4');
      expect(url).toBe('blob:mock-1');
      // Only local and (if needed) GitHub, no Supabase
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(globalThis.fetch).toHaveBeenCalledWith('/cartridges/cart1/assets/Video.mp4');
    });
  });

  describe('deduplication', () => {
    it('deduplicates concurrent requests for the same file', async () => {
      let resolveBlob;
      const blobPromise = new Promise(r => { resolveBlob = r; });

      globalThis.fetch = vi.fn(async () => {
        const blob = await blobPromise;
        return { ok: true, blob: async () => blob };
      });

      const p1 = resolver.resolve('cart1', 'assets/Slow.mp4');
      const p2 = resolver.resolve('cart1', 'assets/Slow.mp4');

      resolveBlob(new Blob(['slow video']));

      const [url1, url2] = await Promise.all([p1, p2]);
      expect(url1).toBe(url2);
      // Only one fetch was made
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('preloadCartridge', () => {
    it('preloads all unique animation paths from manifest', async () => {
      const blob = new Blob(['vid']);
      fetchResponses['https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart1/A.mp4'] = blob;
      fetchResponses['https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart1/B.mp4'] = blob;

      const manifest = {
        modes: {
          m1: { animation: 'assets/A.mp4' },
          m2: { animation: 'assets/B.mp4' },
          m3: { animation: 'assets/A.mp4' }, // duplicate
          m4: {} // no animation
        }
      };

      const progress = vi.fn();
      await resolver.preloadCartridge(manifest, 'cart1', progress);

      // Only 2 unique animations
      expect(progress).toHaveBeenCalledTimes(2);
      expect(progress).toHaveBeenCalledWith(1, 2);
      expect(progress).toHaveBeenCalledWith(2, 2);

      // Both are now cached
      expect(cache.has('cart1/A.mp4')).toBe(true);
      expect(cache.has('cart1/B.mp4')).toBe(true);
    });

    it('handles manifest with no modes', async () => {
      await resolver.preloadCartridge({}, 'cart1');
      await resolver.preloadCartridge(null, 'cart1');
      // No errors, no fetches
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('_notifyHave', () => {
    it('sends asset_have via WebSocket when connected', async () => {
      const mockWs = {
        isConnected: () => true,
        send: vi.fn()
      };
      resolver.setWebSocketClient(mockWs);

      const blob = new Blob(['data']);
      fetchResponses['https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart1/V.mp4'] = blob;

      await resolver.resolve('cart1', 'assets/V.mp4');

      expect(mockWs.send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'asset_have',
        fileKey: 'cart1/V.mp4'
      }));
    });

    it('does not send when WebSocket is disconnected', async () => {
      const mockWs = {
        isConnected: () => false,
        send: vi.fn()
      };
      resolver.setWebSocketClient(mockWs);

      const blob = new Blob(['data']);
      fetchResponses['https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations/cart1/V.mp4'] = blob;

      await resolver.resolve('cart1', 'assets/V.mp4');
      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AssetCache } from '../../platform/core/asset-cache.js';

// Mock URL.createObjectURL / revokeObjectURL
let blobUrlCounter = 0;
const originalCreateObjectURL = globalThis.URL?.createObjectURL;
const originalRevokeObjectURL = globalThis.URL?.revokeObjectURL;

beforeEach(() => {
  blobUrlCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(() => `blob:mock-${++blobUrlCounter}`);
  globalThis.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  if (originalCreateObjectURL) globalThis.URL.createObjectURL = originalCreateObjectURL;
  if (originalRevokeObjectURL) globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
});

describe('AssetCache', () => {
  describe('fileKey', () => {
    it('strips assets/ prefix and joins with cartridge ID', () => {
      expect(AssetCache.fileKey('apstats-u5', 'assets/Foo.mp4'))
        .toBe('apstats-u5/Foo.mp4');
    });

    it('handles paths without assets/ prefix', () => {
      expect(AssetCache.fileKey('cart1', 'Bar.mp4'))
        .toBe('cart1/Bar.mp4');
    });

    it('handles nested assets/ path', () => {
      expect(AssetCache.fileKey('cart1', 'assets/sub/video.mp4'))
        .toBe('cart1/sub/video.mp4');
    });
  });

  describe('put / get / has', () => {
    it('stores a blob and returns a blob URL', async () => {
      const cache = new AssetCache();
      const blob = new Blob(['test'], { type: 'video/mp4' });
      const url = await cache.put('cart/file.mp4', blob);

      expect(url).toBe('blob:mock-1');
      expect(cache.has('cart/file.mp4')).toBe(true);
      expect(cache.get('cart/file.mp4')).toBe('blob:mock-1');
    });

    it('returns null for uncached files', () => {
      const cache = new AssetCache();
      expect(cache.has('nope')).toBe(false);
      expect(cache.get('nope')).toBeNull();
    });
  });

  describe('getBlob', () => {
    it('returns the stored blob', async () => {
      const cache = new AssetCache();
      const blob = new Blob(['hello'], { type: 'video/mp4' });
      await cache.put('key', blob);
      expect(cache.getBlob('key')).toBe(blob);
    });

    it('returns null for missing key', () => {
      const cache = new AssetCache();
      expect(cache.getBlob('nope')).toBeNull();
    });
  });

  describe('computeHash', () => {
    it('computes a hex SHA-256 hash', async () => {
      const cache = new AssetCache();
      const blob = new Blob(['hello world']);
      const hash = await cache.computeHash(blob);
      // SHA-256 of "hello world"
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('returns null when crypto.subtle is unavailable', async () => {
      const cache = new AssetCache();
      const originalDigest = crypto.subtle.digest;
      crypto.subtle.digest = () => { throw new Error('not supported'); };
      const hash = await cache.computeHash(new Blob(['test']));
      expect(hash).toBeNull();
      crypto.subtle.digest = originalDigest;
    });
  });

  describe('getHash', () => {
    it('returns the hash after put', async () => {
      const cache = new AssetCache();
      const blob = new Blob(['test data']);
      await cache.put('key', blob);
      const hash = cache.getHash('key');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('returns null for missing key', () => {
      const cache = new AssetCache();
      expect(cache.getHash('nope')).toBeNull();
    });
  });

  describe('getInventory', () => {
    it('lists all cached file keys', async () => {
      const cache = new AssetCache();
      await cache.put('a/1.mp4', new Blob(['a']));
      await cache.put('b/2.mp4', new Blob(['b']));
      expect(cache.getInventory()).toEqual(['a/1.mp4', 'b/2.mp4']);
    });

    it('returns empty array when cache is empty', () => {
      const cache = new AssetCache();
      expect(cache.getInventory()).toEqual([]);
    });
  });

  describe('revokeBlobUrls', () => {
    it('revokes all blob URLs and clears the cache', async () => {
      const cache = new AssetCache();
      await cache.put('a', new Blob(['a']));
      await cache.put('b', new Blob(['b']));

      cache.revokeBlobUrls();

      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
      expect(cache.has('a')).toBe(false);
      expect(cache.has('b')).toBe(false);
      expect(cache.getInventory()).toEqual([]);
    });
  });
});

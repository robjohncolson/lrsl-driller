/**
 * Asset Cache - In-memory blob cache with optional Cache API backing
 *
 * Stores downloaded animation videos as blobs so they aren't re-fetched
 * within the same session. Optionally uses the Cache API for persistence
 * across page reloads (degrades gracefully to memory-only).
 */

const CACHE_NAME = 'driller-assets-v1';

export class AssetCache {
  constructor() {
    this._memory = new Map();       // Map<fileKey, { blob, blobUrl, hash }>
    this._cacheApi = null;          // Cache object (if available)
    this._cacheApiReady = false;
    this._initCacheApi();
  }

  async _initCacheApi() {
    try {
      if (typeof caches !== 'undefined') {
        this._cacheApi = await caches.open(CACHE_NAME);
        this._cacheApiReady = true;
      }
    } catch {
      // Cache API unavailable (file://, restricted context, etc.)
    }
  }

  /**
   * Build a canonical file key from cartridge ID and asset path.
   * e.g. fileKey('apstats-u5', 'assets/Foo.mp4') → 'apstats-u5/Foo.mp4'
   */
  static fileKey(cartridgeId, path) {
    const filename = path.replace(/^assets\//, '');
    return `${cartridgeId}/${filename}`;
  }

  /**
   * Compute SHA-256 hash of a blob for integrity verification.
   */
  async computeHash(blob) {
    try {
      const buffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return null;
    }
  }

  /**
   * Check if a file is cached (memory only — instant).
   */
  has(fileKey) {
    return this._memory.has(fileKey);
  }

  /**
   * Get a cached blob URL. Returns null if not cached.
   */
  get(fileKey) {
    const entry = this._memory.get(fileKey);
    return entry ? entry.blobUrl : null;
  }

  /**
   * Get the hash for a cached file, or null.
   */
  getHash(fileKey) {
    const entry = this._memory.get(fileKey);
    return entry ? entry.hash : null;
  }

  /**
   * Get the raw blob for a cached file, or null.
   */
  getBlob(fileKey) {
    const entry = this._memory.get(fileKey);
    return entry ? entry.blob : null;
  }

  /**
   * Store a blob in the cache. Computes hash and creates a blob URL.
   * Returns the blob URL.
   */
  async put(fileKey, blob) {
    const hash = await this.computeHash(blob);
    const blobUrl = URL.createObjectURL(blob);
    this._memory.set(fileKey, { blob, blobUrl, hash });

    // Best-effort Cache API write
    if (this._cacheApiReady && this._cacheApi) {
      try {
        const fakeUrl = `/_asset_cache_/${fileKey}`;
        const response = new Response(blob, {
          headers: { 'X-Asset-Hash': hash || '' }
        });
        await this._cacheApi.put(fakeUrl, response);
      } catch {
        // Ignore Cache API write failures
      }
    }

    return blobUrl;
  }

  /**
   * Try to restore a file from the Cache API into memory.
   * Returns the blob URL if found, null otherwise.
   */
  async restore(fileKey) {
    if (this.has(fileKey)) return this.get(fileKey);
    if (!this._cacheApiReady || !this._cacheApi) return null;

    try {
      const fakeUrl = `/_asset_cache_/${fileKey}`;
      const response = await this._cacheApi.match(fakeUrl);
      if (!response) return null;

      const blob = await response.blob();
      const hash = response.headers.get('X-Asset-Hash') || await this.computeHash(blob);
      const blobUrl = URL.createObjectURL(blob);
      this._memory.set(fileKey, { blob, blobUrl, hash });
      return blobUrl;
    } catch {
      return null;
    }
  }

  /**
   * List all file keys currently in memory cache.
   */
  getInventory() {
    return Array.from(this._memory.keys());
  }

  /**
   * Revoke all blob URLs. Call on page unload to free memory.
   */
  revokeBlobUrls() {
    for (const entry of this._memory.values()) {
      try {
        URL.revokeObjectURL(entry.blobUrl);
      } catch {
        // Ignore
      }
    }
    this._memory.clear();
  }
}

export default AssetCache;

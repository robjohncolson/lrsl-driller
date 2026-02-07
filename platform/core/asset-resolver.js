/**
 * Asset Resolver - Multi-tier video URL resolution with deduplication
 *
 * Fetch hierarchy:
 *   1. Session cache (in-memory blob)      — instant
 *   2. LAN peer via WebRTC data channel    — milliseconds (Phase 3)
 *   3. Railway-coordinated Supabase fetch  — one fetch, swarm seeds (Phase 2)
 *   4. GitHub raw fallback                 — always works, no server needed
 *
 * Deduplicates concurrent requests for the same file (single in-flight fetch).
 */

import { AssetCache } from './asset-cache.js';

const SUPABASE_VIDEO_BASE = 'https://hgvnytaqmuybzbotosyj.supabase.co/storage/v1/object/public/videos/animations';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/robjohncolson/lrsl-driller/main/cartridges';

export class AssetResolver {
  constructor(assetCache, options = {}) {
    this._cache = assetCache;
    this._inflight = new Map();   // Map<fileKey, Promise<string|null>>
    this._peerManager = null;     // P2PAssetTransfer (Phase 3)
    this._wsClient = null;        // WebSocketClient (Phase 2)
    this._useSupabase = options.useSupabase ?? true;
    this._onAssetAcquired = options.onAssetAcquired || (() => {}); // called with fileKey after download
  }

  /**
   * Wire in P2P peer manager (Phase 3).
   */
  setPeerManager(peerManager) {
    this._peerManager = peerManager;
  }

  /**
   * Wire in WebSocket client for coordination (Phase 2).
   */
  setWebSocketClient(wsClient) {
    this._wsClient = wsClient;
  }

  /**
   * Update Supabase toggle at runtime.
   */
  setUseSupabase(useSupabase) {
    this._useSupabase = useSupabase;
  }

  /**
   * Resolve a video asset to a playable URL (blob URL from cache, or fetched).
   * Returns a blob URL string, or null if all tiers fail.
   *
   * Deduplicates: concurrent calls for the same file share one fetch.
   */
  async resolve(cartridgeId, animationPath) {
    if (!animationPath || !cartridgeId) return null;

    const fileKey = AssetCache.fileKey(cartridgeId, animationPath);

    // Tier 1: Session cache (instant)
    if (this._cache.has(fileKey)) {
      console.log(`[AssetResolver] HIT session cache: ${fileKey}`);
      return this._cache.get(fileKey);
    }

    // Try Cache API restore
    const restored = await this._cache.restore(fileKey);
    if (restored) {
      console.log(`[AssetResolver] HIT Cache API: ${fileKey}`);
      return restored;
    }

    // Deduplicate concurrent requests
    if (this._inflight.has(fileKey)) {
      return this._inflight.get(fileKey);
    }

    const promise = this._fetchThroughTiers(cartridgeId, animationPath, fileKey);
    this._inflight.set(fileKey, promise);

    try {
      return await promise;
    } finally {
      this._inflight.delete(fileKey);
    }
  }

  /**
   * Walk through fetch tiers until one succeeds.
   */
  async _fetchThroughTiers(cartridgeId, animationPath, fileKey) {
    const filename = animationPath.replace(/^assets\//, '');

    console.log(`[AssetResolver] MISS cache, fetching: ${fileKey}`);

    // Tier 2: P2P peer transfer (Phase 3 — skipped if no peer manager)
    if (this._peerManager && this._wsClient) {
      try {
        const blobUrl = await this._coordinatedFetch(fileKey, cartridgeId, filename);
        if (blobUrl) {
          console.log(`[AssetResolver] GOT via coordinated/P2P: ${fileKey}`);
          return blobUrl;
        }
      } catch (err) {
        console.warn('[AssetResolver] Coordinated/P2P fetch failed, falling through:', err.message);
      }
    }

    // Tier 3: Direct Supabase fetch
    if (this._useSupabase) {
      const supabaseUrl = `${SUPABASE_VIDEO_BASE}/${cartridgeId}/${filename}`;
      const blob = await this._tryFetch(supabaseUrl);
      if (blob) {
        console.log(`[AssetResolver] GOT from Supabase: ${fileKey} (${(blob.size / 1024).toFixed(0)}KB)`);
        const blobUrl = await this._cache.put(fileKey, blob);
        this._notifyHave(fileKey);
        return blobUrl;
      }
    }

    // Tier 3b: Local dev path
    const localUrl = `/cartridges/${cartridgeId}/${animationPath}`;
    const localBlob = await this._tryFetch(localUrl);
    if (localBlob) {
      console.log(`[AssetResolver] GOT from local: ${fileKey} (${(localBlob.size / 1024).toFixed(0)}KB)`);
      const blobUrl = await this._cache.put(fileKey, localBlob);
      this._notifyHave(fileKey);
      return blobUrl;
    }

    // Tier 4: GitHub raw fallback
    const githubUrl = `${GITHUB_RAW_BASE}/${cartridgeId}/assets/${filename}`;
    const ghBlob = await this._tryFetch(githubUrl);
    if (ghBlob) {
      console.log(`[AssetResolver] GOT from GitHub: ${fileKey} (${(ghBlob.size / 1024).toFixed(0)}KB)`);
      const blobUrl = await this._cache.put(fileKey, ghBlob);
      this._notifyHave(fileKey);
      return blobUrl;
    }

    console.error(`[AssetResolver] All tiers failed for ${fileKey}`);
    return null;
  }

  /**
   * Phase 2: Coordinated fetch via Railway WebSocket.
   * Sends asset_need, waits for assignment or peer availability.
   * Returns blob URL or null.
   */
  async _coordinatedFetch(fileKey, cartridgeId, filename) {
    if (!this._wsClient?.isConnected()) return null;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        resolve(null); // Fall through to direct fetch
      }, 20000);

      const cleanup = () => {
        clearTimeout(timeout);
        if (this._wsClient) {
          this._wsClient._assetCallbacks?.delete(fileKey);
        }
      };

      // Register callback for this fileKey
      if (!this._wsClient._assetCallbacks) {
        this._wsClient._assetCallbacks = new Map();
      }

      this._wsClient._assetCallbacks.set(fileKey, async (msg) => {
        if (msg.type === 'asset_queued') {
          console.log(`[AssetResolver] QUEUED (position ${msg.position}): ${fileKey}`);
          return;
        }

        cleanup();

        if (msg.type === 'asset_fetch_assigned') {
          console.log(`[AssetResolver] ASSIGNED to fetch: ${fileKey}`);
          if (!this._useSupabase) {
            console.warn(`[AssetResolver] Assigned but Supabase disabled, falling through: ${fileKey}`);
            resolve(null);
            return;
          }
          const supabaseUrl = `${SUPABASE_VIDEO_BASE}/${cartridgeId}/${filename}`;
          const blob = await this._tryFetch(supabaseUrl);
          if (blob) {
            console.log(`[AssetResolver] FETCHED from Supabase (assigned): ${fileKey} (${(blob.size / 1024).toFixed(0)}KB)`);
            const blobUrl = await this._cache.put(fileKey, blob);
            this._notifyHave(fileKey);
            resolve(blobUrl);
          } else {
            console.warn(`[AssetResolver] Assigned fetch FAILED: ${fileKey}`);
            resolve(null);
          }
        } else if (msg.type === 'asset_available') {
          const peers = msg.peers || [];
          console.log(`[AssetResolver] PEERS available for ${fileKey}: [${peers.join(', ')}]`);
          if (this._peerManager && peers.length > 0) {
            const expectedHash = msg.hash || null;
            for (const peerUsername of peers) {
              try {
                console.log(`[AssetResolver] Requesting P2P from ${peerUsername}: ${fileKey}`);
                const blobUrl = await this._peerManager.requestFile(peerUsername, fileKey, expectedHash);
                if (blobUrl) {
                  console.log(`[AssetResolver] GOT via P2P from ${peerUsername}: ${fileKey}`);
                  this._notifyHave(fileKey);
                  resolve(blobUrl);
                  return;
                }
              } catch (err) {
                console.warn(`[AssetResolver] P2P from ${peerUsername} failed: ${err.message}`);
              }
            }
          }
          // P2P failed or no peers — direct fetch
          resolve(null);
        } else {
          resolve(null);
        }
      });

      this._wsClient.send({ type: 'asset_need', fileKey });
    });
  }

  /**
   * Notify Railway that we have a file (for peer registry).
   */
  _notifyHave(fileKey) {
    if (this._wsClient?.isConnected()) {
      const hash = this._cache.getHash(fileKey);
      this._wsClient.send({ type: 'asset_have', fileKey, hash });
      console.log(`[AssetResolver] Notified server: I have ${fileKey}`);
    }
    this._onAssetAcquired(fileKey);
  }

  /**
   * Fetch a URL and return the blob, or null on failure.
   */
  async _tryFetch(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  }

  /**
   * Preload all animation assets for a cartridge.
   * Calls onProgress(loaded, total) as each file completes.
   */
  async preloadCartridge(manifest, cartridgeId, onProgress) {
    if (!manifest?.modes) return;

    const animations = [];
    for (const mode of Object.values(manifest.modes)) {
      if (mode.animation) {
        animations.push(mode.animation);
      }
    }

    const unique = [...new Set(animations)];
    const total = unique.length;
    let loaded = 0;

    for (const animPath of unique) {
      await this.resolve(cartridgeId, animPath);
      loaded++;
      if (onProgress) onProgress(loaded, total);
    }
  }
}

export default AssetResolver;

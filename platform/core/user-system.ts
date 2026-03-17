/**
 * User System - Identity, authentication, and persistence
 * Handles username generation, login, IndexedDB storage, and teacher mode
 */

import Dexie from 'dexie';
import type { StarCounts, UserInfo, VerifyResult, CreateUserResult } from './types.js';

// ==================== Local Interfaces ====================

export interface UserIdentity {
  username: string;
  realName?: string | null;
  password?: string;
}

export interface Rank {
  name: string;
  minPoints: number;
  color: string;
  icon: string;
}

interface UserSystemConfig {
  serverUrl?: string | null;
  teacherPassword?: string;
  onUserChange?: (user: UserIdentity | null) => void;
}

interface UserStats {
  totalStars: StarCounts;
  totalAttempts: number;
  perfectRuns: number;
}

interface ProgressRecord {
  username?: string;
  completed_at: string;
  star_type?: keyof StarCounts;
  all_correct?: boolean;
  [key: string]: unknown;
}

// ==================== USERNAME GENERATOR ====================
const FRUITS: readonly string[] = [
  'Apple', 'Mango', 'Kiwi', 'Strawberry', 'Banana',
  'Orange', 'Grape', 'Peach', 'Cherry', 'Lemon',
  'Lime', 'Melon', 'Papaya', 'Coconut', 'Pineapple'
];

const ANIMALS: readonly string[] = [
  'Tiger', 'Bear', 'Wolf', 'Dolphin', 'Eagle',
  'Panda', 'Koala', 'Fox', 'Owl', 'Hawk',
  'Lion', 'Shark', 'Whale', 'Otter', 'Falcon'
];

export function generateUsername(): string {
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${fruit}_${animal}`;
}

/**
 * Get emoji avatar from username
 */
export function getAvatarForUsername(username: string): string {
  const fruitEmojis: Record<string, string> = {
    'Apple': '🍎', 'Mango': '🥭', 'Kiwi': '🥝', 'Strawberry': '🍓', 'Banana': '🍌',
    'Orange': '🍊', 'Grape': '🍇', 'Peach': '🍑', 'Cherry': '🍒', 'Lemon': '🍋',
    'Lime': '🍋', 'Melon': '🍈', 'Papaya': '🥭', 'Coconut': '🥥', 'Pineapple': '🍍'
  };
  const animalEmojis: Record<string, string> = {
    'Tiger': '🐯', 'Bear': '🐻', 'Wolf': '🐺', 'Dolphin': '🐬', 'Eagle': '🦅',
    'Panda': '🐼', 'Koala': '🐨', 'Fox': '🦊', 'Owl': '🦉', 'Hawk': '🦅',
    'Lion': '🦁', 'Shark': '🦈', 'Whale': '🐋', 'Otter': '🦦', 'Falcon': '🦅'
  };

  const parts = username.split('_');
  if (parts.length >= 2) {
    const fruit = fruitEmojis[parts[0]] || '';
    const animal = animalEmojis[parts[1]] || '';
    if (fruit && animal) return fruit + animal;
    if (fruit) return fruit;
    if (animal) return animal;
  }

  // Fallback: hash-based emoji
  const emojis = ['🎓', '📚', '✏️', '📊', '🎯', '⭐', '🌟', '💫', '🔥', '💪'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash;
  }
  return emojis[Math.abs(hash) % emojis.length];
}

// ==================== RANK SYSTEM ====================
export const RANKS: readonly Rank[] = [
  { name: 'Novice', minPoints: 0, color: 'gray', icon: '📊' },
  { name: 'Apprentice', minPoints: 10, color: 'green', icon: '📈' },
  { name: 'Analyst', minPoints: 30, color: 'blue', icon: '🔍' },
  { name: 'Statistician', minPoints: 60, color: 'purple', icon: '🎯' },
  { name: 'Expert', minPoints: 100, color: 'orange', icon: '⭐' },
  { name: 'Master', minPoints: 150, color: 'yellow', icon: '👑' },
  { name: 'Legend', minPoints: 250, color: 'red', icon: '🏆' }
];

export function getWeightedScore(stars: StarCounts): number {
  return (stars.gold * 4) + (stars.silver * 3) + (stars.bronze * 2) + (stars.tin * 1);
}

export function getCurrentRank(stars: StarCounts): Rank {
  const score = getWeightedScore(stars);
  let currentRank: Rank = RANKS[0];
  for (const rank of RANKS) {
    if (score >= rank.minPoints) {
      currentRank = rank;
    }
  }
  return currentRank;
}

export function getNextRank(stars: StarCounts): Rank | null {
  const score = getWeightedScore(stars);
  for (const rank of RANKS) {
    if (score < rank.minPoints) {
      return rank;
    }
  }
  return null; // Already at max rank
}

export function getRankProgress(stars: StarCounts): number {
  const score = getWeightedScore(stars);
  const current = getCurrentRank(stars);
  const next = getNextRank(stars);
  if (!next) return 100;
  const progressInRank = score - current.minPoints;
  const rankSpan = next.minPoints - current.minPoints;
  return Math.floor((progressInRank / rankSpan) * 100);
}

// ==================== USER SYSTEM CLASS ====================
export class UserSystem {
  serverUrl: string | null;
  teacherPassword: string;
  currentUser: UserIdentity | null;
  isTeacherMode: boolean;
  db: unknown;
  onUserChange: (user: UserIdentity | null) => void;

  constructor(config: UserSystemConfig = {}) {
    this.serverUrl = config.serverUrl || null;
    this.teacherPassword = config.teacherPassword || 'stats123';
    this.currentUser = null;
    this.isTeacherMode = false;
    this.db = null;
    this.onUserChange = config.onUserChange || (() => {});
  }

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<this> {
    // Dynamic import Dexie if available, otherwise use localStorage fallback
    if (typeof Dexie !== 'undefined') {
      try {
        this.db = new Dexie('DrillerPlatform');
        (this.db as any).version(1).stores({
          meta: 'key',
          progress: '++id, username, completed_at',
          settings: 'username',
          sync: 'key'
        });

        // Test that Dexie actually works (can fail if blocked by tracking prevention)
        await (this.db as any).meta.count();

        await this.migrateFromLocalStorage();
      } catch (err) {
        console.warn('IndexedDB not available (may be blocked by tracking prevention), using localStorage fallback:', (err as Error).message);
        this.db = null;
      }
    } else {
      console.info('Dexie not loaded, using localStorage fallback');
    }

    // Check for existing identity
    const identity = await this.getIdentity();
    if (identity?.username) {
      this.currentUser = identity;
      this.onUserChange(this.currentUser);
    }

    return this;
  }

  /**
   * Migrate data from localStorage (one-time)
   */
  async migrateFromLocalStorage(): Promise<void> {
    if (!this.db) return;
    const migrated = localStorage.getItem('dexie_migrated');
    if (migrated) return;

    console.log('Migrating localStorage to IndexedDB...');

    // Migrate streaks
    const streaks = {
      slope: parseInt(localStorage.getItem('slopeStreak') || '0'),
      intercept: parseInt(localStorage.getItem('interceptStreak') || '0'),
      correlation: parseInt(localStorage.getItem('correlationStreak') || '0')
    };
    await (this.db as any).meta.put({ key: 'streaks', value: streaks });

    // Migrate stars
    const stars = {
      gold: parseInt(localStorage.getItem('goldStars') || '0'),
      silver: parseInt(localStorage.getItem('silverStars') || '0'),
      bronze: parseInt(localStorage.getItem('bronzeStars') || '0'),
      tin: parseInt(localStorage.getItem('tinStars') || '0')
    };
    await (this.db as any).meta.put({ key: 'stars', value: stars });

    // Migrate API settings
    const apiSettings = {
      provider: localStorage.getItem('apiProvider') || 'server',
      geminiKey: localStorage.getItem('geminiApiKey') || '',
      groqKey: localStorage.getItem('groqApiKey') || ''
    };
    await (this.db as any).meta.put({ key: 'apiSettings', value: apiSettings });

    localStorage.setItem('dexie_migrated', 'true');
    console.log('Migration complete!');
  }

  /**
   * Get stored identity
   */
  async getIdentity(): Promise<UserIdentity | null> {
    if (this.db) {
      const record = await (this.db as any).meta.get('identity');
      return record?.value || null;
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('userIdentity');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Set user identity
   */
  async setIdentity(identity: UserIdentity): Promise<void> {
    this.currentUser = identity;
    if (this.db) {
      await (this.db as any).meta.put({ key: 'identity', value: identity });
    } else {
      localStorage.setItem('userIdentity', JSON.stringify(identity));
    }
    this.onUserChange(this.currentUser);
  }

  /**
   * Create new user
   */
  async createUser(username: string, realName: string, password: string): Promise<CreateUserResult> {
    // If server is configured, create user there
    if (this.serverUrl) {
      try {
        const response = await fetch(`${this.serverUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, real_name: realName, password })
        });
        const result: CreateUserResult = await response.json();
        if (result.error) {
          return { error: result.error };
        }
      } catch (err) {
        console.warn('Server user creation failed:', err);
      }
    }

    // Set local identity
    await this.setIdentity({ username, realName, password });
    return { success: true };
  }

  /**
   * Verify existing user credentials
   */
  async verifyUser(username: string, password: string): Promise<VerifyResult> {
    let serverResult: { valid?: boolean; error?: string; real_name?: string; isTeacher?: boolean } | null = null;

    if (this.serverUrl) {
      try {
        const response = await fetch(`${this.serverUrl}/api/users/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        serverResult = await response.json();
        if (!serverResult!.valid) {
          return { error: serverResult!.error || 'Invalid credentials' };
        }
      } catch (err) {
        console.warn('Server verification failed:', err);
      }
    }

    // Store identity with real name from server
    const realName = serverResult?.real_name || null;
    await this.setIdentity({ username, password, realName });

    return {
      valid: true,
      realName: realName ?? undefined,
      isTeacher: serverResult?.isTeacher || false
    };
  }

  /**
   * Get list of users from server
   */
  async getUsers(): Promise<UserInfo[]> {
    if (!this.serverUrl) return [];
    try {
      const response = await fetch(`${this.serverUrl}/api/users`);
      return await response.json();
    } catch (err) {
      console.warn('Failed to fetch users:', err);
      return [];
    }
  }

  /**
   * Enter teacher mode
   */
  enterTeacherMode(password: string): boolean {
    if (password === this.teacherPassword) {
      this.isTeacherMode = true;
      return true;
    }
    return false;
  }

  /**
   * Exit teacher mode
   */
  exitTeacherMode(): void {
    this.isTeacherMode = false;
  }

  /**
   * Save progress locally
   */
  async saveProgress(progressData: Record<string, unknown>): Promise<number | string> {
    const record: ProgressRecord = {
      ...progressData,
      username: this.currentUser?.username,
      completed_at: new Date().toISOString()
    };

    if (this.db) {
      return await (this.db as any).progress.add(record);
    }

    // Fallback to localStorage
    const key = `progress_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(record));
    return key;
  }

  /**
   * Get user stats
   */
  async getStats(): Promise<UserStats | null> {
    const username = this.currentUser?.username;
    if (!username) return null;

    const stats: UserStats = {
      totalStars: { gold: 0, silver: 0, bronze: 0, tin: 0 },
      totalAttempts: 0,
      perfectRuns: 0
    };

    if (this.db) {
      const progress: ProgressRecord[] = await (this.db as any).progress.where('username').equals(username).toArray();
      stats.totalAttempts = progress.length;

      for (const p of progress) {
        if (p.star_type && stats.totalStars[p.star_type] !== undefined) {
          stats.totalStars[p.star_type]++;
        }
        if (p.all_correct) stats.perfectRuns++;
      }
    }

    return stats;
  }

  /**
   * Get/set metadata
   */
  async getMeta(key: string): Promise<unknown> {
    if (this.db) {
      const record = await (this.db as any).meta.get(key);
      return record?.value;
    }
    const stored = localStorage.getItem(`meta_${key}`);
    return stored ? JSON.parse(stored) : null;
  }

  async setMeta(key: string, value: unknown): Promise<void> {
    if (this.db) {
      await (this.db as any).meta.put({ key, value });
    } else {
      localStorage.setItem(`meta_${key}`, JSON.stringify(value));
    }
  }
}

// Singleton instance
export const userSystem = new UserSystem();
export default userSystem;

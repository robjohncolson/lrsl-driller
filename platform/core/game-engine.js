/**
 * Game Engine - Core gamification system
 * Handles streaks, stars, tiers, and progression
 * Topic-agnostic: works with any cartridge
 */

import { SCORING_CONFIG } from '../../shared/scoring.config.js';

export class GameEngine {
  constructor(config = {}) {
    this.cartridgeId = null;
    this.storagePrefix = 'driller_';

    // Gamification state
    this.streaks = {};
    this.starCounts = { gold: 0, silver: 0, bronze: 0, tin: 0 };
    this.starsPerMode = {};  // Track stars earned per level/mode
    this.currentTier = null;
    this.unlockedTiers = [];
    this.modeOrder = [];  // Ordered list of mode IDs for sequential unlock

    // Hint tracking for current problem
    this.hintsUsedThisProblem = new Set();

    // Retry tracking (wrong answers count as penalties)
    this.retriesThisProblem = 0;

    // Teacher progression overrides (modeId -> goldRequired)
    this.progressionOverrides = {};

    // Callbacks
    this.onStreakUpdate = config.onStreakUpdate || (() => {});
    this.onStarEarned = config.onStarEarned || (() => {});
    this.onTierUnlocked = config.onTierUnlocked || (() => {});

    // Star tier rules (hints used -> star type)
    this.starTiers = {
      0: 'gold',
      1: 'silver',
      2: 'bronze',
      3: 'tin'
    };

    // Required gold stars to unlock next level (from global scoring config)
    this.goldToUnlock = config.goldToUnlock || SCORING_CONFIG.goldToUnlock || 3;
  }

  /**
   * Load a cartridge and initialize state
   */
  loadCartridge(manifest) {
    this.cartridgeId = manifest.meta.id;
    this.storagePrefix = `driller_${this.cartridgeId}_`;

    // Store unlock rules for re-checking after stars are earned
    this.unlockRules = manifest.modes || manifest.progression?.tiers || [];

    // Store ordered list of mode IDs for sequential unlocking
    this.modeOrder = (manifest.modes || []).map(m => m.id);

    // Initialize streaks for each trackable field
    const streakFields = manifest.progression?.streakFields ||
                         manifest.modes?.map(m => m.id) ||
                         ['default'];

    this.streaks = {};
    streakFields.forEach(field => {
      this.streaks[field] = 0;
    });

    // Initialize starsPerMode for each mode
    this.modeOrder.forEach(modeId => {
      if (!this.starsPerMode[modeId]) {
        this.starsPerMode[modeId] = { gold: 0, silver: 0, bronze: 0, tin: 0 };
      }
    });

    // Load saved state
    this.loadState();

    // Check initial unlocks - use modes array since that's where unlockedBy is defined
    this.checkUnlocks(this.unlockRules);

    return this;
  }

  /**
   * Record a grading result
   */
  recordResult(fieldId, score, allFieldsCorrect = false) {
    const isCorrect = score === 'E' || score === true;

    // Update streak
    if (isCorrect) {
      this.streaks[fieldId] = (this.streaks[fieldId] || 0) + 1;
    } else {
      this.streaks[fieldId] = 0;
    }

    this.onStreakUpdate(fieldId, this.streaks[fieldId]);

    // Award star if all fields correct
    if (allFieldsCorrect) {
      const hintsUsed = this.hintsUsedThisProblem.size;
      const starType = this.getStarType(hintsUsed);
      this.awardStar(starType, this.currentTier);
    }

    this.saveState();

    return {
      streak: this.streaks[fieldId],
      isCorrect
    };
  }

  /**
   * Determine star type based on hints used and retries
   * Both hints and retries count as penalties
   */
  getStarType(hintsUsed) {
    const totalPenalties = hintsUsed + this.retriesThisProblem;
    if (totalPenalties === 0) return 'gold';
    if (totalPenalties === 1) return 'silver';
    if (totalPenalties === 2) return 'bronze';
    return 'tin';
  }

  /**
   * Award a star (tracks both total and per-mode)
   */
  awardStar(starType, modeId = null) {
    // Track total stars
    this.starCounts[starType]++;

    // Track stars per mode
    if (modeId) {
      if (!this.starsPerMode[modeId]) {
        this.starsPerMode[modeId] = { gold: 0, silver: 0, bronze: 0, tin: 0 };
      }
      this.starsPerMode[modeId][starType]++;
    }

    this.onStarEarned(starType, this.starCounts, modeId);

    // Re-check unlocks in case star earned unlocks new tier
    if (this.unlockRules) {
      this.checkUnlocks(this.unlockRules);
    }

    this.saveState();
  }

  /**
   * Track hint usage
   */
  useHint(hintId) {
    this.hintsUsedThisProblem.add(hintId);
    return this.hintsUsedThisProblem.size;
  }

  /**
   * Track retry (wrong answer penalty)
   */
  useRetry() {
    this.retriesThisProblem++;
    return this.retriesThisProblem;
  }

  /**
   * Reset hints and retries for new problem
   */
  resetHintsForNewProblem() {
    this.hintsUsedThisProblem.clear();
    this.retriesThisProblem = 0;
  }

  /**
   * Get potential star based on current hints and retries
   */
  getPotentialStar() {
    return this.getStarType(this.hintsUsedThisProblem.size);
  }

  /**
   * Get total penalties (hints + retries)
   */
  getTotalPenalties() {
    return this.hintsUsedThisProblem.size + this.retriesThisProblem;
  }

  /**
   * Check and unlock tiers/modes based on progression rules
   * STRICT sequential unlocking: each level requires goldToUnlock gold stars on the previous level
   * Levels must be completed in order - no skipping allowed
   */
  checkUnlocks(tierRules) {
    for (let i = 0; i < tierRules.length; i++) {
      const tier = tierRules[i];
      if (this.unlockedTiers.includes(tier.id)) continue;

      // First level is always unlocked
      if (i === 0 || tier.unlockedBy === 'default') {
        this.unlockedTiers.push(tier.id);
        // Set first default tier as current if none set
        if (!this.currentTier) {
          this.currentTier = tier.id;
        }
        continue;
      }

      // STRICT sequential unlock: previous level MUST have enough gold stars
      // Uses per-level requirements (override > manifest > global default)
      const previousModeId = this.modeOrder[i - 1];
      const previousModeStars = this.starsPerMode[previousModeId] || { gold: 0 };

      // Also check that the previous level is actually unlocked (prevents skipping)
      const previousUnlocked = this.unlockedTiers.includes(previousModeId);

      // Get the required gold for the CURRENT tier (what you need to unlock it)
      const requiredGold = this.getRequiredGold(tier.id);

      if (previousUnlocked && previousModeStars.gold >= requiredGold) {
        this.unlockedTiers.push(tier.id);
        this.onTierUnlocked(tier);
        this.saveState();
      }
      // If previous level isn't complete, stop checking further levels
      // (they can't be unlocked without completing earlier ones)
    }

    return this.unlockedTiers;
  }

  /**
   * Get gold stars earned on a specific mode
   */
  getModeGoldStars(modeId) {
    return this.starsPerMode[modeId]?.gold || 0;
  }

  /**
   * Check if a mode is unlocked
   */
  isModeUnlocked(modeId) {
    return this.unlockedTiers.includes(modeId);
  }

  /**
   * Get the index of a mode in the progression order
   */
  getModeIndex(modeId) {
    return this.modeOrder.indexOf(modeId);
  }

  /**
   * Get required gold stars for a specific mode
   * Priority: 1) Teacher override, 2) Manifest unlockedBy.gold, 3) Global default
   */
  getRequiredGold(modeId) {
    // 1. Check teacher override first
    if (this.progressionOverrides?.[modeId] !== undefined) {
      return this.progressionOverrides[modeId];
    }
    // 2. Check manifest's unlockedBy.gold for this mode
    const mode = this.unlockRules?.find(m => m.id === modeId);
    if (mode?.unlockedBy?.gold !== undefined) {
      return mode.unlockedBy.gold;
    }
    // 3. Fall back to global default
    return this.goldToUnlock;
  }

  /**
   * Get the manifest default for a mode (ignoring overrides)
   */
  getManifestDefault(modeId) {
    const mode = this.unlockRules?.find(m => m.id === modeId);
    if (mode?.unlockedBy?.gold !== undefined) {
      return mode.unlockedBy.gold;
    }
    return this.goldToUnlock;
  }

  /**
   * Set all progression overrides at once (from server)
   */
  setOverrides(overrides) {
    this.progressionOverrides = overrides || {};
    // Re-evaluate unlocks with new overrides
    if (this.unlockRules) {
      // Clear unlocked tiers and re-check from scratch
      this.unlockedTiers = [];
      this.checkUnlocks(this.unlockRules);
      this.currentTier = this.unlockedTiers[0] || null;
    }
  }

  /**
   * Update a single progression override
   */
  updateOverride(modeId, goldRequired) {
    this.progressionOverrides[modeId] = goldRequired;
    // Re-evaluate unlocks
    if (this.unlockRules) {
      this.unlockedTiers = [];
      this.checkUnlocks(this.unlockRules);
    }
  }

  /**
   * Remove an override (revert to manifest default)
   */
  removeOverride(modeId) {
    delete this.progressionOverrides[modeId];
    // Re-evaluate unlocks
    if (this.unlockRules) {
      this.unlockedTiers = [];
      this.checkUnlocks(this.unlockRules);
    }
  }

  /**
   * Check if a mode has an active override
   */
  hasOverride(modeId) {
    return this.progressionOverrides?.[modeId] !== undefined;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      streaks: { ...this.streaks },
      starCounts: { ...this.starCounts },
      starsPerMode: { ...this.starsPerMode },
      currentTier: this.currentTier,
      unlockedTiers: [...this.unlockedTiers],
      modeOrder: [...this.modeOrder],
      goldToUnlock: this.goldToUnlock,
      progressionOverrides: { ...this.progressionOverrides },
      hintsUsed: this.hintsUsedThisProblem.size,
      retriesUsed: this.retriesThisProblem,
      totalPenalties: this.getTotalPenalties(),
      potentialStar: this.getPotentialStar()
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    const state = {
      streaks: this.streaks,
      starCounts: this.starCounts,
      starsPerMode: this.starsPerMode,
      currentTier: this.currentTier,
      unlockedTiers: this.unlockedTiers
    };
    localStorage.setItem(this.storagePrefix + 'gameState', JSON.stringify(state));
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    const saved = localStorage.getItem(this.storagePrefix + 'gameState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.streaks = { ...this.streaks, ...state.streaks };
        this.starCounts = state.starCounts || this.starCounts;
        this.starsPerMode = { ...this.starsPerMode, ...state.starsPerMode };
        this.currentTier = state.currentTier || null;
        this.unlockedTiers = state.unlockedTiers || [];
      } catch (e) {
        console.warn('Failed to load game state:', e);
      }
    }
  }

  /**
   * Reset all progress
   */
  resetProgress() {
    Object.keys(this.streaks).forEach(k => this.streaks[k] = 0);
    this.starCounts = { gold: 0, silver: 0, bronze: 0, tin: 0 };
    // Reset stars per mode
    Object.keys(this.starsPerMode).forEach(modeId => {
      this.starsPerMode[modeId] = { gold: 0, silver: 0, bronze: 0, tin: 0 };
    });
    // Reset to first level only
    this.currentTier = this.modeOrder[0] || null;
    this.unlockedTiers = this.modeOrder[0] ? [this.modeOrder[0]] : [];
    this.saveState();
  }

  /**
   * Set current tier (for mode switching)
   */
  setTier(tierId) {
    if (this.unlockedTiers.includes(tierId)) {
      this.currentTier = tierId;
      this.saveState();
      return true;
    }
    return false;
  }
}

export default GameEngine;

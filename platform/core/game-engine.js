/**
 * Game Engine - Core gamification system
 * Handles streaks, stars, tiers, and progression
 * Topic-agnostic: works with any cartridge
 */

export class GameEngine {
  constructor(config = {}) {
    this.cartridgeId = null;
    this.storagePrefix = 'driller_';

    // Gamification state
    this.streaks = {};
    this.starCounts = { gold: 0, silver: 0, bronze: 0, tin: 0 };
    this.currentTier = null;
    this.unlockedTiers = [];

    // Hint tracking for current problem
    this.hintsUsedThisProblem = new Set();

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
  }

  /**
   * Load a cartridge and initialize state
   */
  loadCartridge(manifest) {
    this.cartridgeId = manifest.meta.id;
    this.storagePrefix = `driller_${this.cartridgeId}_`;

    // Store unlock rules for re-checking after stars are earned
    this.unlockRules = manifest.modes || manifest.progression?.tiers || [];

    // Initialize streaks for each trackable field
    const streakFields = manifest.progression?.streakFields ||
                         manifest.modes?.map(m => m.id) ||
                         ['default'];

    this.streaks = {};
    streakFields.forEach(field => {
      this.streaks[field] = 0;
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
      this.awardStar(starType);
    }

    this.saveState();

    return {
      streak: this.streaks[fieldId],
      isCorrect
    };
  }

  /**
   * Determine star type based on hints used
   */
  getStarType(hintsUsed) {
    if (hintsUsed === 0) return 'gold';
    if (hintsUsed === 1) return 'silver';
    if (hintsUsed === 2) return 'bronze';
    return 'tin';
  }

  /**
   * Award a star
   */
  awardStar(starType) {
    this.starCounts[starType]++;
    this.onStarEarned(starType, this.starCounts);

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
   * Reset hints for new problem
   */
  resetHintsForNewProblem() {
    this.hintsUsedThisProblem.clear();
  }

  /**
   * Get potential star based on current hint usage
   */
  getPotentialStar() {
    return this.getStarType(this.hintsUsedThisProblem.size);
  }

  /**
   * Check and unlock tiers/modes based on progression rules
   * Works with both manifest.modes and manifest.progression.tiers
   */
  checkUnlocks(tierRules) {
    for (const tier of tierRules) {
      if (this.unlockedTiers.includes(tier.id)) continue;

      if (tier.unlockedBy === 'default') {
        this.unlockedTiers.push(tier.id);
        // Set first default tier as current if none set
        if (!this.currentTier) {
          this.currentTier = tier.id;
        }
        continue;
      }

      // Check unlock conditions
      const condition = tier.unlockedBy;
      if (!condition) continue;

      let unlocked = false;

      if (condition.gold && this.starCounts.gold >= condition.gold) {
        unlocked = true;
      }
      if (condition.totalStars) {
        const total = Object.values(this.starCounts).reduce((a, b) => a + b, 0);
        if (total >= condition.totalStars) unlocked = true;
      }
      if (condition.streak) {
        const maxStreak = Math.max(...Object.values(this.streaks));
        if (maxStreak >= condition.streak) unlocked = true;
      }

      if (unlocked) {
        this.unlockedTiers.push(tier.id);
        this.onTierUnlocked(tier);
        this.saveState();
      }
    }

    return this.unlockedTiers;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      streaks: { ...this.streaks },
      starCounts: { ...this.starCounts },
      currentTier: this.currentTier,
      unlockedTiers: [...this.unlockedTiers],
      hintsUsed: this.hintsUsedThisProblem.size,
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
        this.currentTier = state.currentTier || 'basic';
        this.unlockedTiers = state.unlockedTiers || ['basic'];
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
    this.currentTier = 'basic';
    this.unlockedTiers = ['basic'];
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

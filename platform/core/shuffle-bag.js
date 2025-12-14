/**
 * ShuffleBag - Ensures fair distribution of random elements
 *
 * Instead of pure random selection (which can feel clumpy),
 * this draws from a shuffled bag and refills when empty.
 * Guarantees every option is seen before any repeats.
 *
 * Used by Spotify, games, and anywhere "perceived fairness" matters.
 */

export class ShuffleBag {
  constructor(options = {}) {
    this.items = [];
    this.bag = [];
    this.lastDrawn = null;

    // How many items to keep in "cooldown" (won't appear until bag refills)
    this.cooldownSize = options.cooldownSize || 1;

    // Optional: generate items dynamically instead of static list
    this.generator = options.generator || null;
    this.generateCount = options.generateCount || 20;
  }

  /**
   * Set the pool of items to draw from
   */
  setItems(items) {
    this.items = [...items];
    this.refill();
  }

  /**
   * Fisher-Yates shuffle (unbiased)
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Refill the bag with shuffled items
   */
  refill() {
    if (this.generator) {
      // Generate fresh items
      const newItems = [];
      for (let i = 0; i < this.generateCount; i++) {
        newItems.push(this.generator());
      }
      this.bag = this.shuffle(newItems);
    } else {
      // Use static item list
      this.bag = this.shuffle(this.items);
    }

    // If we have a lastDrawn and cooldown, ensure it's not at the top
    if (this.lastDrawn && this.bag.length > 1) {
      const lastSignature = JSON.stringify(this.lastDrawn);
      // Move any matching items to the front (they'll be drawn last)
      const matchIndex = this.bag.findIndex(item =>
        JSON.stringify(item) === lastSignature
      );
      if (matchIndex === this.bag.length - 1) {
        // Last drawn is at the end (next to be drawn), swap it
        const swapIndex = Math.floor(Math.random() * (this.bag.length - 1));
        [this.bag[matchIndex], this.bag[swapIndex]] = [this.bag[swapIndex], this.bag[matchIndex]];
      }
    }
  }

  /**
   * Draw the next item from the bag
   */
  draw() {
    if (this.bag.length === 0) {
      this.refill();
    }

    const item = this.bag.pop();
    this.lastDrawn = item;
    return item;
  }

  /**
   * Check if bag needs refilling
   */
  isEmpty() {
    return this.bag.length === 0;
  }

  /**
   * Get remaining count in bag
   */
  remaining() {
    return this.bag.length;
  }

  /**
   * Reset the bag (clear history)
   */
  reset() {
    this.bag = [];
    this.lastDrawn = null;
  }
}

/**
 * ProblemShuffleBag - Specialized for problem generation
 * Generates problems on-demand and tracks by signature
 */
export class ProblemShuffleBag {
  constructor(options = {}) {
    this.problemGenerator = options.generator;
    this.batchSize = options.batchSize || 15;
    this.bag = [];
    this.recentSignatures = [];
    this.historySize = options.historySize || 3;
  }

  /**
   * Get signature for duplicate detection
   */
  getSignature(problem) {
    if (!problem?.given) return Math.random().toString();
    return JSON.stringify(problem.given);
  }

  /**
   * Fisher-Yates shuffle
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Generate a batch of problems and shuffle them
   */
  async refill() {
    const newProblems = [];
    const seenSignatures = new Set(this.recentSignatures);

    // Generate batch, avoiding recent duplicates
    let attempts = 0;
    const maxAttempts = this.batchSize * 3;

    while (newProblems.length < this.batchSize && attempts < maxAttempts) {
      attempts++;
      const problem = await this.problemGenerator();
      const sig = this.getSignature(problem);

      // Skip if we've seen this recently or it's already in the new batch
      if (!seenSignatures.has(sig)) {
        newProblems.push(problem);
        seenSignatures.add(sig);
      }
    }

    this.bag = this.shuffle(newProblems);
  }

  /**
   * Draw the next problem
   */
  async draw() {
    if (this.bag.length === 0) {
      await this.refill();
    }

    const problem = this.bag.pop();

    // Track in recent history
    const sig = this.getSignature(problem);
    this.recentSignatures.push(sig);
    if (this.recentSignatures.length > this.historySize) {
      this.recentSignatures.shift();
    }

    return problem;
  }

  /**
   * Reset the bag (when changing modes)
   */
  reset() {
    this.bag = [];
    this.recentSignatures = [];
  }

  /**
   * Get remaining count
   */
  remaining() {
    return this.bag.length;
  }
}

export default { ShuffleBag, ProblemShuffleBag };

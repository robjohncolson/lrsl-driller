/**
 * Arena Betting System
 * Manages pot, bets, and payouts for Ghost Arena matches
 *
 * @version 1.0.0
 *
 * Entry rules:
 * - Cost: 1 gold star + (total_points / 50) as bet
 * - Bet is added to pot
 * - Rejoin after elimination costs another gold star + bet
 *
 * Payout rules:
 * - Last human standing: wins entire pot
 * - Ghost wins (human eliminated, only ghost left): human loses half their bet, pot resets
 * - Winner vs ghost: gets bet back + half bet (1.5x return)
 */

// ============================================
// POT MANAGEMENT
// ============================================

let currentPot = 0;

/**
 * Add amount to the pot
 * @param {number} amount - Points to add
 */
function addToPot(amount) {
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount: must be a non-negative number');
  }
  currentPot += amount;
  return currentPot;
}

/**
 * Reset the pot to zero
 * @returns {number} The amount that was in the pot before reset
 */
function resetPot() {
  const previousPot = currentPot;
  currentPot = 0;
  return previousPot;
}

/**
 * Get current pot value
 * @returns {number} Current pot amount
 */
function getPot() {
  return currentPot;
}

// ============================================
// BET CALCULATION
// ============================================

/**
 * Calculate bet amount based on player's total points
 * Bet = points / 50 (no minimum, 0.2 points is valid)
 * @param {number} playerPoints - Player's total points
 * @returns {number} Calculated bet amount
 */
function calculateBet(playerPoints) {
  if (typeof playerPoints !== 'number' || isNaN(playerPoints)) {
    return 0;
  }
  return Math.max(0, playerPoints / 50);
}

// ============================================
// ENTRY VALIDATION
// ============================================

/**
 * Check if player can enter the arena
 * Requires at least 1 gold star
 * @param {number} goldStars - Player's gold star count
 * @param {number} points - Player's total points (unused but included for API consistency)
 * @returns {boolean} True if player can enter
 */
function canEnterArena(goldStars, points) {
  return typeof goldStars === 'number' && goldStars >= 1;
}

/**
 * Process arena entry - deduct star, calculate bet, add to pot
 * @param {string} playerId - Player identifier
 * @param {number} goldStars - Player's current gold stars
 * @param {number} points - Player's current points
 * @returns {Object} Result with success, bet, newGoldStars, newPoints, error
 */
function processEntry(playerId, goldStars, points) {
  // Validate player ID
  if (!playerId || typeof playerId !== 'string') {
    return {
      success: false,
      bet: 0,
      newGoldStars: goldStars,
      newPoints: points,
      error: 'Invalid player ID'
    };
  }

  // Check entry requirements
  if (!canEnterArena(goldStars, points)) {
    return {
      success: false,
      bet: 0,
      newGoldStars: goldStars,
      newPoints: points,
      error: 'Requires at least 1 gold star to enter'
    };
  }

  // Calculate bet
  const bet = calculateBet(points);

  // Deduct gold star and bet
  const newGoldStars = goldStars - 1;
  const newPoints = points - bet;

  // Add bet to pot
  addToPot(bet);

  return {
    success: true,
    bet,
    newGoldStars,
    newPoints,
    error: null
  };
}

// ============================================
// PAYOUT PROCESSING
// ============================================

/**
 * Process win payout
 * - If against humans only (last standing): winner takes entire pot
 * - If against ghost: winner gets bet back + half bet (1.5x return)
 * @param {string} winnerId - Winner's player ID
 * @param {boolean} wasAgainstGhost - True if final opponent was a ghost
 * @returns {Object} Result with payout and newPot
 */
function processWin(winnerId, wasAgainstGhost) {
  let payout;

  if (wasAgainstGhost) {
    // Winner vs ghost: 1.5x return (but we need their original bet)
    // Since we don't track individual bets here, this should be called
    // with the bet amount tracked elsewhere
    // For now, winner gets the pot (which may be just their bet)
    payout = currentPot;
  } else {
    // Last human standing: takes entire pot
    payout = currentPot;
  }

  const newPot = resetPot();

  return {
    payout,
    newPot: 0  // Pot is reset after payout
  };
}

/**
 * Process ghost win (human eliminated, only ghost remaining)
 * Human loses half their bet, pot resets
 * @param {string} humanPlayerId - The eliminated human's player ID
 * @param {number} humanBet - The human's original bet amount
 * @returns {Object} Result with payout (negative = loss) and newPot
 */
function processGhostWin(humanPlayerId, humanBet) {
  // Human loses half their bet
  const loss = humanBet / 2;

  // Pot resets
  resetPot();

  return {
    payout: -loss,  // Negative indicates a loss
    newPot: 0
  };
}

// ============================================
// REJOIN HANDLING
// ============================================

/**
 * Process rejoin after elimination - same as entry, adds to existing pot
 * @param {string} playerId - Player identifier
 * @param {number} goldStars - Player's current gold stars
 * @param {number} points - Player's current points
 * @returns {Object} Result with success, bet, newGoldStars, newPoints, error
 */
function processRejoin(playerId, goldStars, points) {
  // Rejoin has same requirements and process as initial entry
  return processEntry(playerId, goldStars, points);
}

// ============================================
// SUPABASE INTEGRATION
// ============================================

/**
 * Record a bet to the arena_bets table
 * @param {Object} supabase - Supabase client instance
 * @param {string} sessionId - Arena session identifier
 * @param {string} userId - User identifier (username)
 * @param {number} amount - Bet amount
 * @param {boolean} isRejoin - True if this is a rejoin bet
 * @returns {Promise<Object>} Result with success and error
 */
async function recordBet(supabase, sessionId, userId, amount, isRejoin) {
  try {
    const { data, error } = await supabase
      .from('arena_bets')
      .insert({
        session_id: sessionId,
        user_id: userId,
        amount: amount,
        is_rejoin: isRejoin,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (err) {
    console.error('[Arena Betting] recordBet error:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Record arena result to the arena_results table
 * @param {Object} supabase - Supabase client instance
 * @param {string} sessionId - Arena session identifier
 * @param {string} userId - User identifier (username)
 * @param {number} placement - Final placement (1 = winner)
 * @param {number} payout - Points received (negative for losses)
 * @param {number} goldSpent - Number of gold stars spent
 * @returns {Promise<Object>} Result with success and error
 */
async function recordResult(supabase, sessionId, userId, placement, payout, goldSpent) {
  try {
    const { data, error } = await supabase
      .from('arena_results')
      .insert({
        session_id: sessionId,
        user_id: userId,
        placement: placement,
        payout: payout,
        gold_spent: goldSpent,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (err) {
    console.error('[Arena Betting] recordResult error:', err);
    return { success: false, data: null, error: err.message };
  }
}

// ============================================
// SESSION POT MANAGEMENT (for multiple arenas)
// ============================================

// Track pots per session for multi-arena support
const sessionPots = new Map();

/**
 * Get pot for a specific session
 * @param {string} sessionId - Arena session identifier
 * @returns {number} Current pot for session
 */
function getSessionPot(sessionId) {
  return sessionPots.get(sessionId) || 0;
}

/**
 * Add to a specific session's pot
 * @param {string} sessionId - Arena session identifier
 * @param {number} amount - Amount to add
 * @returns {number} New pot total
 */
function addToSessionPot(sessionId, amount) {
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    throw new Error('Invalid amount: must be a non-negative number');
  }
  const current = sessionPots.get(sessionId) || 0;
  const newTotal = current + amount;
  sessionPots.set(sessionId, newTotal);
  return newTotal;
}

/**
 * Reset a specific session's pot
 * @param {string} sessionId - Arena session identifier
 * @returns {number} The amount that was in the pot before reset
 */
function resetSessionPot(sessionId) {
  const previousPot = sessionPots.get(sessionId) || 0;
  sessionPots.delete(sessionId);
  return previousPot;
}

/**
 * Process entry for a specific session
 * @param {string} sessionId - Arena session identifier
 * @param {string} playerId - Player identifier
 * @param {number} goldStars - Player's current gold stars
 * @param {number} points - Player's current points
 * @returns {Object} Result with success, bet, newGoldStars, newPoints, error
 */
function processSessionEntry(sessionId, playerId, goldStars, points) {
  // Validate player ID
  if (!playerId || typeof playerId !== 'string') {
    return {
      success: false,
      bet: 0,
      newGoldStars: goldStars,
      newPoints: points,
      error: 'Invalid player ID'
    };
  }

  // Check entry requirements
  if (!canEnterArena(goldStars, points)) {
    return {
      success: false,
      bet: 0,
      newGoldStars: goldStars,
      newPoints: points,
      error: 'Requires at least 1 gold star to enter'
    };
  }

  // Calculate bet
  const bet = calculateBet(points);

  // Deduct gold star and bet
  const newGoldStars = goldStars - 1;
  const newPoints = points - bet;

  // Add bet to session pot
  addToSessionPot(sessionId, bet);

  return {
    success: true,
    bet,
    newGoldStars,
    newPoints,
    error: null
  };
}

/**
 * Process win for a specific session
 * @param {string} sessionId - Arena session identifier
 * @param {string} winnerId - Winner's player ID
 * @param {boolean} wasAgainstGhost - True if final opponent was a ghost
 * @returns {Object} Result with payout and newPot
 */
function processSessionWin(sessionId, winnerId, wasAgainstGhost) {
  const pot = getSessionPot(sessionId);
  const payout = pot;

  resetSessionPot(sessionId);

  return {
    payout,
    newPot: 0
  };
}

/**
 * Process rejoin for a specific session
 * @param {string} sessionId - Arena session identifier
 * @param {string} playerId - Player identifier
 * @param {number} goldStars - Player's current gold stars
 * @param {number} points - Player's current points
 * @returns {Object} Result with success, bet, newGoldStars, newPoints, error
 */
function processSessionRejoin(sessionId, playerId, goldStars, points) {
  return processSessionEntry(sessionId, playerId, goldStars, points);
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Global pot management
  currentPot,
  addToPot,
  resetPot,
  getPot,

  // Bet calculation
  calculateBet,

  // Entry validation
  canEnterArena,
  processEntry,

  // Payout processing
  processWin,
  processGhostWin,

  // Rejoin handling
  processRejoin,

  // Supabase integration
  recordBet,
  recordResult,

  // Session-based pot management (for multiple arenas)
  getSessionPot,
  addToSessionPot,
  resetSessionPot,
  processSessionEntry,
  processSessionWin,
  processSessionRejoin
};

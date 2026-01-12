const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { WebSocketServer } = require('ws');
const http = require('http');
const {
  parseUsername,
  generateAvatarDisplay,
  assignAvatarFormat,
  getUniqueAvatar
} = require('./avatar-utils.js');
const { GRID_WARS_CONFIG } = require('./gridwars.config.js');
const { buildCartridgePrompt } = require('./prompt-utils.js');
const {
  coordsToAddress,
  addressToCoords,
  buildAddress,
  getParentAddress,
  getLevel,
  getBreadcrumb,
  parseAddress,
  isCenterCell,
  CENTER_CELLS,
  DRILL_CELL
} = require('./address-utils.js');

// ============================================
// CONFIGURATION
// ============================================
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
// Use service role key to bypass RLS for server-side writes
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'stats123';

// AI API Keys (for server-side grading)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

// Log configuration
console.log('Supabase configured:', {
  url: SUPABASE_URL ? 'set' : 'missing',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon'
});
console.log('AI Providers configured:', {
  gemini: !!GEMINI_API_KEY,
  groq: !!GROQ_API_KEY
});

// Grid Wars config verification
console.log('=== GRID WARS CONFIG ===');
console.log('mapSize:', GRID_WARS_CONFIG.mapSize);
console.log('nodesEnabled:', GRID_WARS_CONFIG.nodesEnabled);
console.log('claimCost:', GRID_WARS_CONFIG.claimCost);
console.log('bootBonus:', GRID_WARS_CONFIG.bootBonus);
console.log('v2.0 hierarchyEnabled:', GRID_WARS_CONFIG.hierarchyEnabled);
console.log('v2.0 developmentCost:', GRID_WARS_CONFIG.developmentCost);
console.log('v2.0 drillCost:', GRID_WARS_CONFIG.drillCost);
console.log('========================');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// v2.2: PLAYER COLORS
// ============================================
const VIVID_COLORS = [
  '#FF3366', '#FF6B35', '#FFD93D', '#6BCB77', '#4D96FF',
  '#9B59B6', '#00D9FF', '#FF85A1', '#45B7D1', '#F7DC6F',
  '#BB8FCE', '#58D68D', '#EC7063', '#5DADE2', '#F1948A',
  '#7DCEA0', '#D7BDE2', '#F8C471', '#85C1E9', '#82E0AA',
  '#F7B2BD', '#AED6F1', '#48C9B0', '#F39C12', '#1ABC9C',
  '#E74C3C', '#3498DB', '#2ECC71', '#E67E22', '#34495E',
  '#16A085', '#8E44AD', '#D35400', '#27AE60', '#2980B9',
  '#C0392B', '#7F8C8D', '#BDC3C7', '#F39C12', '#9B59B6'
];

/**
 * v2.2: Assign a unique color to a player
 * @param {string} gameId
 * @param {string} username
 * @returns {Promise<string>} Color hex code
 */
async function assignPlayerColor(gameId, username) {
  // Check if already has color
  const { data: player } = await supabase
    .from('grid_wars_players')
    .select('color')
    .eq('game_id', gameId)
    .eq('username', username)
    .single();

  if (player?.color) return player.color;

  // Get used colors in this game
  const { data: players } = await supabase
    .from('grid_wars_players')
    .select('color')
    .eq('game_id', gameId);

  const usedColors = new Set((players || []).map(p => p.color).filter(Boolean));

  // Find first unused color, or generate random if all used
  const color = VIVID_COLORS.find(c => !usedColors.has(c))
    || `hsl(${Math.random() * 360}, 80%, 60%)`;

  // Update player with color
  await supabase
    .from('grid_wars_players')
    .update({ color })
    .eq('game_id', gameId)
    .eq('username', username);

  return color;
}

/**
 * v2.2.4: Calculate weighted territory for a user across ALL levels
 * Weights: Level 0 (macro) = 1 unit, Level 1 = 1/64 unit, Level 2 = 1/4096 unit
 * Developed macro cells don't count (ownership moved to subcells)
 * @param {string} gameId - Game ID
 * @param {string} username - Username to calculate for
 * @returns {Promise<{units: number, percent: string, breakdown: {macro: number, sub1: number, sub2: number}}>}
 */
async function calculateWeightedTerritory(gameId, username) {
  // Get ALL territories owned by user at ALL levels
  const { data: territories, error } = await supabase
    .from('grid_wars_territories')
    .select('address, cell_level, is_developed')
    .eq('game_id', gameId)
    .eq('owner', username);

  if (error || !territories || territories.length === 0) {
    return { units: 0, percent: '0.00', breakdown: { macro: 0, sub1: 0, sub2: 0 } };
  }

  // Weight by level
  // Level 0 (macro): worth 1 unit each (1/64 of map)
  // Level 1 (subcell): worth 1/64 unit each (1/4096 of map)
  // Level 2 (sub-subcell): worth 1/4096 unit each (1/262144 of map)
  let totalUnits = 0;
  const breakdown = { macro: 0, sub1: 0, sub2: 0 };

  for (const t of territories) {
    const level = t.cell_level || 0;

    if (level === 0 && !t.is_developed) {
      // Undeveloped macro cell = 1 full unit
      totalUnits += 1;
      breakdown.macro++;
    } else if (level === 0 && t.is_developed) {
      // Developed macro cell = 0 units (ownership moved to subcells)
      // Don't count it - the subcells are what matters now
    } else if (level === 1) {
      // Subcell = 1/64 unit
      totalUnits += 1 / 64;
      breakdown.sub1++;
    } else if (level === 2) {
      // Sub-subcell = 1/4096 unit
      totalUnits += 1 / 4096;
      breakdown.sub2++;
    }
  }

  // Total possible units = 64 (if you owned all macro cells undeveloped)
  const percent = ((totalUnits / 64) * 100).toFixed(2);

  return {
    units: totalUnits,
    percent,
    breakdown
  };
}

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// VERSION - Update this when deploying new versions
// ============================================
const CURRENT_VERSION = '0.0.1';

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'lsrl-trainer-server', version: CURRENT_VERSION });
});

// Version endpoint - clients check this to see if they need to update
app.get('/api/version', (req, res) => {
  res.json({
    version: CURRENT_VERSION,
    message: 'Hard refresh (Ctrl+Shift+R) to update to the latest version'
  });
});

// ============================================
// USER ENDPOINTS
// ============================================

// Get all usernames (for dropdown)
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, real_name')
      .eq('user_type', 'student')
      .order('username');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create new user
app.post('/api/users', async (req, res) => {
  try {
    const { username, real_name, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if username already exists
    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ username, real_name: real_name || null, password })
      .select()
      .single();

    if (error) throw error;

    // Broadcast new user joined
    broadcast({ type: 'user_joined', username, real_name });

    res.json({ success: true, username: data.username });
  } catch (err) {
    console.error('POST /api/users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify user password
app.post('/api/users/verify', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('username, password, real_name, user_type')
      .eq('username', username)
      .single();

    if (error || !data) {
      return res.json({ valid: false, error: 'User not found' });
    }

    if (data.password !== password) {
      return res.json({ valid: false, error: 'Incorrect password' });
    }

    res.json({
      valid: true,
      username: data.username,
      real_name: data.real_name,
      isTeacher: data.user_type === 'teacher'
    });
  } catch (err) {
    console.error('POST /api/users/verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's total stars and weighted score (for Grid Wars bootstrap)
app.get('/api/users/:username/stars', async (req, res) => {
  try {
    const { username } = req.params;

    // Get all progress records for this user
    const { data: progress, error } = await supabase
      .from('lsrl_progress')
      .select('star_type, weighted_points')
      .eq('username', username)
      .not('star_type', 'is', null);

    if (error) throw error;

    // Count stars by type and sum weighted points
    const stars = { gold: 0, silver: 0, bronze: 0, tin: 0 };
    const basePoints = { gold: 4, silver: 3, bronze: 2, tin: 1 };
    let weightedTotal = 0;

    for (const p of progress || []) {
      if (p.star_type && stars[p.star_type] !== undefined) {
        stars[p.star_type]++;
      }
      // Use weighted_points if available, otherwise calculate from star_type
      if (p.weighted_points != null) {
        weightedTotal += p.weighted_points;
      } else if (p.star_type) {
        weightedTotal += basePoints[p.star_type] || 0;
      }
    }

    res.json({ stars, weightedTotal: Math.round(weightedTotal) });
  } catch (err) {
    console.error('GET /api/users/:username/stars error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify teacher password (standalone teacher login)
app.post('/api/auth/teacher', async (req, res) => {
  try {
    const { password } = req.body;

    // Check against environment variable (with fallback)
    if (password !== TEACHER_PASSWORD) {
      return res.json({ valid: false, error: 'Invalid teacher password' });
    }

    res.json({ valid: true, isTeacher: true });
  } catch (err) {
    console.error('POST /api/auth/teacher error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PROGRESS ENDPOINTS
// ============================================

// Save progress
app.post('/api/progress', async (req, res) => {
  try {
    const {
      username,
      scenario_topic,
      slope_score,
      intercept_score,
      correlation_score,
      hints_used,
      star_type,
      all_correct,
      grading_mode,
      ai_provider,
      level_index,
      level_multiplier,
      // v1.4: Track cartridge/mode for future score recomputation
      cartridge_id,
      mode_id,
      total_levels,
      weighted_points: clientWeightedPoints  // Client can pre-calculate
    } = req.body;

    if (!username || !scenario_topic) {
      return res.status(400).json({ error: 'Username and scenario_topic required' });
    }

    // Ensure user exists (auto-create if not) to prevent foreign key errors
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (!existingUser) {
      // Auto-create user with default password
      const { error: createError } = await supabase
        .from('users')
        .insert({
          username,
          password: 'auto-created',
          user_type: 'student'
        });

      if (createError && !createError.message.includes('duplicate')) {
        console.warn('Auto-create user warning:', createError);
      }
    }

    // v1.4: Use new scoring config
    // Star ratios: gold=1, silver=0.5, bronze=0.25, tin=0.125
    // Level multiplier: 0.5 (first) to 3.0 (last), interpolated
    const SCORING_CONFIG = {
      baseGoldPoints: 4,
      starRatios: { gold: 1.0, silver: 0.5, bronze: 0.25, tin: 0.125 },
      levelMultiplier: { first: 0.5, last: 3.0 }
    };

    let weightedPoints = 0;
    let multiplier = 1.0;

    if (star_type) {
      // Use client-provided weighted points if available (already calculated with full context)
      if (clientWeightedPoints != null && clientWeightedPoints > 0) {
        weightedPoints = clientWeightedPoints;
        // Back-calculate multiplier for storage
        const starRatio = SCORING_CONFIG.starRatios[star_type] || SCORING_CONFIG.starRatios.tin;
        multiplier = weightedPoints / (SCORING_CONFIG.baseGoldPoints * starRatio);
      } else {
        // Calculate on server if not provided (fallback for older clients)
        const starRatio = SCORING_CONFIG.starRatios[star_type] || SCORING_CONFIG.starRatios.tin;
        const lvlIdx = level_index || 0;
        const totalLvls = total_levels || 1;

        if (totalLvls <= 1) {
          multiplier = (SCORING_CONFIG.levelMultiplier.first + SCORING_CONFIG.levelMultiplier.last) / 2;
        } else {
          const progress = lvlIdx / (totalLvls - 1);
          multiplier = SCORING_CONFIG.levelMultiplier.first +
            progress * (SCORING_CONFIG.levelMultiplier.last - SCORING_CONFIG.levelMultiplier.first);
        }

        weightedPoints = Math.round(SCORING_CONFIG.baseGoldPoints * starRatio * multiplier * 10) / 10;
      }
    }

    const { data, error } = await supabase
      .from('lsrl_progress')
      .insert({
        username,
        scenario_topic,
        slope_score,
        intercept_score,
        correlation_score,
        hints_used: hints_used || 0,
        star_type: star_type || null,
        all_correct: all_correct || false,
        grading_mode,
        ai_provider,
        level_multiplier: multiplier,
        weighted_points: weightedPoints,
        // v1.4: Track cartridge/mode for future recomputation
        cartridge_id: cartridge_id || null,
        mode_id: mode_id || null,
        level_index: level_index != null ? level_index : null,
        total_levels: total_levels || null
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast star earned if applicable
    if (star_type) {
      broadcast({
        type: 'star_earned',
        username,
        star_type,
        scenario_topic
      });
    }

    // Trigger leaderboard update
    broadcast({ type: 'leaderboard_update' });

    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error('POST /api/progress error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user progress history
app.get('/api/progress/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const { data, error } = await supabase
      .from('lsrl_progress')
      .select('*')
      .eq('username', username)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('GET /api/progress/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user stats
app.get('/api/progress/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;

    const { data, error } = await supabase
      .from('lsrl_progress')
      .select('star_type, all_correct, slope_score, intercept_score, correlation_score')
      .eq('username', username);

    if (error) throw error;

    const stats = {
      totalStars: { gold: 0, silver: 0, bronze: 0, tin: 0 },
      totalAttempts: data.length,
      perfectRuns: 0,
      streaks: { slope: 0, intercept: 0, correlation: 0 }
    };

    for (const p of data) {
      if (p.star_type) {
        stats.totalStars[p.star_type]++;
      }
      if (p.all_correct) {
        stats.perfectRuns++;
      }
    }

    // Calculate current streaks (from most recent backwards)
    const sorted = data.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
    for (const type of ['slope', 'intercept', 'correlation']) {
      for (const p of sorted) {
        if (p[`${type}_score`] === 'E') {
          stats.streaks[type]++;
        } else {
          break;
        }
      }
    }

    res.json(stats);
  } catch (err) {
    console.error('GET /api/progress/:username/stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SYNC ENDPOINT - Reconcile local vs server star counts
// ============================================

app.post('/api/progress/:username/sync', async (req, res) => {
  try {
    const { username } = req.params;
    const { starCounts } = req.body; // { gold: N, silver: N, bronze: N, tin: N }

    if (!starCounts) {
      return res.status(400).json({ error: 'starCounts required' });
    }

    // Get current server counts
    const { data: serverProgress, error: fetchError } = await supabase
      .from('lsrl_progress')
      .select('star_type')
      .eq('username', username)
      .not('star_type', 'is', null);

    if (fetchError) throw fetchError;

    const serverCounts = { gold: 0, silver: 0, bronze: 0, tin: 0 };
    for (const p of serverProgress || []) {
      if (p.star_type && serverCounts[p.star_type] !== undefined) {
        serverCounts[p.star_type]++;
      }
    }

    // Calculate missing stars (local has more than server)
    const missing = {
      gold: Math.max(0, (starCounts.gold || 0) - serverCounts.gold),
      silver: Math.max(0, (starCounts.silver || 0) - serverCounts.silver),
      bronze: Math.max(0, (starCounts.bronze || 0) - serverCounts.bronze),
      tin: Math.max(0, (starCounts.tin || 0) - serverCounts.tin)
    };

    const totalMissing = missing.gold + missing.silver + missing.bronze + missing.tin;

    if (totalMissing > 0) {
      // Insert missing stars as sync records
      const inserts = [];
      for (const [starType, count] of Object.entries(missing)) {
        for (let i = 0; i < count; i++) {
          inserts.push({
            username,
            scenario_topic: 'sync-recovery',
            star_type: starType,
            all_correct: true,
            hints_used: 0,
            grading_mode: 'sync'
          });
        }
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from('lsrl_progress')
          .insert(inserts);

        if (insertError) throw insertError;

        console.log(`[Sync] ${username}: Added ${totalMissing} missing stars`, missing);
        broadcast({ type: 'leaderboard_update' });
      }
    }

    res.json({
      success: true,
      serverCounts,
      localCounts: starCounts,
      synced: totalMissing
    });
  } catch (err) {
    console.error('POST /api/progress/:username/sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// v2.1: GENERIC PROGRESS SYNC ENDPOINT
// Syncs aggregate star counts per cartridge to new user_progress table
// ============================================

app.post('/api/progress/cartridge-sync', async (req, res) => {
  try {
    const { username, cartridgeId, stars, totalWeightedScore, modeProgress } = req.body;

    if (!username || !cartridgeId) {
      return res.status(400).json({ error: 'Missing username or cartridgeId' });
    }

    // Ensure user exists (auto-create if not)
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (!existingUser) {
      const { error: createError } = await supabase
        .from('users')
        .insert({
          username,
          password: 'auto-created',
          user_type: 'student'
        });

      if (createError && !createError.message.includes('duplicate')) {
        console.warn('Auto-create user warning:', createError);
      }
    }

    // Upsert into user_progress table
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        username,
        cartridge_id: cartridgeId,
        gold_stars: stars?.gold || 0,
        silver_stars: stars?.silver || 0,
        bronze_stars: stars?.bronze || 0,
        tin_stars: stars?.tin || 0,
        total_weighted_score: totalWeightedScore || 0,
        mode_progress: modeProgress || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username,cartridge_id'
      })
      .select()
      .single();

    if (error) {
      // Table might not exist yet - log but don't fail
      if (error.code === '42P01') {
        console.warn('[Progress Sync] user_progress table does not exist yet. Run migration 004.');
        return res.json({ success: false, warning: 'Table not found - migration needed' });
      }
      throw error;
    }

    console.log(`[Progress Sync] ${username} synced ${cartridgeId}: ${stars?.gold || 0}G ${stars?.silver || 0}S ${stars?.bronze || 0}B ${stars?.tin || 0}T = ${totalWeightedScore || 0} pts`);

    // Broadcast leaderboard update
    broadcast({ type: 'leaderboard_update' });

    res.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('POST /api/progress/cartridge-sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// LEADERBOARD ENDPOINT
// ============================================

app.get('/api/leaderboard', async (req, res) => {
  try {
    const period = req.query.period || 'all';
    const limit = parseInt(req.query.limit) || 20;

    // Build query with optional time filter
    // Note: weighted_points and level_multiplier columns may not exist yet in DB
    // Include weighted_points for proper scoring
    let query = supabase
      .from('lsrl_progress')
      .select('username, star_type, completed_at, weighted_points')
      .not('star_type', 'is', null);

    // Add time filter for hourly leaderboard
    if (period === '1h' || period === 'hour') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      query = query.gte('completed_at', oneHourAgo);
    }

    const { data: progress, error: progressError } = await query;
    if (progressError) throw progressError;

    // Aggregate by user
    const userStats = {};
    const basePoints = { gold: 4, silver: 3, bronze: 2, tin: 1 };

    for (const p of progress) {
      if (!userStats[p.username]) {
        userStats[p.username] = { gold: 0, silver: 0, bronze: 0, tin: 0, weighted_score: 0 };
      }
      if (p.star_type && userStats[p.username][p.star_type] !== undefined) {
        userStats[p.username][p.star_type]++;
      }

      // Use weighted_points if available, otherwise fall back to base calculation
      if (p.weighted_points != null) {
        userStats[p.username].weighted_score += p.weighted_points;
      } else if (p.star_type) {
        userStats[p.username].weighted_score += basePoints[p.star_type] || 0;
      }
    }

    // Get user real names
    const usernames = Object.keys(userStats);
    let usersMap = {};
    if (usernames.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('username, real_name')
        .in('username', usernames);

      for (const u of users || []) {
        usersMap[u.username] = u.real_name;
      }
    }

    // Format leaderboard
    const leaderboard = Object.entries(userStats).map(([username, stats]) => ({
      username,
      real_name: usersMap[username] || null,
      gold: stats.gold,
      silver: stats.silver,
      bronze: stats.bronze,
      tin: stats.tin,
      weighted_score: Math.round(stats.weighted_score * 10) / 10 // Round to 1 decimal
    }));

    // Sort by weighted score descending
    leaderboard.sort((a, b) => b.weighted_score - a.weighted_score);

    res.json(leaderboard.slice(0, limit));
  } catch (err) {
    console.error('GET /api/leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// v1.3.2: Unified leaderboard - merges Grid Wars + lsrl_progress data
// Shows ALL players who have ever earned points, no limit for all-time
app.get('/api/leaderboard/unified', async (req, res) => {
  try {
    const period = req.query.period; // 'hour', '1h', etc.
    let gameId = req.query.gameId;

    // Auto-detect active game if no gameId provided
    if (!gameId) {
      const { data: activeGame } = await supabase
        .from('grid_wars_games')
        .select('game_id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      gameId = activeGame?.game_id || 'default';
    }

    // For hourly: only show recently active players from Grid Wars
    if (period === 'hour' || period === '1h') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: players, error } = await supabase
        .from('grid_wars_players')
        .select('username, action_points, territories_count, largest_cluster')
        .eq('game_id', gameId)
        .gte('last_answer_at', oneHourAgo)
        .order('action_points', { ascending: false });

      if (error) throw error;

      // Get real names
      const usernames = (players || []).map(p => p.username);
      let usersMap = {};
      if (usernames.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('username, real_name')
          .in('username', usernames);
        for (const u of users || []) {
          usersMap[u.username] = u.real_name;
        }
      }

      return res.json((players || []).map(p => ({
        username: p.username,
        real_name: usersMap[p.username] || null,
        weighted_score: p.action_points || 0,
        territories: p.territories_count || 0,
        cluster: p.largest_cluster || 0,
        gold: 0, silver: 0, bronze: 0, tin: 0
      })));
    }

    // For all-time: merge Grid Wars players + lsrl_progress (for legacy users)
    const playerMap = new Map(); // username -> { points, territories, cluster }

    // 1. Get all Grid Wars players (no limit)
    const { data: gwPlayers, error: gwError } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, largest_cluster')
      .eq('game_id', gameId);

    if (gwError && gwError.code !== '42P01') throw gwError;

    for (const p of gwPlayers || []) {
      playerMap.set(p.username, {
        points: p.action_points || 0,
        territories: p.territories_count || 0,
        cluster: p.largest_cluster || 0
      });
    }

    // 2. Get all star earners from lsrl_progress (for users not in Grid Wars)
    const { data: progress, error: progressError } = await supabase
      .from('lsrl_progress')
      .select('username, star_type, weighted_points')
      .not('star_type', 'is', null);

    if (progressError && progressError.code !== '42P01') throw progressError;

    const basePoints = { gold: 4, silver: 3, bronze: 2, tin: 1 };
    const legacyScores = {};

    for (const p of progress || []) {
      if (!legacyScores[p.username]) {
        legacyScores[p.username] = 0;
      }
      legacyScores[p.username] += p.weighted_points ?? basePoints[p.star_type] ?? 0;
    }

    // Add legacy users who aren't in Grid Wars
    for (const [username, score] of Object.entries(legacyScores)) {
      if (!playerMap.has(username)) {
        playerMap.set(username, { points: score, territories: 0, cluster: 0 });
      }
    }

    // 3. v2.1: Get aggregate progress from user_progress table (for modular platform users)
    const { data: userProgress, error: userProgressError } = await supabase
      .from('user_progress')
      .select('username, total_weighted_score, gold_stars, silver_stars, bronze_stars, tin_stars');

    if (userProgressError && userProgressError.code !== '42P01') {
      // Log error but don't fail - table might not exist yet
      console.warn('user_progress table query error:', userProgressError.message);
    }

    // Merge user_progress scores (add to existing or create new entries)
    for (const p of userProgress || []) {
      const existing = playerMap.get(p.username);
      if (existing) {
        // Add to existing score
        existing.points += parseFloat(p.total_weighted_score) || 0;
        existing.gold = (existing.gold || 0) + (p.gold_stars || 0);
        existing.silver = (existing.silver || 0) + (p.silver_stars || 0);
        existing.bronze = (existing.bronze || 0) + (p.bronze_stars || 0);
        existing.tin = (existing.tin || 0) + (p.tin_stars || 0);
      } else {
        // Create new entry
        playerMap.set(p.username, {
          points: parseFloat(p.total_weighted_score) || 0,
          territories: 0,
          cluster: 0,
          gold: p.gold_stars || 0,
          silver: p.silver_stars || 0,
          bronze: p.bronze_stars || 0,
          tin: p.tin_stars || 0
        });
      }
    }

    // 4. Get all real names
    const usernames = [...playerMap.keys()];
    let usersMap = {};
    if (usernames.length > 0) {
      // Supabase has a limit on IN queries, batch if needed
      const batchSize = 100;
      for (let i = 0; i < usernames.length; i += batchSize) {
        const batch = usernames.slice(i, i + batchSize);
        const { data: users } = await supabase
          .from('users')
          .select('username, real_name')
          .in('username', batch);
        for (const u of users || []) {
          usersMap[u.username] = u.real_name;
        }
      }
    }

    // 5. Build and sort leaderboard
    const leaderboard = [...playerMap.entries()]
      .map(([username, data]) => ({
        username,
        real_name: usersMap[username] || null,
        weighted_score: Math.round((data.points || 0) * 10) / 10,
        territories: data.territories || 0,
        cluster: data.cluster || 0,
        gold: data.gold || 0,
        silver: data.silver || 0,
        bronze: data.bronze || 0,
        tin: data.tin || 0
      }))
      .sort((a, b) => b.weighted_score - a.weighted_score);

    res.json(leaderboard);
  } catch (err) {
    console.error('GET /api/leaderboard/unified error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SETTINGS ENDPOINTS (API key backup)
// ============================================

// Get settings (requires password header)
app.get('/api/settings/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const password = req.headers['x-password'];

    if (!password) {
      return res.status(401).json({ error: 'Password required in x-password header' });
    }

    // Verify password
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('username', username)
      .single();

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('gemini_key, groq_key, preferred_provider')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    res.json(data || { gemini_key: null, groq_key: null, preferred_provider: 'groq' });
  } catch (err) {
    console.error('GET /api/settings/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Save settings
app.post('/api/settings/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const password = req.headers['x-password'];
    const { gemini_key, groq_key, preferred_provider } = req.body;

    if (!password) {
      return res.status(401).json({ error: 'Password required in x-password header' });
    }

    // Verify password
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('username', username)
      .single();

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        username,
        gemini_key,
        groq_key,
        preferred_provider,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/settings/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// AI GRADING QUEUE SYSTEM
// ============================================

// Simple rate-limited queue
class GradingQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.minDelayMs = 1500; // 1.5 seconds between requests (safe for free tiers)
    this.lastRequestTime = 0;
  }

  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();

      // Ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;
      if (timeSinceLast < this.minDelayMs) {
        await new Promise(r => setTimeout(r, this.minDelayMs - timeSinceLast));
      }

      try {
        this.lastRequestTime = Date.now();
        const result = await task();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }

    this.processing = false;
  }

  getQueueLength() {
    return this.queue.length;
  }
}

const gradingQueue = new GradingQueue();

// ============================================
// API KEY POOL MANAGER
// ============================================
class KeyPoolManager {
  constructor() {
    this.keys = { gemini: [], groq: [] };
    this.currentIndex = { gemini: 0, groq: 0 };
    this.cooldownMs = 60000; // 60 second cooldown for rate-limited keys
    this.lastRefresh = 0;
    this.refreshIntervalMs = 30000; // Refresh from DB every 30 seconds
  }

  async refreshKeys() {
    const now = Date.now();
    if (now - this.lastRefresh < this.refreshIntervalMs && this.keys.gemini.length + this.keys.groq.length > 0) {
      return; // Use cached keys
    }

    try {
      const { data, error } = await supabase
        .from('api_keys_pool')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to fetch API keys from pool:', error);
        return;
      }

      // Reset and populate
      this.keys = { gemini: [], groq: [] };
      for (const row of data || []) {
        if (row.provider === 'gemini' || row.provider === 'groq') {
          this.keys[row.provider].push({
            id: row.id,
            key: row.api_key,
            rateLimitedUntil: row.rate_limited_until ? new Date(row.rate_limited_until).getTime() : null
          });
        }
      }

      this.lastRefresh = now;
      console.log(`Key pool refreshed: ${this.keys.gemini.length} Gemini, ${this.keys.groq.length} Groq keys`);
    } catch (err) {
      console.error('Error refreshing key pool:', err);
    }
  }

  async getNextKey(provider) {
    await this.refreshKeys();

    const providerKeys = this.keys[provider];
    if (!providerKeys || providerKeys.length === 0) {
      // Fall back to env var if no pool keys
      if (provider === 'gemini' && GEMINI_API_KEY) return { key: GEMINI_API_KEY, id: null };
      if (provider === 'groq' && GROQ_API_KEY) return { key: GROQ_API_KEY, id: null };
      return null;
    }

    const now = Date.now();
    const startIndex = this.currentIndex[provider];

    // Try to find an available key (not rate limited)
    for (let i = 0; i < providerKeys.length; i++) {
      const idx = (startIndex + i) % providerKeys.length;
      const keyObj = providerKeys[idx];

      if (!keyObj.rateLimitedUntil || keyObj.rateLimitedUntil < now) {
        this.currentIndex[provider] = (idx + 1) % providerKeys.length;
        return keyObj;
      }
    }

    // All keys rate limited - fall back to env var
    if (provider === 'gemini' && GEMINI_API_KEY) return { key: GEMINI_API_KEY, id: null };
    if (provider === 'groq' && GROQ_API_KEY) return { key: GROQ_API_KEY, id: null };

    return null;
  }

  async markRateLimited(keyId) {
    if (!keyId) return; // Env var key, can't update

    const rateLimitedUntil = new Date(Date.now() + this.cooldownMs).toISOString();

    // Update local cache
    for (const provider of ['gemini', 'groq']) {
      const keyObj = this.keys[provider].find(k => k.id === keyId);
      if (keyObj) {
        keyObj.rateLimitedUntil = Date.now() + this.cooldownMs;
        break;
      }
    }

    // Update database
    try {
      await supabase.rpc('increment_key_failures', { key_id: keyId, limit_until: rateLimitedUntil });
      console.log(`Marked key ${keyId} as rate limited until ${rateLimitedUntil}`);
    } catch (err) {
      // Fallback: just update the rate limit time without incrementing
      try {
        await supabase
          .from('api_keys_pool')
          .update({ rate_limited_until: rateLimitedUntil })
          .eq('id', keyId);
      } catch (e) {
        console.error('Failed to update rate limit status:', e);
      }
    }
  }

  async markUsed(keyId) {
    if (!keyId) return;

    try {
      await supabase.rpc('increment_key_uses', { key_id: keyId });
    } catch (err) {
      // Fallback: just update last_used_at
      try {
        await supabase
          .from('api_keys_pool')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', keyId);
      } catch (e) {
        // Non-critical, just log
        console.error('Failed to update key usage:', e);
      }
    }
  }

  getStats() {
    const now = Date.now();
    return {
      gemini: {
        total: this.keys.gemini.length,
        available: this.keys.gemini.filter(k => !k.rateLimitedUntil || k.rateLimitedUntil < now).length
      },
      groq: {
        total: this.keys.groq.length,
        available: this.keys.groq.filter(k => !k.rateLimitedUntil || k.rateLimitedUntil < now).length
      },
      hasEnvKeys: { gemini: !!GEMINI_API_KEY, groq: !!GROQ_API_KEY }
    };
  }
}

const keyPool = new KeyPoolManager();

// ============================================
// AI API HELPERS
// ============================================

function isRateLimitError(errorMessage) {
  const msg = errorMessage.toLowerCase();
  return msg.includes('quota') || msg.includes('limit') ||
         msg.includes('429') || msg.includes('rate') ||
         msg.includes('resource exhausted');
}

function extractAndParseJSON(text) {
  // First try direct extraction and parsing
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Direct JSON parse failed, attempting repair...');
  }

  // Try to repair common JSON issues
  try {
    let jsonStr = text.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) return null;

    // Fix smart quotes
    jsonStr = jsonStr.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    // Fix unescaped quotes in strings (basic attempt)
    jsonStr = jsonStr.replace(/:\s*"([^"]*?)(?<!\\)"([^"]*?)"/g, ': "$1\\"$2"');
    // Remove trailing commas
    jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

    return JSON.parse(jsonStr);
  } catch (e) {
    console.log('JSON repair failed, trying regex extraction...');
  }

  // Last resort: extract scores via regex
  try {
    const slopeMatch = text.match(/slope[^}]*score["\s:]+([EPI])/i);
    const interceptMatch = text.match(/intercept[^}]*score["\s:]+([EPI])/i);
    const correlationMatch = text.match(/correlation[^}]*score["\s:]+([EPI])/i);

    if (slopeMatch && interceptMatch && correlationMatch) {
      return {
        slope: { score: slopeMatch[1].toUpperCase(), feedback: 'Score extracted from response' },
        intercept: { score: interceptMatch[1].toUpperCase(), feedback: 'Score extracted from response' },
        correlation: { score: correlationMatch[1].toUpperCase(), feedback: 'Score extracted from response' },
        _extracted: true
      };
    }
  } catch (e) {
    console.log('Regex extraction failed');
  }

  return null;
}

async function callGemini(prompt, apiKey) {
  if (!apiKey) throw new Error('Gemini API key not provided');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
      })
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini: ${data.error.message}`);
  }

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Gemini: Empty response');
  }

  const text = data.candidates[0].content.parts[0].text;
  console.log('Gemini raw response:', text.substring(0, 200));

  const parsed = extractAndParseJSON(text);
  if (parsed && isValidGradingResponse(parsed)) {
    return normalizeGradingResponse(parsed);  // v1.6.2: Normalize to field-keyed format
  }
  throw new Error('Gemini: Invalid response structure');
}

async function callGroq(prompt, apiKey) {
  if (!apiKey) throw new Error('Groq API key not provided');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an AP Statistics grader. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1500
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Groq: ${data.error.message}`);
  }

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Groq: Empty response');
  }

  const text = data.choices[0].message.content;
  console.log('Groq raw response:', text.substring(0, 200));

  const parsed = extractAndParseJSON(text);
  if (parsed && isValidGradingResponse(parsed)) {
    return normalizeGradingResponse(parsed);  // v1.6.2: Normalize to field-keyed format
  }
  throw new Error('Groq: Invalid response structure');
}

/**
 * v1.6.2: Normalize grading response to consistent field-keyed format
 * Handles both direct { score, feedback } and field-keyed { fieldId: { score, feedback } }
 * @param {object} parsed - The parsed AI response
 * @param {string} defaultFieldId - Field ID to use for direct format (default: 'answer')
 * @returns {object} Normalized response in field-keyed format
 */
function normalizeGradingResponse(parsed, defaultFieldId = 'answer') {
  if (!parsed || typeof parsed !== 'object') return parsed;

  const validScores = ['E', 'P', 'I', 'e', 'p', 'i'];

  // Check if it's direct format: { score, feedback }
  if ('score' in parsed && validScores.includes(parsed.score)) {
    // Transform to field-keyed format
    console.log(`[AI] Normalizing direct format to field-keyed (${defaultFieldId})`);
    return {
      [defaultFieldId]: {
        score: parsed.score.toUpperCase(),
        feedback: parsed.feedback || ''
      }
    };
  }

  // Already in field-keyed format or some other format
  return parsed;
}

/**
 * Check if a parsed response is a valid grading response
 * Accepts responses for any cartridge (LSRL, residuals, etc.)
 * v1.6.2: Also accepts direct { score, feedback } format for single-field questions
 */
function isValidGradingResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;

  const validScores = ['E', 'P', 'I', 'e', 'p', 'i'];

  // v1.6.2: Check for direct score/feedback format (single-field questions)
  // Format: { "score": "E", "feedback": "..." }
  if ('score' in parsed && validScores.includes(parsed.score)) {
    return true;
  }

  // Check for field-keyed format: { "fieldId": { "score": "E", "feedback": "..." } }
  for (const [key, value] of Object.entries(parsed)) {
    // Skip metadata fields
    if (key.startsWith('_')) continue;

    // Check if this field has a valid score
    if (value && typeof value === 'object' && 'score' in value) {
      if (validScores.includes(value.score)) {
        return true; // Found at least one valid graded field
      }
    }
  }

  return false;
}

async function gradeWithAI(prompt, preferredProvider = null) {
  // Try providers with key rotation from pool
  // If a preferred provider is specified, try it first
  let providers = ['groq', 'gemini']; // Default: prefer Groq for speed
  if (preferredProvider === 'gemini') {
    providers = ['gemini', 'groq'];
  } else if (preferredProvider === 'groq') {
    providers = ['groq', 'gemini'];
  }
  let lastError = null;

  for (const provider of providers) {
    // Try up to 3 keys per provider
    for (let attempt = 0; attempt < 3; attempt++) {
      const keyObj = await keyPool.getNextKey(provider);
      if (!keyObj) break; // No keys available for this provider

      try {
        console.log(`Trying ${provider} (key ${keyObj.id || 'env'}, attempt ${attempt + 1})`);

        const result = provider === 'groq'
          ? await callGroq(prompt, keyObj.key)
          : await callGemini(prompt, keyObj.key);

        // Success - mark key as used
        await keyPool.markUsed(keyObj.id);
        result._provider = provider;
        result._keyId = keyObj.id;
        // v2.0.1: Include model info for AI feedback panel
        result._model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash';
        return result;

      } catch (err) {
        lastError = err;
        console.warn(`${provider} failed (key ${keyObj.id || 'env'}):`, err.message);

        // Determine if we should try the next key or move to next provider
        const shouldRetryKey = isRateLimitError(err.message) ||
                               isInvalidResponseError(err.message) ||
                               isTemporaryError(err.message);

        if (isRateLimitError(err.message)) {
          await keyPool.markRateLimited(keyObj.id);
        }

        if (shouldRetryKey) {
          // Continue to try next key
          console.log(`Will retry with next key for ${provider}`);
          continue;
        } else {
          // Permanent error for this provider - move to next provider
          console.log(`Moving to next provider after error: ${err.message}`);
          break;
        }
      }
    }
  }

  // All attempts failed
  throw lastError || new Error('No AI providers available');
}

/**
 * Check if error indicates invalid/malformed response (should retry with different key)
 */
function isInvalidResponseError(message) {
  const invalidPatterns = [
    'Invalid response structure',
    'Empty response',
    'Failed to parse',
    'JSON',
    'unexpected token'
  ];
  return invalidPatterns.some(p => message.toLowerCase().includes(p.toLowerCase()));
}

/**
 * Check if error is temporary (network issues, etc.)
 */
function isTemporaryError(message) {
  const tempPatterns = [
    'timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'network',
    'fetch failed',
    '503',
    '502',
    '500'
  ];
  return tempPatterns.some(p => message.toLowerCase().includes(p.toLowerCase()));
}


// ============================================
// PROMPT BUILDERS
// ============================================

function buildGradingPrompt(scenario, answers) {
  const direction = scenario.slope > 0 ? 'increases' : 'decreases';
  const oppositeDirection = scenario.slope > 0 ? 'decreases' : 'increases';
  const rDirection = scenario.r > 0 ? 'positive' : 'negative';
  const absR = Math.abs(scenario.r);
  const strength = absR < 0.4 ? 'weak' : absR < 0.7 ? 'moderate' : 'strong';
  const slopeAbs = Math.abs(scenario.slope);

  return `You are an AP Statistics teacher grading LSRL interpretations. BE LENIENT - reward understanding over exact wording.

## Context
Topic: ${scenario.topic}
X: ${scenario.xVar} (${scenario.xUnits})
Y: ${scenario.yVar} (${scenario.yUnits})
Equation: ŷ = ${scenario.intercept} + ${scenario.slope}x
r = ${scenario.r}

## CORRECT ANSWERS (use these to grade)

### SLOPE - Correct Thinking Process:
The slope b = ${scenario.slope} means:
"For every 1 ${scenario.xUnits} increase in ${scenario.xVar}, the PREDICTED ${scenario.yVar} ${direction} by ${slopeAbs} ${scenario.yUnits}, on average."

Key elements: (1) "predicted" or "on average", (2) direction "${direction}", (3) value ${slopeAbs}, (4) both variables, (5) "for every 1"

Student wrote: "${answers.slope}"

### Y-INTERCEPT - Correct Thinking Process:
${scenario.isInterceptMeaningful
    ? `The intercept ${scenario.intercept} IS meaningful:
"When ${scenario.xVar} is 0 ${scenario.xUnits}, the predicted ${scenario.yVar} is ${scenario.intercept} ${scenario.yUnits}."

Key elements: (1) reference x=0, (2) "predicted", (3) value ${scenario.intercept}, (4) y-variable name`
    : `The intercept ${scenario.intercept} is NOT meaningful because ${scenario.interceptReason}.
Correct answer: "There is no meaningful interpretation because ${scenario.interceptReason}."

Key elements: (1) state no meaningful interpretation, (2) explain WHY (x=0 is outside data range or impossible)`}

Student wrote: "${answers.intercept}"

### CORRELATION - Correct Thinking Process:
r = ${scenario.r} means:
"There is a ${strength}, ${rDirection}, LINEAR relationship between ${scenario.xVar} and ${scenario.yVar}."

Key elements: (1) "linear" (MANDATORY), (2) strength "${strength}", (3) direction "${rDirection}", (4) both variables, (5) "relationship" or "association"

NEVER accept: "causes", "proves", "determines" (these imply causation!)

Student wrote: "${answers.correlation}"

## Grading Rules
- E: Has most key elements, shows understanding
- P: Missing 1-2 elements, or minor errors
- I: Missing critical elements, wrong direction, or implies causation

BE GENEROUS: Accept synonyms, rounding differences, unit conversions (e.g., "1000 dollars" = "1 thousand dollars")

## Response (ONLY JSON, no other text):
{"slope":{"score":"E","feedback":"Good interpretation!"},"intercept":{"score":"E","feedback":"Correct!"},"correlation":{"score":"E","feedback":"Well done!"}}`;
}

// buildCartridgePrompt is imported from prompt-utils.js

function buildParagraphPrompt(scenario, paragraph) {
  const direction = scenario.slope > 0 ? 'increases' : 'decreases';
  const rDirection = scenario.r > 0 ? 'positive' : 'negative';
  const absR = Math.abs(scenario.r);
  const strength = absR < 0.4 ? 'weak' : absR < 0.7 ? 'moderate' : 'strong';

  return `You are an AP Statistics grader. Grade this SINGLE PARAGRAPH that should contain interpretations for slope, y-intercept, and correlation.
BE LENIENT - focus on conceptual understanding, not exact wording.

CONTEXT:
- Topic: ${scenario.topic}
- X variable: ${scenario.xVar} (${scenario.xUnits})
- Y variable: ${scenario.yVar} (${scenario.yUnits})
- Regression equation: ŷ = ${scenario.intercept} + ${scenario.slope}x
- Correlation: r = ${scenario.r}
- Y-intercept meaningful: ${scenario.isInterceptMeaningful ? 'Yes' : 'No - ' + scenario.interceptReason}

STUDENT'S PARAGRAPH:
"${paragraph}"

YOUR TASK:
1. Identify the three components in the paragraph: slope interpretation, y-intercept interpretation, and correlation interpretation
2. Grade each component separately using E/P/I scoring

GRADING CRITERIA:
- SLOPE: "predicted/on average", direction "${direction}", value, both variables, "for every 1 unit"
- Y-INTERCEPT: ${scenario.isInterceptMeaningful ? 'x=0 reference with prediction language' : 'Must state no meaningful interpretation'}
- CORRELATION: "linear" (MANDATORY), "${strength}", "${rDirection}", both variables

Respond with ONLY this JSON:
{
  "slope": {"score": "E/P/I", "feedback": "..."},
  "intercept": {"score": "E/P/I", "feedback": "..."},
  "correlation": {"score": "E/P/I", "feedback": "..."}
}`;
}

// ============================================
// AI GRADING ENDPOINTS
// ============================================

// Check AI availability and pool stats
app.get('/api/ai/status', async (req, res) => {
  await keyPool.refreshKeys();
  const poolStats = keyPool.getStats();

  res.json({
    available: poolStats.gemini.total > 0 || poolStats.groq.total > 0 ||
               poolStats.hasEnvKeys.gemini || poolStats.hasEnvKeys.groq,
    pool: poolStats,
    queueLength: gradingQueue.getQueueLength()
  });
});

// Contribute API key to pool
app.post('/api/ai/contribute-key', async (req, res) => {
  try {
    const { provider, apiKey, username } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Missing provider or apiKey' });
    }

    if (!['gemini', 'groq'].includes(provider)) {
      return res.status(400).json({ error: 'Provider must be gemini or groq' });
    }

    // Basic key format validation
    if (provider === 'gemini' && !apiKey.startsWith('AIza')) {
      return res.status(400).json({ error: 'Invalid Gemini key format' });
    }
    if (provider === 'groq' && !apiKey.startsWith('gsk_')) {
      return res.status(400).json({ error: 'Invalid Groq key format' });
    }

    // Upsert to pool (update if exists, insert if new)
    const { data, error } = await supabase
      .from('api_keys_pool')
      .upsert({
        provider,
        api_key: apiKey,
        contributed_by: username || null,
        is_active: true,
        rate_limited_until: null // Reset rate limit on re-contribution
      }, {
        onConflict: 'provider,api_key'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to contribute key:', error);
      return res.status(500).json({ error: 'Failed to save key' });
    }

    // Force refresh of key pool
    keyPool.lastRefresh = 0;
    await keyPool.refreshKeys();

    console.log(`Key contributed by ${username || 'anonymous'} for ${provider}`);
    res.json({ success: true, message: 'Key added to pool' });
  } catch (err) {
    console.error('Contribute key error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Grade 3-part answers
app.post('/api/ai/grade', async (req, res) => {
  try {
    const { scenario, answers, preferProvider, aiPromptTemplate, cartridgeId } = req.body;

    if (!scenario || !answers) {
      return res.status(400).json({ error: 'Missing scenario or answers' });
    }

    // Check if we have any keys available (pool or env)
    await keyPool.refreshKeys();
    const stats = keyPool.getStats();
    const hasKeys = stats.gemini.total > 0 || stats.groq.total > 0 ||
                    stats.hasEnvKeys.gemini || stats.hasEnvKeys.groq;

    if (!hasKeys) {
      return res.status(503).json({ error: 'No AI providers configured' });
    }

    // Use cartridge-specific prompt template if provided, otherwise use default LSRL prompt
    let prompt;
    if (aiPromptTemplate && cartridgeId && cartridgeId !== 'lsrl-interpretation') {
      prompt = buildCartridgePrompt(aiPromptTemplate, scenario, answers);
      console.log(`Using cartridge-specific prompt for ${cartridgeId}`);
    } else {
      prompt = buildGradingPrompt(scenario, answers);
    }

    const queuePos = gradingQueue.getQueueLength();
    console.log(`Grading request queued (position ${queuePos}): ${scenario.topic}, cartridge: ${cartridgeId || 'lsrl'}, prefer: ${preferProvider || 'auto'}`);

    const result = await gradingQueue.add(() => gradeWithAI(prompt, preferProvider));

    // v2.1.1: Remap 'answer' field ID to actual field ID from request
    // normalizeGradingResponse defaults to 'answer' but client expects the actual field ID
    const actualFieldId = scenario.fieldId || Object.keys(answers)[0];
    if (result.answer && actualFieldId && actualFieldId !== 'answer') {
      console.log(`[AI] Remapping field ID: 'answer' -> '${actualFieldId}'`);
      result[actualFieldId] = result.answer;
      delete result.answer;
    }

    result._gradingMode = 'ai';
    result._serverGraded = true;

    res.json(result);
  } catch (err) {
    console.error('AI grading error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Grade paragraph
app.post('/api/ai/grade-paragraph', async (req, res) => {
  try {
    const { scenario, paragraph, preferProvider } = req.body;

    if (!scenario || !paragraph) {
      return res.status(400).json({ error: 'Missing scenario or paragraph' });
    }

    // Check if we have any keys available (pool or env)
    await keyPool.refreshKeys();
    const stats = keyPool.getStats();
    const hasKeys = stats.gemini.total > 0 || stats.groq.total > 0 ||
                    stats.hasEnvKeys.gemini || stats.hasEnvKeys.groq;

    if (!hasKeys) {
      return res.status(503).json({ error: 'No AI providers configured' });
    }

    const prompt = buildParagraphPrompt(scenario, paragraph);
    const queuePos = gradingQueue.getQueueLength();

    console.log(`Paragraph grading request queued (position ${queuePos}): ${scenario.topic}, prefer: ${preferProvider || 'auto'}`);

    const result = await gradingQueue.add(() => gradeWithAI(prompt, preferProvider));

    result._gradingMode = 'ai';
    result._serverGraded = true;

    res.json(result);
  } catch (err) {
    console.error('AI paragraph grading error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// AI APPEAL ENDPOINT
// ============================================

app.post('/api/ai/appeal', async (req, res) => {
  try {
    const { scenario, answers, appealText, previousResults, preferProvider, aiPromptTemplate, cartridgeId } = req.body;

    if (!scenario || !answers || !appealText) {
      return res.status(400).json({ error: 'Missing scenario, answers, or appeal text' });
    }

    // Check if we have any keys available
    await keyPool.refreshKeys();
    const stats = keyPool.getStats();
    const hasKeys = stats.gemini.total > 0 || stats.groq.total > 0 ||
                    stats.hasEnvKeys.gemini || stats.hasEnvKeys.groq;

    if (!hasKeys) {
      return res.status(503).json({ error: 'No AI providers configured' });
    }

    // Build appeal prompt
    const prompt = buildAppealPrompt(scenario, answers, appealText, previousResults);
    const queuePos = gradingQueue.getQueueLength();

    console.log(`Appeal request queued (position ${queuePos}): ${scenario.topic}, cartridge: ${cartridgeId || 'unknown'}`);

    const result = await gradingQueue.add(() => gradeWithAI(prompt, preferProvider));

    // v2.1.1: Remap 'answer' field ID to actual field ID from request (consistency with /api/ai/grade)
    const actualFieldId = Object.keys(answers)[0];
    if (result.answer && actualFieldId && actualFieldId !== 'answer') {
      console.log(`[AI Appeal] Remapping field ID: 'answer' -> '${actualFieldId}'`);
      result[actualFieldId] = result.answer;
      delete result.answer;
    }

    result._gradingMode = 'ai-appeal';
    result._serverGraded = true;
    result._appealProcessed = true;

    res.json(result);
  } catch (err) {
    console.error('AI appeal error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Build prompt for AI appeal re-evaluation
 */
function buildAppealPrompt(scenario, answers, appealText, previousResults) {
  // Format previous results
  const previousFeedbackLines = previousResults ?
    Object.entries(previousResults).map(([field, result]) =>
      `- ${field}: Score=${result.score}, Feedback="${result.feedback || 'No feedback'}"`
    ).join('\n') : 'No previous results available';

  // Format student answers
  const studentAnswers = Object.entries(answers)
    .map(([field, value]) => `- ${field}: "${value}"`)
    .join('\n');

  return `You are an AP Statistics teacher reviewing a student's APPEAL of their grade.

## Context
Topic: ${scenario.topic || 'Statistics Practice'}
Mode: ${scenario.mode || 'Practice'}
${scenario.r ? `r = ${scenario.r}` : ''}
${scenario.slope ? `Slope = ${scenario.slope}` : ''}
${scenario.givenValues ? `Given: ${scenario.givenValues}` : ''}

## Student's Answers
${studentAnswers}

## Previous AI Grading
${previousFeedbackLines}

## Student's Appeal
The student disagrees with the grading and explains:
"${appealText}"

## Your Task
Carefully reconsider the student's answers in light of their explanation. The student may have:
1. Valid reasoning that wasn't initially recognized
2. Used correct but different terminology
3. Made a valid point that deserves reconsideration
4. Misunderstood the question (in which case, explain clearly)

Be FAIR but also ACCURATE. If the student's reasoning is sound, upgrade their score. If they're still incorrect, explain why clearly and kindly.

Respond with ONLY valid JSON in this format:
{
  "fieldName": {"score": "E/P/I", "feedback": "Explanation addressing the appeal"},
  "appealResponse": "Overall response to the student's appeal explaining your decision"
}

Example:
{"slopeEffect": {"score": "E", "feedback": "After reviewing your explanation, you're correct - the point is above the line on the right side, so removing it would decrease the slope."}, "appealResponse": "Good catch! Your reasoning about the point's position relative to the line was correct. I've updated your grade."}`;
}

// ============================================
// TEACHER REVIEW ENDPOINTS
// ============================================

// Submit work for teacher review
app.post('/api/teacher-review', async (req, res) => {
  try {
    const { results, problem, answers, expectedAnswers, cartridgeId, cartridgeName, modeId, fieldIds, timestamp, username } = req.body;

    if (!username || !answers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store the review request with new fields for answer key
    const { data, error } = await supabase
      .from('teacher_reviews')
      .insert({
        username,
        scenario_topic: problem?.context?.topic || 'Unknown',
        scenario_context: problem?.context || {},
        student_answers: answers,
        expected_answers: expectedAnswers || problem?.answers || {},
        keyword_results: results?.fields || {},
        cartridge_id: cartridgeId || 'lsrl-interpretation',
        cartridge_name: cartridgeName || 'LSRL Interpretation',
        mode_id: modeId || 'interpret',
        field_ids: fieldIds || Object.keys(answers),
        status: 'pending',
        submitted_at: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Teacher review insert error:', error);
      // If table doesn't exist, create a simple in-memory fallback
      if (error.code === '42P01') {
        console.log('teacher_reviews table does not exist, using fallback');
        return res.json({
          success: true,
          id: `temp-${Date.now()}`,
          message: 'Submitted (table pending setup)'
        });
      }
      throw error;
    }

    // Notify teachers via WebSocket
    broadcast({
      type: 'teacher_review_submitted',
      username,
      topic: problem?.context?.topic,
      reviewId: data.id
    });

    console.log(`Teacher review submitted by ${username} for ${problem?.context?.topic}`);
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error('POST /api/teacher-review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get pending reviews (teacher only)
app.get('/api/teacher-review', async (req, res) => {
  try {
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher password required' });
    }

    const status = req.query.status || 'pending';

    // First get the reviews
    const { data: reviews, error } = await supabase
      .from('teacher_reviews')
      .select('*')
      .eq('status', status)
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return res.json([]);
      }
      throw error;
    }

    // Then get the real names for the usernames
    if (reviews && reviews.length > 0) {
      const usernames = [...new Set(reviews.map(r => r.username))];
      const { data: users } = await supabase
        .from('users')
        .select('username, real_name')
        .in('username', usernames);

      const userMap = {};
      (users || []).forEach(u => {
        userMap[u.username] = u.real_name;
      });

      // Attach real_name to each review
      reviews.forEach(r => {
        r.real_name = userMap[r.username] || null;
      });
    }

    res.json(reviews || []);
  } catch (err) {
    console.error('GET /api/teacher-review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit teacher's grade for a review
app.put('/api/teacher-review/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const password = req.headers['x-teacher-password'];
    const { grades, feedback, teacher_notes } = req.body;

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher password required' });
    }

    if (!grades) {
      return res.status(400).json({ error: 'Grades required' });
    }

    const { data, error } = await supabase
      .from('teacher_reviews')
      .update({
        teacher_grades: grades,
        teacher_feedback: feedback || null,
        teacher_notes: teacher_notes || null,
        status: 'reviewed',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify the student via WebSocket
    broadcast({
      type: 'teacher_review_completed',
      username: data.username,
      reviewId: id,
      grades
    });

    console.log(`Teacher reviewed submission ${id} for ${data.username}`);
    res.json({ success: true, data });
  } catch (err) {
    console.error('PUT /api/teacher-review/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get reviews for a specific student
app.get('/api/teacher-review/student/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const { data, error } = await supabase
      .from('teacher_reviews')
      .select('*')
      .eq('username', username)
      .order('submitted_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (err) {
    console.error('GET /api/teacher-review/student/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TIME TRACKING ENDPOINTS
// ============================================

// Store/update session time
app.post('/api/time-tracking/session', async (req, res) => {
  try {
    const { username, sessionId, sessionStartTime, activeTimeMs, totalTimeMs, isFinal } = req.body;

    if (!username || !sessionId) {
      return res.status(400).json({ error: 'Username and sessionId required' });
    }

    // Upsert session data
    const { data, error } = await supabase
      .from('time_sessions')
      .upsert({
        session_id: sessionId,
        username,
        session_start: sessionStartTime,
        active_time_ms: activeTimeMs,
        total_time_ms: totalTimeMs,
        last_sync: new Date().toISOString(),
        is_complete: isFinal || false
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (error) {
      // Table might not exist - create fallback response
      if (error.code === '42P01') {
        console.log('time_sessions table does not exist');
        return res.json({ success: true, message: 'Table pending setup' });
      }
      throw error;
    }

    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error('POST /api/time-tracking/session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Store problem time
app.post('/api/time-tracking/problem', async (req, res) => {
  try {
    const { username, sessionId, problemId, cartridgeId, modeId, activeTimeMs, totalTimeMs, completed, result } = req.body;

    if (!username || !sessionId) {
      return res.status(400).json({ error: 'Username and sessionId required' });
    }

    const { data, error } = await supabase
      .from('time_problems')
      .insert({
        session_id: sessionId,
        username,
        problem_id: problemId,
        cartridge_id: cartridgeId,
        mode_id: modeId,
        active_time_ms: activeTimeMs,
        total_time_ms: totalTimeMs,
        completed,
        result: result ? JSON.stringify(result) : null,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return res.json({ success: true, message: 'Table pending setup' });
      }
      throw error;
    }

    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error('POST /api/time-tracking/problem error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get time stats for a user (teacher or self)
app.get('/api/time-tracking/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const period = req.query.period || 'all'; // today, week, all

    let dateFilter = null;
    if (period === 'today') {
      dateFilter = new Date();
      dateFilter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    }

    // Get sessions
    let sessionsQuery = supabase
      .from('time_sessions')
      .select('*')
      .eq('username', username)
      .order('session_start', { ascending: false });

    if (dateFilter) {
      sessionsQuery = sessionsQuery.gte('session_start', dateFilter.toISOString());
    }

    const { data: sessions, error: sessionsError } = await sessionsQuery.limit(100);

    if (sessionsError) {
      if (sessionsError.code === '42P01') {
        return res.json({ sessions: [], problems: [], summary: { totalActiveMs: 0, sessionCount: 0 } });
      }
      throw sessionsError;
    }

    // Get problems
    let problemsQuery = supabase
      .from('time_problems')
      .select('*')
      .eq('username', username)
      .order('completed_at', { ascending: false });

    if (dateFilter) {
      problemsQuery = problemsQuery.gte('completed_at', dateFilter.toISOString());
    }

    const { data: problems, error: problemsError } = await problemsQuery.limit(500);

    if (problemsError && problemsError.code !== '42P01') {
      throw problemsError;
    }

    // Calculate summary
    const totalActiveMs = (sessions || []).reduce((sum, s) => sum + (s.active_time_ms || 0), 0);
    const totalProblems = (problems || []).length;
    const completedProblems = (problems || []).filter(p => p.completed).length;
    const avgProblemTimeMs = completedProblems > 0
      ? (problems || []).filter(p => p.completed).reduce((sum, p) => sum + (p.active_time_ms || 0), 0) / completedProblems
      : 0;

    res.json({
      sessions: sessions || [],
      problems: problems || [],
      summary: {
        totalActiveMs,
        sessionCount: (sessions || []).length,
        totalProblems,
        completedProblems,
        avgProblemTimeMs
      }
    });
  } catch (err) {
    console.error('GET /api/time-tracking/user/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get class time summary (teacher only)
app.get('/api/time-tracking/class-summary', async (req, res) => {
  try {
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher password required' });
    }

    const period = req.query.period || 'today';
    let dateFilter = new Date();

    if (period === 'today') {
      dateFilter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else {
      dateFilter = new Date(0); // All time
    }

    // Get all sessions grouped by user
    const { data: sessions, error } = await supabase
      .from('time_sessions')
      .select('username, active_time_ms, session_start')
      .gte('session_start', dateFilter.toISOString())
      .order('session_start', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return res.json({ students: [], totalClassTime: 0 });
      }
      throw error;
    }

    // Aggregate by username
    const userTimes = {};
    for (const session of (sessions || [])) {
      if (!userTimes[session.username]) {
        userTimes[session.username] = {
          username: session.username,
          totalActiveMs: 0,
          sessionCount: 0,
          lastActive: session.session_start
        };
      }
      userTimes[session.username].totalActiveMs += session.active_time_ms || 0;
      userTimes[session.username].sessionCount++;
      if (session.session_start > userTimes[session.username].lastActive) {
        userTimes[session.username].lastActive = session.session_start;
      }
    }

    // Get problem counts per user
    const { data: problems } = await supabase
      .from('time_problems')
      .select('username, completed')
      .gte('completed_at', dateFilter.toISOString());

    for (const problem of (problems || [])) {
      if (userTimes[problem.username]) {
        if (!userTimes[problem.username].problemsAttempted) {
          userTimes[problem.username].problemsAttempted = 0;
          userTimes[problem.username].problemsCompleted = 0;
        }
        userTimes[problem.username].problemsAttempted++;
        if (problem.completed) {
          userTimes[problem.username].problemsCompleted++;
        }
      }
    }

    // Convert to array and sort by time
    const students = Object.values(userTimes).sort((a, b) => b.totalActiveMs - a.totalActiveMs);
    const totalClassTime = students.reduce((sum, s) => sum + s.totalActiveMs, 0);

    res.json({
      students,
      totalClassTime,
      period
    });
  } catch (err) {
    console.error('GET /api/time-tracking/class-summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GRID WARS ENDPOINTS
// ============================================
// v1.6.1: Config now imported from shared/gridwars.config.js

// ============================================
// v1.5.1: VELOCITY PERSISTENCE (Supabase-backed)
// Replaced in-memory pointEvents Map with Supabase table
// ============================================

/**
 * Record a point earning event for velocity tracking (persisted to Supabase)
 * v1.5.1: Now writes to point_events table instead of in-memory
 */
async function recordPointEvent(gameId, username, delta, reason = 'star_earned', cartridgeId = null) {
  if (!GRID_WARS_CONFIG.velocityEnabled) return;

  try {
    // v1.6.2: Use player_id column name (matches actual Supabase schema)
    await supabase.from('point_events').insert({
      game_id: gameId,
      player_id: username,
      delta: delta,
      reason: reason,
      cartridge_id: cartridgeId,
      metadata: {}
    });
  } catch (err) {
    console.error('Failed to record point event:', err.message);
    // Non-fatal: velocity will be slightly off but game continues
  }
}

/**
 * Calculate player's velocity (points per minute over window)
 * v1.5.1: Now queries Supabase instead of in-memory
 * @returns {Promise<number>} Points per minute
 */
async function getPlayerVelocity(gameId, username) {
  if (!GRID_WARS_CONFIG.velocityEnabled) return 0;

  const windowMinutes = GRID_WARS_CONFIG.velocityWindowMinutes || 10;
  const windowMs = windowMinutes * 60 * 1000;
  const cutoffTime = new Date(Date.now() - windowMs).toISOString();

  try {
    // v1.6.2: Use player_id column name (matches actual Supabase schema)
    const { data, error } = await supabase
      .from('point_events')
      .select('delta')
      .eq('game_id', gameId)
      .eq('player_id', username)
      .gt('created_at', cutoffTime)
      .gt('delta', 0);

    if (error) {
      console.error('Failed to get velocity:', error.message);
      return 0;
    }

    const totalPoints = (data || []).reduce((sum, e) => sum + e.delta, 0);
    return totalPoints / windowMinutes;
  } catch (err) {
    console.error('Velocity calculation error:', err.message);
    return 0;
  }
}

/**
 * Get velocity tier and discount for a player
 * @returns {object} { tier, discount, message }
 */
function getVelocityTier(velocity) {
  if (!GRID_WARS_CONFIG.velocityEnabled) {
    return { tier: 'DISABLED', discount: 0, message: null };
  }

  const tiers = GRID_WARS_CONFIG.velocityTiers;

  if (velocity >= tiers.BLAZING.min) {
    return { tier: 'BLAZING', ...tiers.BLAZING };
  } else if (velocity >= tiers.FLOWING.min) {
    return { tier: 'FLOWING', ...tiers.FLOWING };
  } else if (velocity >= tiers.ACTIVE.min) {
    return { tier: 'ACTIVE', ...tiers.ACTIVE };
  }

  return { tier: 'IDLE', ...tiers.IDLE };
}

// ============================================
// v1.5: GUERRILLA WARFARE
// ============================================

/**
 * Get guerrilla discount based on attacker vs defender territory size
 * @param {number} attackerCells - Attacker's territory count
 * @param {number} defenderCells - Defender's territory count
 * @returns {object} { discount, message } or { discount: 0, message: null }
 */
function getGuerrillaDiscount(attackerCells, defenderCells) {
  if (!GRID_WARS_CONFIG.guerrillaEnabled) {
    return { discount: 0, message: null };
  }

  const tiers = GRID_WARS_CONFIG.guerrillaTiers;

  // Check tiers in order (most restrictive first for best discount)
  for (const tier of tiers) {
    if (attackerCells <= tier.attackerMax && defenderCells >= tier.defenderMin) {
      return { discount: tier.discount, message: tier.message };
    }
  }

  return { discount: 0, message: null };
}

// ============================================
// v1.5: OVEREXTENSION PENALTY
// ============================================

/**
 * Calculate defense penalty for a cell based on its isolation
 * @param {string} gameId
 * @param {number} x
 * @param {number} y
 * @param {string} owner
 * @returns {Promise<object>} { discount, reason }
 */
async function getOverextensionDiscount(gameId, x, y, owner) {
  if (!GRID_WARS_CONFIG.overextensionEnabled) {
    return { discount: 0, reason: null };
  }

  // Get owner's territories
  const { data: territories } = await supabase
    .from('grid_wars_territories')
    .select('x, y')
    .eq('game_id', gameId)
    .eq('owner', owner);

  if (!territories || territories.length <= 1) {
    return { discount: 0, reason: null };
  }

  const ownedSet = new Set(territories.map(t => `${t.x},${t.y}`));

  // Count connected neighbors for target cell
  const neighbors = [
    `${x + 1},${y}`,
    `${x - 1},${y}`,
    `${x},${y + 1}`,
    `${x},${y - 1}`
  ];
  const connectedNeighbors = neighbors.filter(n => ownedSet.has(n)).length;

  // Check if cell is part of an isolated cluster
  const clusterSize = floodFillSync(x, y, ownedSet, new Set());

  if (clusterSize <= GRID_WARS_CONFIG.overextensionClusterThreshold) {
    return {
      discount: GRID_WARS_CONFIG.overextensionIsolatedDiscount,
      reason: 'isolated cluster'
    };
  }

  // Check if cell is on the edge (< 4 connected neighbors)
  if (connectedNeighbors < 4) {
    return {
      discount: GRID_WARS_CONFIG.overextensionEdgeDiscount,
      reason: 'edge cell'
    };
  }

  return { discount: 0, reason: null };
}

/**
 * Synchronous flood fill for cluster size calculation
 */
function floodFillSync(x, y, ownedSet, visited) {
  const key = `${x},${y}`;
  if (visited.has(key)) return 0;
  if (!ownedSet.has(key)) return 0;

  visited.add(key);
  return 1
    + floodFillSync(x + 1, y, ownedSet, visited)
    + floodFillSync(x - 1, y, ownedSet, visited)
    + floodFillSync(x, y + 1, ownedSet, visited)
    + floodFillSync(x, y - 1, ownedSet, visited);
}

// ============================================
// v1.5: AUTO-BOUNTY SYSTEM
// ============================================

/**
 * Get list of players who are bounty targets (own >20% of map)
 * @param {string} gameId
 * @returns {Promise<string[]>} Array of usernames
 */
async function getBountyTargets(gameId) {
  if (!GRID_WARS_CONFIG.bountyEnabled) return [];

  const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
  const threshold = Math.floor(totalCells * GRID_WARS_CONFIG.bountyThresholdPercent);

  const { data: players } = await supabase
    .from('grid_wars_players')
    .select('username, territories_count')
    .eq('game_id', gameId)
    .gte('territories_count', threshold);

  return (players || []).map(p => p.username);
}

/**
 * Check if a player is a bounty target
 */
async function isBountyTarget(gameId, username) {
  const targets = await getBountyTargets(gameId);
  return targets.includes(username);
}

// ============================================
// v2.2.5: DEVELOPMENT INCENTIVES (Landlord Tax + Fortification)
// ============================================

/**
 * Process landlord tax after successful claim/attack of a subcell
 * Landlord (parent cell owner) earns 20% of the claim/attack cost
 *
 * @param {string} gameId
 * @param {string} claimerUsername - Player who claimed/attacked
 * @param {string} targetAddress - Address of claimed cell
 * @param {number} cost - Cost paid by claimer
 * @returns {Promise<object|null>} Tax result or null if no tax applies
 */
async function processLandlordTax(gameId, claimerUsername, targetAddress, cost) {
  // Only applies to subcells (address has a parent)
  const parentAddress = getParentAddress(targetAddress);
  if (!parentAddress) return null;  // Macro cell, no tax

  // Find parent cell owner
  const { data: parentCell, error } = await supabase
    .from('grid_wars_territories')
    .select('owner, is_developed')
    .eq('game_id', gameId)
    .eq('address', parentAddress)
    .single();

  if (error || !parentCell) {
    console.log(`[Landlord Tax] No parent cell found for ${targetAddress}`);
    return null;
  }

  // Must be developed and owned by someone else
  if (!parentCell.is_developed || !parentCell.owner) return null;
  if (parentCell.owner === claimerUsername) return null;  // No self-tax

  // Calculate rent (configurable rate, minimum 1)
  const taxRate = GRID_WARS_CONFIG.landlordTaxRate || 0.20;
  const minTax = GRID_WARS_CONFIG.landlordTaxMinimum || 1;
  const rent = Math.max(minTax, Math.floor(cost * taxRate));

  // Pay the landlord using RPC for atomic increment
  const { error: rpcError } = await supabase.rpc('increment_action_points', {
    p_game_id: gameId,
    p_username: parentCell.owner,
    p_delta: rent
  });

  if (rpcError) {
    console.error(`[Landlord Tax] Failed to pay landlord: ${rpcError.message}`);
    return null;
  }

  console.log(`[Landlord Tax] ${parentCell.owner} earned ${rent} pts rent from ${claimerUsername} claiming ${targetAddress}`);

  return {
    landlord: parentCell.owner,
    tenant: claimerUsername,
    rent: rent,
    cell: targetAddress
  };
}

/**
 * Calculate fortification multiplier for attacking inside developed territory
 * Attacking subcells inside someone else's developed cell costs +25% more
 *
 * @param {string} gameId
 * @param {string} attackerUsername - Player attempting the attack
 * @param {string} targetAddress - Address of cell being attacked
 * @returns {Promise<object>} { multiplier, isFortified, landlord }
 */
async function getFortificationMultiplier(gameId, attackerUsername, targetAddress) {
  // Only applies to subcells
  const parentAddress = getParentAddress(targetAddress);
  if (!parentAddress) {
    return { multiplier: 1.0, isFortified: false, landlord: null };  // Macro cell
  }

  // Find parent cell
  const { data: parentCell, error } = await supabase
    .from('grid_wars_territories')
    .select('owner, is_developed')
    .eq('game_id', gameId)
    .eq('address', parentAddress)
    .single();

  if (error || !parentCell) {
    return { multiplier: 1.0, isFortified: false, landlord: null };
  }

  // Must be developed and owned by someone OTHER than attacker
  if (!parentCell.is_developed) {
    return { multiplier: 1.0, isFortified: false, landlord: null };
  }
  if (!parentCell.owner) {
    return { multiplier: 1.0, isFortified: false, landlord: null };
  }
  if (parentCell.owner === attackerUsername) {
    return { multiplier: 1.0, isFortified: false, landlord: null };  // No penalty in your own territory
  }

  // Apply fortification multiplier
  const multiplier = GRID_WARS_CONFIG.fortificationMultiplier || 1.25;
  console.log(`[Fortification] +${Math.round((multiplier - 1) * 100)}% cost for ${attackerUsername} attacking inside ${parentCell.owner}'s territory`);

  return {
    multiplier: multiplier,
    isFortified: true,
    landlord: parentCell.owner
  };
}

// ============================================
// v1.3: SPAM PREVENTION (WRONG ANSWER TRACKING)
// ============================================

// In-memory tracking for wrong answers and cooldowns
const wrongAnswerTracker = new Map(); // `${gameId}:${username}` -> [timestamp1, timestamp2, ...]
const userCooldowns = new Map();      // `${gameId}:${username}` -> cooldownEndsAt

/**
 * Track wrong answer and check for spam cooldown
 * @returns {object} { inCooldown: boolean, cooldownRemaining: number, triggered: boolean }
 */
function trackWrongAnswer(gameId, username) {
  const key = `${gameId}:${username}`;
  const now = Date.now();
  const windowMs = GRID_WARS_CONFIG.spamWindowSeconds * 1000;

  // Check existing cooldown
  if (userCooldowns.has(key)) {
    const cooldownEnds = userCooldowns.get(key);
    if (now < cooldownEnds) {
      return {
        inCooldown: true,
        cooldownRemaining: Math.ceil((cooldownEnds - now) / 1000),
        triggered: false
      };
    }
    userCooldowns.delete(key);
  }

  // Track this wrong answer
  const history = wrongAnswerTracker.get(key) || [];
  history.push(now);

  // Filter to only include answers within window
  const recentWrong = history.filter(t => now - t < windowMs);
  wrongAnswerTracker.set(key, recentWrong);

  // Check if threshold exceeded
  if (recentWrong.length >= GRID_WARS_CONFIG.spamThreshold) {
    const cooldownEnds = now + GRID_WARS_CONFIG.spamCooldownSeconds * 1000;
    userCooldowns.set(key, cooldownEnds);
    wrongAnswerTracker.set(key, []); // Reset counter

    // v1.3: Telemetry
    telemetryIncrement('cooldowns_triggered');

    console.log(`Grid Wars: Spam cooldown triggered for ${username} (${recentWrong.length} wrong in ${GRID_WARS_CONFIG.spamWindowSeconds}s)`);

    return {
      inCooldown: true,
      cooldownRemaining: GRID_WARS_CONFIG.spamCooldownSeconds,
      triggered: true  // Just triggered this call
    };
  }

  return { inCooldown: false, cooldownRemaining: 0, triggered: false };
}

/**
 * Check if user is currently in cooldown
 */
function checkCooldown(gameId, username) {
  const key = `${gameId}:${username}`;
  const now = Date.now();

  if (userCooldowns.has(key)) {
    const cooldownEnds = userCooldowns.get(key);
    if (now < cooldownEnds) {
      return {
        inCooldown: true,
        cooldownRemaining: Math.ceil((cooldownEnds - now) / 1000)
      };
    }
    userCooldowns.delete(key);
  }
  return { inCooldown: false, cooldownRemaining: 0 };
}

// ============================================
// v1.3: TELEMETRY
// v1.3.1: Added aggregate metrics and session tracking
// ============================================

const telemetryCounters = {
  claims_total: 0,
  takeovers_total: 0,
  takeovers_by_tier: { ACTIVE: 0, WARM: 0, COLD: 0 },
  afk_erosions_total: 0,
  cooldowns_triggered: 0,
  surges_activated: 0,
  auto_surges_triggered: 0,  // v1.3.1
  class_goals_reached: 0,
  points_earned_total: 0,
  underdog_assists: 0        // v1.3.1
};

let lastTelemetryFlush = Date.now();
let telemetryFlushInterval = null;

// v1.3.1: Session tracking for aggregate metrics
// Maps: `${gameId}:${username}` -> { join_time, first_claim_at }
const playerSessions = new Map();

// v1.3.1: Rolling event buffer for cells_changed_5min
// Array of { timestamp, type: 'claim'|'takeover'|'erosion' }
const recentOwnershipChanges = [];

// v1.3.1: Track session end points for avg calculation
let lastSessionSummary = { avg_points: null, player_count: 0 };

// v1.3.1: Auto-surge state
let lastAutoSurge = 0;
let lastAutoSurgeCheck = 0;

// v1.3.1: Underdog tracking - `${gameId}:${username}` -> last use timestamp
const lastUnderdogUse = new Map();

// v1.3.2: Session state - gameId -> { frozen, endedAt, summary }
const frozenGames = new Map();

/**
 * Increment a telemetry counter
 */
function telemetryIncrement(counter, amount = 1) {
  if (!GRID_WARS_CONFIG.telemetryEnabled) return;
  if (counter in telemetryCounters) {
    if (typeof telemetryCounters[counter] === 'number') {
      telemetryCounters[counter] += amount;
    }
  }
}

/**
 * Increment tier-specific takeover counter
 */
function telemetryIncrementTakeoverTier(tier) {
  if (!GRID_WARS_CONFIG.telemetryEnabled) return;
  if (tier in telemetryCounters.takeovers_by_tier) {
    telemetryCounters.takeovers_by_tier[tier]++;
    telemetryCounters.takeovers_total++;
  }
}

/**
 * v1.3.1: Track player session start (called on avatar/init or first action)
 */
function trackPlayerSessionStart(gameId, username) {
  const key = `${gameId}:${username}`;
  if (!playerSessions.has(key)) {
    playerSessions.set(key, {
      join_time: Date.now(),
      first_claim_at: null
    });
  }
}

/**
 * v1.3.1: Track player's first claim (for onboarding friction metric)
 */
function trackFirstClaim(gameId, username) {
  const key = `${gameId}:${username}`;
  const session = playerSessions.get(key);
  if (session && session.first_claim_at === null) {
    session.first_claim_at = Date.now();
  }
}

/**
 * v1.3.1: Track ownership change event for cells_changed_5min metric
 */
function trackOwnershipChange(type) {
  recentOwnershipChanges.push({
    timestamp: Date.now(),
    type
  });
  // Trim old events (keep last 10 minutes for safety margin)
  const cutoff = Date.now() - 10 * 60 * 1000;
  while (recentOwnershipChanges.length > 0 && recentOwnershipChanges[0].timestamp < cutoff) {
    recentOwnershipChanges.shift();
  }
}

/**
 * v1.3.1: Get cells changed in last 5 minutes
 */
function getCellsChanged5Min() {
  const cutoff = Date.now() - 5 * 60 * 1000;
  return recentOwnershipChanges.filter(e => e.timestamp > cutoff).length;
}

/**
 * v1.3.1: Calculate map fill percentage (async - queries DB)
 */
async function getMapFillPercent() {
  try {
    // Get the active game
    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('game_id')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!game) return 0;

    // Count owned cells
    const { count } = await supabase
      .from('grid_wars_territories')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.game_id)
      .not('owner', 'is', null);

    const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
    return Math.round(((count || 0) / totalCells) * 100) / 100;
  } catch (err) {
    console.error('getMapFillPercent error:', err);
    return 0;
  }
}

/**
 * v1.3.1: Get count of active players in last 5 minutes
 */
async function getActivePlayers5Min() {
  try {
    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('game_id')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!game) return 0;

    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('grid_wars_players')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', game.game_id)
      .gt('last_answer_at', cutoff);

    return count || 0;
  } catch (err) {
    console.error('getActivePlayers5Min error:', err);
    return 0;
  }
}

/**
 * v1.3.1: Calculate median time to first claim
 */
function getMedianTimeToFirstClaim() {
  const times = [];
  for (const [, session] of playerSessions) {
    if (session.first_claim_at !== null) {
      times.push(session.first_claim_at - session.join_time);
    }
  }
  if (times.length === 0) return null;
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

/**
 * Flush telemetry to console (and optionally to database)
 * v1.3.1: Added aggregate metrics
 */
async function flushTelemetry() {
  if (!GRID_WARS_CONFIG.telemetryEnabled) return;

  const now = Date.now();

  // v1.3.1: Compute aggregate metrics
  const mapFillPercent = await getMapFillPercent();
  const activePlayers5min = await getActivePlayers5Min();
  const cellsChanged5min = getCellsChanged5Min();
  const medianTimeToFirstClaim = getMedianTimeToFirstClaim();

  const flushData = {
    timestamp: new Date().toISOString(),
    interval_ms: now - lastTelemetryFlush,
    counters: { ...telemetryCounters },
    counters_by_tier: { ...telemetryCounters.takeovers_by_tier },
    // v1.3.1: Aggregate metrics
    aggregates: {
      map_fill_percent: mapFillPercent,
      active_players_5min: activePlayers5min,
      cells_changed_5min: cellsChanged5min,
      median_time_to_first_claim: medianTimeToFirstClaim,
      avg_points_at_session_end: lastSessionSummary.avg_points
    }
  };

  console.log('[Grid Wars Telemetry]', JSON.stringify(flushData));

  // Reset counters
  telemetryCounters.claims_total = 0;
  telemetryCounters.takeovers_total = 0;
  telemetryCounters.takeovers_by_tier = { ACTIVE: 0, WARM: 0, COLD: 0 };
  telemetryCounters.afk_erosions_total = 0;
  telemetryCounters.cooldowns_triggered = 0;
  telemetryCounters.surges_activated = 0;
  telemetryCounters.auto_surges_triggered = 0;
  telemetryCounters.class_goals_reached = 0;
  telemetryCounters.points_earned_total = 0;
  telemetryCounters.underdog_assists = 0;
  lastTelemetryFlush = now;
}

/**
 * Start telemetry flush interval
 */
function startTelemetryFlush() {
  if (telemetryFlushInterval) return;
  if (!GRID_WARS_CONFIG.telemetryEnabled) return;

  telemetryFlushInterval = setInterval(flushTelemetry, GRID_WARS_CONFIG.telemetryFlushIntervalMs);
  console.log(`Grid Wars: Telemetry flush started (every ${GRID_WARS_CONFIG.telemetryFlushIntervalMs / 1000}s)`);
}

/**
 * Stop telemetry flush interval
 */
function stopTelemetryFlush() {
  if (telemetryFlushInterval) {
    clearInterval(telemetryFlushInterval);
    telemetryFlushInterval = null;
  }
}

// ============================================
// v1.3.1: AUTO-SURGE ON STAGNATION
// ============================================

/**
 * Check if auto-surge should trigger and spawn surge cells
 */
async function checkAutoSurge() {
  if (!GRID_WARS_CONFIG.autoSurgeEnabled) return;

  const now = Date.now();

  // Respect check interval
  if (now - lastAutoSurgeCheck < GRID_WARS_CONFIG.autoSurgeCheckIntervalMs) return;
  lastAutoSurgeCheck = now;

  // Respect cooldown
  if (now - lastAutoSurge < GRID_WARS_CONFIG.autoSurgeCooldownMs) return;

  try {
    const fillPercent = await getMapFillPercent();
    const recentChurn = getCellsChanged5Min();

    // Check stagnation conditions
    if (fillPercent > GRID_WARS_CONFIG.autoSurgeFillThreshold &&
        recentChurn < GRID_WARS_CONFIG.autoSurgeChurnThreshold) {

      console.log(`Grid Wars: Auto-surge triggered (fill=${fillPercent}, churn=${recentChurn})`);

      // Get the active game
      const { data: game } = await supabase
        .from('grid_wars_games')
        .select('game_id')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (!game) return;

      // Find unclaimed cells for surge
      const { data: territories } = await supabase
        .from('grid_wars_territories')
        .select('x, y')
        .eq('game_id', game.game_id);

      const claimedSet = new Set((territories || []).map(t => `${t.x},${t.y}`));
      const unclaimedCells = [];
      for (let x = 0; x < GRID_WARS_CONFIG.mapSize; x++) {
        for (let y = 0; y < GRID_WARS_CONFIG.mapSize; y++) {
          if (!claimedSet.has(`${x},${y}`)) {
            unclaimedCells.push({ x, y });
          }
        }
      }

      if (unclaimedCells.length === 0) {
        console.log('Grid Wars: Auto-surge - no unclaimed cells available');
        return;
      }

      // Spawn surge cells
      const surgeCells = [];
      for (let i = 0; i < GRID_WARS_CONFIG.autoSurgeCellCount && unclaimedCells.length > 0; i++) {
        const idx = Math.floor(Math.random() * unclaimedCells.length);
        surgeCells.push(unclaimedCells.splice(idx, 1)[0]);
      }

      // For simplicity, use the first cell as the "main" surge cell (single surge per game)
      // If multiple surge cells are needed simultaneously, this would need schema changes
      if (surgeCells.length > 0) {
        const surgeCell = surgeCells[0];
        const surgeExpires = new Date(Date.now() + GRID_WARS_CONFIG.surgeDuration * 1000).toISOString();

        await supabase
          .from('grid_wars_games')
          .update({
            surge_cell_x: surgeCell.x,
            surge_cell_y: surgeCell.y,
            surge_expires: surgeExpires
          })
          .eq('game_id', game.game_id);

        // Broadcast auto-surge event
        broadcast({
          type: 'auto_surge_activated',
          gameId: game.game_id,
          x: surgeCell.x,
          y: surgeCell.y,
          cost: GRID_WARS_CONFIG.surgeCost,
          expiresIn: GRID_WARS_CONFIG.surgeDuration,
          message: 'UPLINK DETECTED — New sectors available'
        });

        // Also send as system_event for toast display
        broadcast({
          type: 'system_event',
          gameId: game.game_id,
          event: 'auto_surge',
          message: 'UPLINK DETECTED — New sectors available'
        });

        lastAutoSurge = now;
        telemetryIncrement('auto_surges_triggered');
        console.log(`Grid Wars: Auto-surge spawned at (${surgeCell.x}, ${surgeCell.y})`);
      }
    }
  } catch (err) {
    console.error('Grid Wars: Auto-surge check error:', err);
  }
}

// ============================================
// v1.3.1: UNDERDOG ASSIST
// ============================================

/**
 * Check if player qualifies for underdog discount
 * @returns {{ eligible: boolean, discount: number, reason?: string }}
 */
async function checkUnderdogEligibility(gameId, username) {
  if (!GRID_WARS_CONFIG.underdogEnabled) {
    return { eligible: false, discount: 1, reason: 'disabled' };
  }

  const key = `${gameId}:${username}`;
  const now = Date.now();

  // Check cooldown
  const lastUse = lastUnderdogUse.get(key);
  if (lastUse && (now - lastUse) < GRID_WARS_CONFIG.underdogCooldownMs) {
    return { eligible: false, discount: 1, reason: 'cooldown' };
  }

  try {
    // Get player data
    const { data: player } = await supabase
      .from('grid_wars_players')
      .select('territories_count, last_answer_at')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    if (!player) {
      return { eligible: false, discount: 1, reason: 'no_player' };
    }

    // Must have 0 cells
    if ((player.territories_count || 0) > 0) {
      return { eligible: false, discount: 1, reason: 'has_territory' };
    }

    // Must have answered recently
    if (!player.last_answer_at) {
      return { eligible: false, discount: 1, reason: 'never_answered' };
    }

    const timeSinceAnswer = now - new Date(player.last_answer_at).getTime();
    if (timeSinceAnswer > GRID_WARS_CONFIG.underdogActivityWindowMs) {
      return { eligible: false, discount: 1, reason: 'inactive' };
    }

    // Eligible!
    return {
      eligible: true,
      discount: GRID_WARS_CONFIG.underdogDiscount,
      minCost: GRID_WARS_CONFIG.underdogMinCost
    };

  } catch (err) {
    console.error('checkUnderdogEligibility error:', err);
    return { eligible: false, discount: 1, reason: 'error' };
  }
}

/**
 * Mark underdog assist as used
 */
function markUnderdogUsed(gameId, username) {
  const key = `${gameId}:${username}`;
  lastUnderdogUse.set(key, Date.now());
  telemetryIncrement('underdog_assists');
}

// ============================================
// v1.3: SOFT POINT CEILING (COST SCALING)
// ============================================

/**
 * Calculate scaled cost based on player's current points
 * Uses logarithmic scaling to slow down high-point players
 *
 * Formula: effectiveCost = baseCost * (1 + scaleFactor * log10(max(playerPoints, minPoints)))
 *
 * Examples at 0.1 scale factor:
 * - 10 pts:   scale = 1.1x  (10 → 11)
 * - 100 pts:  scale = 1.2x  (10 → 12)
 * - 1000 pts: scale = 1.3x  (10 → 13)
 *
 * @param {number} baseCost - The base cost before scaling
 * @param {number} playerPoints - Player's current action points
 * @returns {number} Scaled cost (rounded up)
 */
function calculateScaledCost(baseCost, playerPoints) {
  if (!GRID_WARS_CONFIG.pointCeilingEnabled) {
    return baseCost;
  }

  const minPoints = GRID_WARS_CONFIG.pointCeilingMinPoints;
  const scaleFactor = GRID_WARS_CONFIG.pointCeilingScaleFactor;

  // Apply logarithmic scaling
  const scale = 1 + scaleFactor * Math.log10(Math.max(playerPoints, minPoints));
  return Math.ceil(baseCost * scale);
}

// ============================================
// v1.5: SCARCITY PRICING
// ============================================

/**
 * Get the current map fill percentage for a game
 * @param {string} gameId - The game ID
 * @returns {Promise<number>} Fill percentage (0.0 to 1.0)
 */
async function getMapFillPercent(gameId) {
  const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;

  const { count } = await supabase
    .from('grid_wars_territories')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .not('owner', 'is', null);

  return (count || 0) / totalCells;
}

/**
 * Get the scarcity phase and multiplier for a given fill percentage
 * @param {number} fillPercent - Current map fill (0.0 to 1.0)
 * @returns {object} { phase, multiplier, message }
 */
function getScarcityPhase(fillPercent) {
  if (!GRID_WARS_CONFIG.scarcityEnabled) {
    return { phase: 'DISABLED', multiplier: 1.0, message: null };
  }

  const phases = GRID_WARS_CONFIG.scarcityPhases;

  // Find the current phase based on fill percentage
  if (fillPercent < phases.EXPANSION.maxFill) {
    return { phase: 'EXPANSION', ...phases.EXPANSION };
  } else if (fillPercent < phases.TENSION.maxFill) {
    return { phase: 'TENSION', ...phases.TENSION };
  } else if (fillPercent < phases.SCARCITY.maxFill) {
    return { phase: 'SCARCITY', ...phases.SCARCITY };
  } else {
    return { phase: 'SATURATION', ...phases.SATURATION };
  }
}

/**
 * Get the scarcity price multiplier for neutral cell claims
 * Interpolates between phase thresholds for smooth progression
 * @param {number} fillPercent - Current map fill (0.0 to 1.0)
 * @returns {number} Multiplier (1.0 to 3.0)
 */
function getScarcityMultiplier(fillPercent) {
  if (!GRID_WARS_CONFIG.scarcityEnabled) {
    return 1.0;
  }

  const phases = GRID_WARS_CONFIG.scarcityPhases;

  // Interpolate between phases for smooth cost increase
  if (fillPercent < phases.EXPANSION.maxFill) {
    return phases.EXPANSION.multiplier;
  } else if (fillPercent < phases.TENSION.maxFill) {
    // Interpolate between EXPANSION and TENSION
    const progress = (fillPercent - phases.EXPANSION.maxFill) /
                     (phases.TENSION.maxFill - phases.EXPANSION.maxFill);
    return phases.EXPANSION.multiplier +
           progress * (phases.TENSION.multiplier - phases.EXPANSION.multiplier);
  } else if (fillPercent < phases.SCARCITY.maxFill) {
    // Interpolate between TENSION and SCARCITY
    const progress = (fillPercent - phases.TENSION.maxFill) /
                     (phases.SCARCITY.maxFill - phases.TENSION.maxFill);
    return phases.TENSION.multiplier +
           progress * (phases.SCARCITY.multiplier - phases.TENSION.multiplier);
  } else if (fillPercent < phases.SATURATION.maxFill) {
    // Interpolate between SCARCITY and SATURATION
    const progress = (fillPercent - phases.SCARCITY.maxFill) /
                     (phases.SATURATION.maxFill - phases.SCARCITY.maxFill);
    return phases.SCARCITY.multiplier +
           progress * (phases.SATURATION.multiplier - phases.SCARCITY.multiplier);
  }

  return phases.SATURATION.multiplier;
}

// ============================================
// GRID WARS HELPER FUNCTIONS
// ============================================

/**
 * Flood-fill to find connected cells (recursive)
 */
function floodFill(x, y, ownedSet, visited) {
  const key = `${x},${y}`;
  if (visited.has(key)) return 0;
  if (!ownedSet.has(key)) return 0;

  visited.add(key);
  return 1
    + floodFill(x + 1, y, ownedSet, visited)
    + floodFill(x - 1, y, ownedSet, visited)
    + floodFill(x, y + 1, ownedSet, visited)
    + floodFill(x, y - 1, ownedSet, visited);
}

/**
 * Calculate the largest connected cluster for a player
 */
async function calculateLargestCluster(gameId, username) {
  const { data: territories } = await supabase
    .from('grid_wars_territories')
    .select('x, y')
    .eq('game_id', gameId)
    .eq('owner', username);

  if (!territories || territories.length === 0) return 0;

  // Build set of owned cells
  const ownedSet = new Set(territories.map(t => `${t.x},${t.y}`));
  const visited = new Set();
  let maxSize = 0;

  for (const cell of territories) {
    const key = `${cell.x},${cell.y}`;
    if (visited.has(key)) continue;
    const size = floodFill(cell.x, cell.y, ownedSet, visited);
    maxSize = Math.max(maxSize, size);
  }

  return maxSize;
}

/**
 * Update player's largest_cluster in database
 */
async function updatePlayerCluster(gameId, username) {
  const cluster = await calculateLargestCluster(gameId, username);

  await supabase
    .from('grid_wars_players')
    .update({ largest_cluster: cluster })
    .eq('game_id', gameId)
    .eq('username', username);

  return cluster;
}

/**
 * Get class goal progress
 */
async function getClassGoalProgress(gameId) {
  const { data: game } = await supabase
    .from('grid_wars_games')
    .select('class_goal_target, class_goal_current')
    .eq('game_id', gameId)
    .single();

  return {
    current: game?.class_goal_current || 0,
    target: game?.class_goal_target || GRID_WARS_CONFIG.classGoalTarget
  };
}

/**
 * Increment class goal and check if reached
 */
async function incrementClassGoal(gameId) {
  // Get current progress
  const { data: game } = await supabase
    .from('grid_wars_games')
    .select('class_goal_target, class_goal_current')
    .eq('game_id', gameId)
    .single();

  if (!game) return { reached: false };

  const newCurrent = (game.class_goal_current || 0) + 1;
  const target = game.class_goal_target || GRID_WARS_CONFIG.classGoalTarget;

  // Update counter
  await supabase
    .from('grid_wars_games')
    .update({ class_goal_current: newCurrent })
    .eq('game_id', gameId);

  // Broadcast progress
  broadcast({
    type: 'class_goal_updated',
    gameId,
    current: newCurrent,
    target
  });

  // Check if goal just reached
  if (newCurrent === target) {
    // Award bonus to ALL players in this game
    const { data: players } = await supabase
      .from('grid_wars_players')
      .select('username')
      .eq('game_id', gameId);

    for (const player of players || []) {
      await upsertGridWarsPlayer(gameId, player.username, GRID_WARS_CONFIG.classGoalBonus, 0);
    }

    // Broadcast achievement
    broadcast({
      type: 'class_goal_reached',
      gameId,
      bonusPoints: GRID_WARS_CONFIG.classGoalBonus,
      playersRewarded: (players || []).length
    });

    console.log(`Grid Wars: Class goal reached! ${(players || []).length} players awarded ${GRID_WARS_CONFIG.classGoalBonus} points`);

    return { reached: true, bonusPoints: GRID_WARS_CONFIG.classGoalBonus };
  }

  return { reached: false, current: newCurrent, target };
}

// Generate a unique game ID
function generateGameId() {
  return `game-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================
// GRID WARS: CONTESTATION HELPER FUNCTIONS
// ============================================

/**
 * Get all cells that a player is adjacent to (Manhattan distance = 1)
 */
function getAdjacentCells(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ].filter(c => c.x >= 0 && c.x < GRID_WARS_CONFIG.mapSize && c.y >= 0 && c.y < GRID_WARS_CONFIG.mapSize);
}

/**
 * Check if a player is adjacent to a cell
 */
function isAdjacentTo(playerX, playerY, cellX, cellY) {
  return Math.abs(playerX - cellX) + Math.abs(playerY - cellY) === 1;
}

/**
 * Get cells owned by a player that are part of their largest cluster
 */
async function getConnectedCellsInLargestCluster(gameId, username) {
  const { data: territories } = await supabase
    .from('grid_wars_territories')
    .select('x, y')
    .eq('game_id', gameId)
    .eq('owner', username);

  if (!territories || territories.length === 0) return new Set();

  const ownedSet = new Set(territories.map(t => `${t.x},${t.y}`));
  const visited = new Set();
  let largestCluster = new Set();

  for (const cell of territories) {
    const key = `${cell.x},${cell.y}`;
    if (visited.has(key)) continue;

    const currentCluster = new Set();
    const stack = [{ x: cell.x, y: cell.y }];

    while (stack.length > 0) {
      const { x, y } = stack.pop();
      const k = `${x},${y}`;
      if (visited.has(k) || !ownedSet.has(k)) continue;

      visited.add(k);
      currentCluster.add(k);

      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }

    if (currentCluster.size > largestCluster.size) {
      largestCluster = currentCluster;
    }
  }

  return largestCluster;
}

// v1.2: Contestation system removed - using direct takeover instead

/**
 * Flip a cell back to neutral (used when cells decay to 0 strength)
 * v1.2.1: Added missing function implementation
 */
async function flipCellToNeutral(gameId, x, y, previousOwner) {
  // Delete the territory record
  await supabase
    .from('grid_wars_territories')
    .delete()
    .eq('game_id', gameId)
    .eq('x', x)
    .eq('y', y);

  // Update player's territory count
  if (previousOwner) {
    // Decrement territory count
    const { data: player } = await supabase
      .from('grid_wars_players')
      .select('territories_count')
      .eq('game_id', gameId)
      .eq('username', previousOwner)
      .single();

    if (player) {
      await supabase
        .from('grid_wars_players')
        .update({ territories_count: Math.max(0, (player.territories_count || 1) - 1) })
        .eq('game_id', gameId)
        .eq('username', previousOwner);
    }

    // Recalculate largest cluster for affected player
    await updatePlayerCluster(gameId, previousOwner);
  }
}

// ============================================
// GRID WARS: DECAY HELPER FUNCTIONS
// ============================================

/**
 * Process isolated cell decay for all active games
 */
async function processDecay() {
  const { data: games } = await supabase
    .from('grid_wars_games')
    .select('game_id')
    .eq('status', 'active');

  for (const game of games || []) {
    await processGameDecay(game.game_id);
  }
}

/**
 * Process decay for a single game
 */
async function processGameDecay(gameId) {
  // Get all players
  const { data: players } = await supabase
    .from('grid_wars_players')
    .select('username')
    .eq('game_id', gameId);

  for (const player of players || []) {
    await processPlayerDecay(gameId, player.username);
  }
}

/**
 * Process decay for a single player's isolated cells
 */
async function processPlayerDecay(gameId, username) {
  // Get connected cells in largest cluster
  const connectedCells = await getConnectedCellsInLargestCluster(gameId, username);

  // Get all territories for this player
  const { data: territories } = await supabase
    .from('grid_wars_territories')
    .select('x, y, strength, node_type')
    .eq('game_id', gameId)
    .eq('owner', username);

  for (const territory of territories || []) {
    const key = `${territory.x},${territory.y}`;

    // Skip if cell is part of largest cluster or is a resource node
    if (connectedCells.has(key) || territory.node_type) continue;

    // Cell is isolated - decay it
    const newStrength = territory.strength - 1;

    if (newStrength <= 0) {
      // Cell dies
      await flipCellToNeutral(gameId, territory.x, territory.y, username);
      broadcast({
        type: 'cell_decayed',
        gameId,
        x: territory.x,
        y: territory.y,
        previousOwner: username
      });
      console.log(`Grid Wars: Isolated cell (${territory.x}, ${territory.y}) owned by ${username} decayed`);
    } else {
      // Reduce strength
      await supabase
        .from('grid_wars_territories')
        .update({ strength: newStrength })
        .eq('game_id', gameId)
        .eq('x', territory.x)
        .eq('y', territory.y);

      broadcast({
        type: 'cell_strength_changed',
        gameId,
        x: territory.x,
        y: territory.y,
        strength: newStrength
      });
    }
  }
}

// ============================================
// v1.5: AFK DECAY (replaces v1.3 erosion)
// ============================================
// Old v1.3: 15min threshold, strength-based erosion every minute
// New v1.5: 24hr grace period, 1 edge cell returns to neutral per day

/**
 * Process AFK decay for all active games
 * Players inactive >24hr lose 1 edge cell per day
 */
async function processAfkErosion() {
  const { data: games } = await supabase
    .from('grid_wars_games')
    .select('game_id')
    .eq('status', 'active');

  for (const game of games || []) {
    await processGameAfkDecay(game.game_id);
  }
}

/**
 * Process AFK decay for a single game (v1.5 model)
 */
async function processGameAfkDecay(gameId) {
  const now = Date.now();
  const gracePeriodMs = GRID_WARS_CONFIG.afkGracePeriodHours * 60 * 60 * 1000;
  const decayIntervalMs = 24 * 60 * 60 * 1000; // 24 hours between decays

  // Get all players with their last activity and decay timestamp
  const { data: players } = await supabase
    .from('grid_wars_players')
    .select('username, last_answer_at, last_decay_at, territories_count')
    .eq('game_id', gameId)
    .gt('territories_count', 0); // Only check players with territory

  for (const player of players || []) {
    // Check if player is past grace period
    const lastActivity = player.last_answer_at
      ? new Date(player.last_answer_at).getTime()
      : 0; // Never active = always AFK

    const timeSinceActivity = now - lastActivity;
    if (timeSinceActivity < gracePeriodMs) continue; // Still within 24hr grace

    // Check if enough time has passed since last decay (1 decay per day)
    const lastDecay = player.last_decay_at
      ? new Date(player.last_decay_at).getTime()
      : 0;

    const timeSinceDecay = now - lastDecay;
    if (lastDecay > 0 && timeSinceDecay < decayIntervalMs) continue; // Already decayed today

    // Player is AFK past grace period and due for decay
    await processPlayerAfkDecay(gameId, player.username);
  }
}

/**
 * Alias for backward compatibility
 */
async function processGameAfkErosion(gameId) {
  return processGameAfkDecay(gameId);
}

/**
 * Find and remove one edge cell for an AFK player (v1.5 model)
 * Edge cell = cell with < 4 same-owner neighbors
 * Cell returns directly to neutral (no strength reduction)
 */
async function processPlayerAfkDecay(gameId, username) {
  // Get all territories for this player
  const { data: territories } = await supabase
    .from('grid_wars_territories')
    .select('x, y, strength, node_type')
    .eq('game_id', gameId)
    .eq('owner', username);

  if (!territories || territories.length === 0) return;

  // Build set of owned cells for neighbor checking
  const ownedSet = new Set(territories.map(t => `${t.x},${t.y}`));

  // Find edge cells (less than 4 same-owner neighbors)
  const edgeCells = [];
  for (const t of territories) {
    const neighbors = [
      `${t.x + 1},${t.y}`,
      `${t.x - 1},${t.y}`,
      `${t.x},${t.y + 1}`,
      `${t.x},${t.y - 1}`
    ];
    const sameOwnerNeighbors = neighbors.filter(n => ownedSet.has(n)).length;

    // Edge cell = has fewer than 4 same-owner neighbors
    if (sameOwnerNeighbors < 4) {
      edgeCells.push({ ...t, neighborCount: sameOwnerNeighbors });
    }
  }

  if (edgeCells.length === 0) return;

  // Sort by neighbor count (most vulnerable first - fewest neighbors)
  edgeCells.sort((a, b) => a.neighborCount - b.neighborCount);

  // Pick from the most vulnerable (random among those tied for fewest neighbors)
  const minNeighbors = edgeCells[0].neighborCount;
  const mostVulnerable = edgeCells.filter(c => c.neighborCount === minNeighbors);
  const targetCell = mostVulnerable[Math.floor(Math.random() * mostVulnerable.length)];

  // v1.5: Cell returns directly to neutral (no strength reduction phase)
  await flipCellToNeutral(gameId, targetCell.x, targetCell.y, username);

  // Update player's last_decay_at timestamp
  await supabase
    .from('grid_wars_players')
    .update({ last_decay_at: new Date().toISOString() })
    .eq('game_id', gameId)
    .eq('username', username);

  broadcast({
    type: 'afk_decay',
    gameId,
    x: targetCell.x,
    y: targetCell.y,
    previousOwner: username,
    message: 'SIGNAL DECAY: Territory lost (inactive >24hr)'
  });

  // Telemetry
  telemetryIncrement('afk_decays_total');
  trackOwnershipChange('decay');

  console.log(`Grid Wars v1.5: AFK decay - cell (${targetCell.x}, ${targetCell.y}) owned by ${username} returned to neutral`);
}

/**
 * Alias for backward compatibility
 */
async function processPlayerAfkErosion(gameId, username) {
  return processPlayerAfkDecay(gameId, username);
}

// ============================================
// GRID WARS: SURGE HELPER FUNCTIONS
// ============================================

/**
 * Check and expire surge cells
 */
async function processSurgeExpiration() {
  const now = new Date();

  const { data: games } = await supabase
    .from('grid_wars_games')
    .select('game_id, surge_cell_x, surge_cell_y, surge_expires')
    .eq('status', 'active')
    .not('surge_expires', 'is', null);

  for (const game of games || []) {
    if (new Date(game.surge_expires) <= now) {
      await supabase
        .from('grid_wars_games')
        .update({
          surge_cell_x: null,
          surge_cell_y: null,
          surge_expires: null
        })
        .eq('game_id', game.game_id);

      broadcast({
        type: 'surge_expired',
        gameId: game.game_id,
        x: game.surge_cell_x,
        y: game.surge_cell_y
      });

      console.log(`Grid Wars: Surge expired at (${game.surge_cell_x}, ${game.surge_cell_y})`);
    }
  }
}

// ============================================
// GRID WARS: SERVER TICK
// ============================================

let lastDecayTick = Date.now();
let lastAfkErosionTick = Date.now();

/**
 * Main server tick function - runs every 5 seconds
 * v1.2: Removed contestation processing (using direct takeover instead)
 * v1.3: Added AFK erosion processing
 */
async function gridWarsServerTick() {
  try {
    // Process decay (every minute)
    const now = Date.now();
    if (now - lastDecayTick >= GRID_WARS_CONFIG.decayIntervalMs) {
      await processDecay();
      lastDecayTick = now;
    }

    // v1.3: Process AFK erosion (every minute)
    if (now - lastAfkErosionTick >= GRID_WARS_CONFIG.afkErosionIntervalMs) {
      await processAfkErosion();
      lastAfkErosionTick = now;
    }

    // Check surge expiration
    await processSurgeExpiration();

    // v1.3.1: Check for auto-surge on stagnation
    await checkAutoSurge();

  } catch (err) {
    console.error('Grid Wars server tick error:', err);
  }
}

// Start server tick interval (will be started after server.listen)
let gridWarsTickInterval = null;

function startGridWarsTick() {
  if (gridWarsTickInterval) return;
  gridWarsTickInterval = setInterval(gridWarsServerTick, GRID_WARS_CONFIG.tickIntervalMs);
  console.log('Grid Wars: Server tick started');
}

function stopGridWarsTick() {
  if (gridWarsTickInterval) {
    clearInterval(gridWarsTickInterval);
    gridWarsTickInterval = null;
  }
}

// Get or create active game
app.get('/api/grid-wars/games/active', async (req, res) => {
  try {
    // Try to find an active game
    const { data: existing, error: findError } = await supabase
      .from('grid_wars_games')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      return res.json(existing);
    }

    // No active game - create one
    const gameId = generateGameId();
    const { data: newGame, error: createError } = await supabase
      .from('grid_wars_games')
      .insert({
        game_id: gameId,
        status: 'active',
        map_size: GRID_WARS_CONFIG.mapSize,
        wave_number: 0,
        center_hp: 100,
        class_goal_target: GRID_WARS_CONFIG.classGoalTarget,
        class_goal_current: 0
      })
      .select()
      .single();

    if (createError) {
      // Table might not exist
      if (createError.code === '42P01') {
        return res.status(503).json({
          error: 'Grid Wars tables not yet created. Run schema-grid-wars.sql in Supabase.'
        });
      }
      throw createError;
    }

    // Initialize resource nodes
    for (const node of GRID_WARS_CONFIG.nodePositions) {
      await supabase
        .from('grid_wars_territories')
        .upsert({
          game_id: gameId,
          x: node.x,
          y: node.y,
          owner: null,
          node_type: node.type,
          strength: GRID_WARS_CONFIG.maxCellStrength
        }, {
          onConflict: 'game_id,x,y'
        });
    }

    console.log(`Created new Grid Wars game: ${gameId} with ${GRID_WARS_CONFIG.nodePositions.length} resource nodes`);
    res.json(newGame);
  } catch (err) {
    console.error('GET /api/grid-wars/games/active error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get full game state
app.get('/api/grid-wars/games/:gameId/state', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { parent, username } = req.query;  // v2.0: parent for hierarchy, v2.2.4: username for weighted stats

    // Get game info
    const { data: game, error: gameError } = await supabase
      .from('grid_wars_games')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (gameError) {
      if (gameError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Game not found' });
      }
      throw gameError;
    }

    // v2.0: Determine target level and parent for hierarchy queries
    const targetLevel = parent ? getLevel(parent) + 1 : 0;

    // Get territories with all fields including v2.0 hierarchy fields
    let territoriesQuery = supabase
      .from('grid_wars_territories')
      .select('x, y, owner, claimed_at, strength, contested_by, contested_since, node_type, address, parent_address, is_developed, cell_level')
      .eq('game_id', gameId)
      .eq('cell_level', targetLevel);

    // v2.0: Filter by parent address if zoomed in
    if (parent) {
      territoriesQuery = territoriesQuery.eq('parent_address', parent);
    } else {
      territoriesQuery = territoriesQuery.is('parent_address', null);
    }

    const { data: territories, error: terrError } = await territoriesQuery;

    if (terrError) throw terrError;

    // v2.0: Get parent cell info if zoomed in
    let parentCell = null;
    if (parent) {
      const { data: parentData } = await supabase
        .from('grid_wars_territories')
        .select('*')
        .eq('game_id', gameId)
        .eq('address', parent)
        .single();
      parentCell = parentData;
    }

    // Get structures (legacy)
    const { data: structures, error: structError } = await supabase
      .from('grid_wars_structures')
      .select('x, y, structure_type, owner, health, built_at')
      .eq('game_id', gameId);

    if (structError) throw structError;

    // Get players with all new fields (v2.2: include color)
    const { data: players, error: playersError } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, structures_count, largest_cluster, health, position_x, position_y, avatar_format, last_answer_at, active_buffs, updated_at, color')
      .eq('game_id', gameId)
      .order('action_points', { ascending: false });

    if (playersError) throw playersError;

    // v2.2: Build player colors map (assign colors to any players without one)
    const playerColors = {};
    for (const p of players || []) {
      if (p.color) {
        playerColors[p.username] = p.color;
      } else {
        // Assign color on-demand if missing
        const color = await assignPlayerColor(gameId, p.username);
        playerColors[p.username] = color;
      }
    }

    // v2.2: Build subcell summaries for developed cells at current level
    const subcellSummaries = {};
    const developedCells = (territories || []).filter(t => t.is_developed);

    for (const cell of developedCells) {
      // Get children of this developed cell
      const { data: subcells } = await supabase
        .from('grid_wars_territories')
        .select('x, y, owner, is_developed')
        .eq('game_id', gameId)
        .eq('parent_address', cell.address);

      // Build 8x8 grid with owner AND developed status
      const grid = Array(8).fill(null).map(() =>
        Array(8).fill(null).map(() => ({ owner: null, is_developed: false }))
      );

      for (const sub of subcells || []) {
        if (sub.x >= 0 && sub.x < 8 && sub.y >= 0 && sub.y < 8) {
          grid[sub.y][sub.x] = {
            owner: sub.owner,
            is_developed: sub.is_developed || false
          };
        }
      }

      subcellSummaries[cell.address] = grid;
    }

    // v2.2.4: Calculate weighted territory stats for requesting user
    let userStats = null;
    if (username) {
      userStats = await calculateWeightedTerritory(gameId, username);
    }

    // Get class goal progress
    const classGoal = {
      current: game.class_goal_current || 0,
      target: game.class_goal_target || GRID_WARS_CONFIG.classGoalTarget
    };

    // Get surge cell info
    const surge = (game.surge_cell_x !== null && game.surge_expires) ? {
      x: game.surge_cell_x,
      y: game.surge_cell_y,
      expires: game.surge_expires,
      expiresIn: Math.max(0, Math.floor((new Date(game.surge_expires) - new Date()) / 1000))
    } : null;

    res.json({
      game,
      territories: territories || [],
      structures: structures || [],
      players: players || [],
      classGoal,
      surge,
      config: {
        claimCost: GRID_WARS_CONFIG.claimCost,
        takeoverCost: GRID_WARS_CONFIG.takeoverCost,
        nodeClaimCost: GRID_WARS_CONFIG.nodeClaimCost,
        surgeCost: GRID_WARS_CONFIG.surgeCost,
        reinforceCost: GRID_WARS_CONFIG.reinforceCost,
        // v2.0: Hierarchy config
        hierarchyEnabled: GRID_WARS_CONFIG.hierarchyEnabled,
        developmentCost: GRID_WARS_CONFIG.developmentCost,
        drillCost: GRID_WARS_CONFIG.drillCost,
        drillSaturationThreshold: GRID_WARS_CONFIG.drillSaturationThreshold,
        subcellClaimCost: GRID_WARS_CONFIG.subcellClaimCost,
        // v2.2: Max subdivision level for fractal depth
        maxSubdivisionLevel: GRID_WARS_CONFIG.maxSubdivisionLevel
      },
      // v2.0: Hierarchy navigation state
      currentLevel: targetLevel,
      parentAddress: parent || null,
      parentCell,
      breadcrumb: getBreadcrumb(parent),
      // v2.2: Player colors and subcell summaries for mini-mosaic rendering
      playerColors,
      subcellSummaries,
      // v2.2.4: Weighted territory stats for requesting user
      userStats
    });
  } catch (err) {
    console.error('GET /api/grid-wars/games/:gameId/state error:', err);
    res.status(500).json({ error: err.message });
  }
});

// v1.3.2: Reset game map - clears all territories and resets player points
app.post('/api/grid-wars/games/reset', async (req, res) => {
  try {
    const { gameId, password } = req.body;

    // Require teacher password
    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher password required' });
    }

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    console.log(`[Grid Wars] Resetting game: ${gameId}`);

    // Clear all territories
    const { error: terrError } = await supabase
      .from('grid_wars_territories')
      .delete()
      .eq('game_id', gameId);

    if (terrError) throw terrError;

    // Reset all player stats (keep players, zero their stats)
    const { error: playerError } = await supabase
      .from('grid_wars_players')
      .update({
        action_points: GRID_WARS_CONFIG.bootBonus || 15,
        territories_count: 0,
        largest_cluster: 0,
        active_buffs: {}
      })
      .eq('game_id', gameId);

    if (playerError) throw playerError;

    // Reset game state
    const { error: gameError } = await supabase
      .from('grid_wars_games')
      .update({
        class_goal_current: 0,
        surge_cell_x: null,
        surge_cell_y: null,
        surge_expires: null
      })
      .eq('game_id', gameId);

    if (gameError) throw gameError;

    // Broadcast reset to all clients
    broadcast({
      type: 'game_reset',
      gameId
    });

    console.log(`[Grid Wars] Game ${gameId} reset complete`);
    res.json({ success: true, message: 'Map reset complete' });
  } catch (err) {
    console.error('POST /api/grid-wars/games/reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// v1.3.2: End session - freeze Grid Wars, calculate summary, broadcast rankings
app.post('/api/grid-wars/session/end', async (req, res) => {
  try {
    const { gameId, password } = req.body;

    // Require teacher password
    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher password required' });
    }

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    console.log(`[Grid Wars] Ending session for game: ${gameId}`);

    // Get all players
    const { data: players, error: playersError } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, largest_cluster')
      .eq('game_id', gameId);

    if (playersError) throw playersError;

    // Get all territories
    const { data: territories, error: terrError } = await supabase
      .from('grid_wars_territories')
      .select('x, y, owner')
      .eq('game_id', gameId);

    if (terrError) throw terrError;

    // Calculate summary
    const mapSize = GRID_WARS_CONFIG.mapSize || 20;
    const totalCells = mapSize * mapSize;
    const summary = {
      endedAt: new Date().toISOString(),
      playerCount: players?.length || 0,
      totalTerritories: territories?.length || 0,
      mapFillPercent: Math.round(((territories?.length || 0) / totalCells) * 100),
      avgPoints: players?.length > 0
        ? Math.round(players.reduce((sum, p) => sum + (p.action_points || 0), 0) / players.length)
        : 0,
      topPlayers: (players || [])
        .sort((a, b) => (b.territories_count || 0) - (a.territories_count || 0))
        .slice(0, 5)
        .map(p => ({
          username: p.username,
          territories: p.territories_count || 0,
          points: p.action_points || 0,
          cluster: p.largest_cluster || 0
        }))
    };

    // Mark game as frozen
    frozenGames.set(gameId, { frozen: true, ...summary });

    // Log telemetry
    telemetryLog('session_ended', {
      gameId,
      ...summary,
      avg_points_at_session_end: summary.avgPoints
    });

    // Broadcast to all clients
    broadcast({
      type: 'session_ended',
      gameId,
      summary,
      rankings: summary.topPlayers
    });

    console.log(`[Grid Wars] Session ended for game ${gameId}`);
    res.json({ success: true, summary });
  } catch (err) {
    console.error('POST /api/grid-wars/session/end error:', err);
    res.status(500).json({ error: err.message });
  }
});

// v1.3.2: Get session status (check if game is frozen)
app.get('/api/grid-wars/session/status', async (req, res) => {
  try {
    const gameId = req.query.gameId || 'default';
    const status = frozenGames.get(gameId);
    res.json({
      frozen: status?.frozen || false,
      summary: status || null
    });
  } catch (err) {
    console.error('GET /api/grid-wars/session/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// v1.3.2: Resume session (unfreeze game)
app.post('/api/grid-wars/session/resume', async (req, res) => {
  try {
    const { gameId, password } = req.body;

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher password required' });
    }

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    // Unfreeze game
    frozenGames.delete(gameId);

    // Broadcast resume to all clients
    broadcast({
      type: 'session_resumed',
      gameId
    });

    console.log(`[Grid Wars] Session resumed for game ${gameId}`);
    res.json({ success: true, message: 'Session resumed' });
  } catch (err) {
    console.error('POST /api/grid-wars/session/resume error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// v1.4: ROUND SYSTEM ENDPOINTS
// ============================================

// In-memory round state (cleared on server restart)
const activeRounds = new Map(); // gameId -> { roundNumber, startedAt, endsAt, victoryConfig, status }

/**
 * v1.4: Start a new round
 */
app.post('/api/grid-wars/round/start', async (req, res) => {
  try {
    const { gameId, password, victoryConfig } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    // Check teacher password
    if (password !== process.env.TEACHER_PASSWORD) {
      return res.status(403).json({ error: 'Invalid teacher password' });
    }

    // Get current game state
    const { data: game, error: gameError } = await supabase
      .from('grid_wars_games')
      .select('round_number, rounds_enabled, victory_config')
      .eq('game_id', gameId)
      .single();

    if (gameError && gameError.code !== 'PGRST116') throw gameError;

    const roundNumber = (game?.round_number || 0) + 1;
    const config = victoryConfig || game?.victory_config || { type: 'manual' };

    // Calculate end time for timed rounds
    let endsAt = null;
    if (config.type === 'timed' && GRID_WARS_CONFIG.victoryConditions?.timed?.durationMinutes) {
      endsAt = new Date(Date.now() + GRID_WARS_CONFIG.victoryConditions.timed.durationMinutes * 60 * 1000).toISOString();
    }

    // Update game record
    await supabase
      .from('grid_wars_games')
      .update({
        round_number: roundNumber,
        rounds_enabled: true,
        round_started_at: new Date().toISOString(),
        round_ends_at: endsAt,
        round_status: 'active',
        victory_config: config
      })
      .eq('game_id', gameId);

    // Clear territories for new round
    await supabase
      .from('grid_wars_territories')
      .delete()
      .eq('game_id', gameId);

    // Reset player territories_count but apply legacy bonuses
    const { data: players } = await supabase
      .from('grid_wars_players')
      .select('username, pending_legacy_bonus')
      .eq('game_id', gameId);

    for (const player of players || []) {
      const bonus = player.pending_legacy_bonus || 0;
      await supabase
        .from('grid_wars_players')
        .update({
          territories_count: 0,
          largest_cluster: 0,
          action_points: GRID_WARS_CONFIG.bootBonus + bonus,
          pending_legacy_bonus: 0
        })
        .eq('game_id', gameId)
        .eq('username', player.username);
    }

    // Clear frozen state
    frozenGames.delete(gameId);

    // Store round state
    activeRounds.set(gameId, {
      roundNumber,
      startedAt: new Date().toISOString(),
      endsAt,
      victoryConfig: config,
      status: 'active'
    });

    // Broadcast round start
    broadcast({
      type: 'round_started',
      gameId,
      roundNumber,
      victoryConfig: config,
      endsAt,
      startedAt: new Date().toISOString()
    });

    console.log(`[Grid Wars] Round ${roundNumber} started for game ${gameId}`);
    res.json({ success: true, roundNumber, endsAt, victoryConfig: config });
  } catch (err) {
    console.error('POST /api/grid-wars/round/start error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * v1.4: End current round manually
 */
app.post('/api/grid-wars/round/end', async (req, res) => {
  try {
    const { gameId, password } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    if (password !== process.env.TEACHER_PASSWORD) {
      return res.status(403).json({ error: 'Invalid teacher password' });
    }

    // Get final standings
    const { data: players } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, lifetime_earned')
      .eq('game_id', gameId)
      .order('territories_count', { ascending: false });

    const rankings = players || [];
    const winner = rankings[0] || null;

    // Get real names for top 3
    const top3Usernames = rankings.slice(0, 3).map(p => p.username);
    const { data: users } = await supabase
      .from('users')
      .select('username, real_name')
      .in('username', top3Usernames);

    const nameMap = {};
    for (const u of users || []) {
      nameMap[u.username] = u.real_name;
    }

    // Get round info
    const roundState = activeRounds.get(gameId);
    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('round_number, victory_config, round_started_at')
      .eq('game_id', gameId)
      .single();

    const roundNumber = game?.round_number || 1;

    // Record to hall of fame
    await supabase
      .from('round_history')
      .insert({
        game_id: gameId,
        round_number: roundNumber,
        started_at: game?.round_started_at || roundState?.startedAt,
        victory_condition: 'manual',
        winner_id: winner?.username,
        winner_name: nameMap[winner?.username] || winner?.username,
        winner_score: winner?.territories_count,
        runner_up_id: rankings[1]?.username,
        runner_up_name: nameMap[rankings[1]?.username] || rankings[1]?.username,
        runner_up_score: rankings[1]?.territories_count,
        third_place_id: rankings[2]?.username,
        third_place_name: nameMap[rankings[2]?.username] || rankings[2]?.username,
        third_place_score: rankings[2]?.territories_count,
        total_players: rankings.length,
        metadata: { rankings: rankings.slice(0, 10) }
      });

    // Award legacy bonuses
    const legacyBonuses = GRID_WARS_CONFIG.legacyBonus || { winner: 5, top3: 3 };
    if (winner) {
      await supabase
        .from('grid_wars_players')
        .update({ pending_legacy_bonus: legacyBonuses.winner })
        .eq('game_id', gameId)
        .eq('username', winner.username);
    }
    for (const p of rankings.slice(1, 3)) {
      await supabase
        .from('grid_wars_players')
        .update({ pending_legacy_bonus: legacyBonuses.top3 })
        .eq('game_id', gameId)
        .eq('username', p.username);
    }

    // Update game status
    await supabase
      .from('grid_wars_games')
      .update({ round_status: 'ended' })
      .eq('game_id', gameId);

    // Freeze claims
    frozenGames.set(gameId, { frozen: true, roundEnded: true });

    // Clear round state
    if (activeRounds.has(gameId)) {
      activeRounds.get(gameId).status = 'ended';
    }

    // Broadcast round ended
    broadcast({
      type: 'round_ended',
      gameId,
      roundNumber,
      victoryCondition: 'manual',
      winner: winner ? {
        username: winner.username,
        name: nameMap[winner.username] || winner.username,
        score: winner.territories_count
      } : null,
      rankings: rankings.slice(0, 10).map(p => ({
        username: p.username,
        name: nameMap[p.username] || p.username,
        territories: p.territories_count,
        points: p.action_points
      }))
    });

    console.log(`[Grid Wars] Round ${roundNumber} ended for game ${gameId}`);
    res.json({ success: true, winner, rankings: rankings.slice(0, 10) });
  } catch (err) {
    console.error('POST /api/grid-wars/round/end error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * v1.4: Get current round status
 */
app.get('/api/grid-wars/round/status', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('round_number, rounds_enabled, round_started_at, round_ends_at, round_status, victory_config')
      .eq('game_id', gameId)
      .single();

    if (!game) {
      return res.json({ roundsEnabled: false });
    }

    // Get leader for progress
    const { data: leader } = await supabase
      .from('grid_wars_players')
      .select('username, territories_count')
      .eq('game_id', gameId)
      .order('territories_count', { ascending: false })
      .limit(1)
      .single();

    // Get real name
    let leaderName = leader?.username;
    if (leader) {
      const { data: user } = await supabase
        .from('users')
        .select('real_name')
        .eq('username', leader.username)
        .single();
      leaderName = user?.real_name || leader.username;
    }

    res.json({
      roundsEnabled: game.rounds_enabled,
      roundNumber: game.round_number,
      status: game.round_status,
      startedAt: game.round_started_at,
      endsAt: game.round_ends_at,
      victoryConfig: game.victory_config,
      progress: leader ? {
        leader: leaderName,
        leaderScore: leader.territories_count
      } : null
    });
  } catch (err) {
    console.error('GET /api/grid-wars/round/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * v1.4: Get hall of fame (past round winners)
 */
app.get('/api/grid-wars/hall-of-fame', async (req, res) => {
  try {
    const { gameId, limit = 10 } = req.query;

    const query = supabase
      .from('round_history')
      .select('*')
      .order('ended_at', { ascending: false })
      .limit(parseInt(limit));

    if (gameId) {
      query.eq('game_id', gameId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (err) {
    console.error('GET /api/grid-wars/hall-of-fame error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Perform an action (claim territory, reinforce)
app.post('/api/grid-wars/action', async (req, res) => {
  try {
    // v2.1.5: Added parentAddress and cellLevel for subcell claims
    // v2.2.1: Use let for x, y since we need to parse them as integers
    const { gameId, username, action, actionId, parentAddress, cellLevel } = req.body;
    let { x, y } = req.body;

    if (!gameId || !username || !action || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'Missing required fields: gameId, username, action, x, y' });
    }

    // v2.2.1: Ensure coordinates are parsed as integers
    const origX = x, origY = y;  // Keep originals for error reporting
    x = parseInt(x, 10);
    y = parseInt(y, 10);

    // v2.2.1: Enhanced coordinate validation with detailed error messages
    if (isNaN(x) || isNaN(y)) {
      console.error(`[Action] Invalid coordinate types: x=${origX} (${typeof origX}), y=${origY} (${typeof origY})`);
      return res.status(400).json({
        error: 'Invalid coordinates',
        details: { x: origX, y: origY, xType: typeof origX, yType: typeof origY }
      });
    }

    // v2.1.5: Build target address based on parent context
    const localAddress = coordsToAddress(x, y);
    const targetAddress = parentAddress ? `${parentAddress}.${localAddress}` : localAddress;
    const targetLevel = cellLevel || 0;

    console.log(`[Action] ${action} at ${targetAddress} (x=${x}, y=${y}, parent=${parentAddress || 'root'}, level=${targetLevel})`);

    // v1.3.2: Check if session is frozen (Grid Wars paused but drills still work)
    if (frozenGames.get(gameId)?.frozen) {
      return res.status(403).json({ error: 'Session has ended. Grid Wars is frozen.' });
    }

    // Validate coordinates - v2.2.1: Include actual values in error for debugging
    if (x < 0 || x >= GRID_WARS_CONFIG.mapSize || y < 0 || y >= GRID_WARS_CONFIG.mapSize) {
      console.error(`[Action] Coordinates out of bounds: x=${x}, y=${y}, mapSize=${GRID_WARS_CONFIG.mapSize}`);
      return res.status(400).json({
        error: 'Coordinates out of bounds',
        details: { x, y, maxValid: GRID_WARS_CONFIG.mapSize - 1, parentAddress, cellLevel: targetLevel }
      });
    }

    // Get player's current state
    const { data: player } = await supabase
      .from('grid_wars_players')
      .select('action_points, territories_count, active_buffs, last_answer_at')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    // v1.4: Activity requirement for claims (uplink check)
    const uplinkTimeout = (GRID_WARS_CONFIG.uplinkRequiredSeconds || 600) * 1000;
    const timeSinceLastAnswer = player?.last_answer_at
      ? Date.now() - new Date(player.last_answer_at).getTime()
      : Infinity;

    if (timeSinceLastAnswer > uplinkTimeout) {
      return res.status(403).json({
        error: 'UPLINK OFFLINE',
        message: 'Answer a drill question to restore your uplink',
        uplinkStatus: 'offline',
        timeSinceAnswer: Math.floor(timeSinceLastAnswer / 1000)
      });
    }

    const currentPoints = player?.action_points || 0;

    // Get game state for surge cell
    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('surge_cell_x, surge_cell_y, surge_expires')
      .eq('game_id', gameId)
      .single();

    const isSurgeCell = game?.surge_cell_x === x && game?.surge_cell_y === y &&
                        game?.surge_expires && new Date(game.surge_expires) > new Date();

    if (action === 'claim') {
      // v2.1.5: Check if already owned or is a resource node placeholder
      // Use address for subcell lookups, x/y for macro cells (backwards compatibility)
      let existingTerritory;
      if (parentAddress) {
        // Subcell claim - look up by address
        const { data } = await supabase
          .from('grid_wars_territories')
          .select('id, owner, node_type, strength, address, parent_address, cell_level, is_developed')
          .eq('game_id', gameId)
          .eq('address', targetAddress)
          .single();
        existingTerritory = data;
      } else {
        // Macro claim - look up by x,y (backwards compatible)
        const { data } = await supabase
          .from('grid_wars_territories')
          .select('id, owner, node_type, strength, address, parent_address, cell_level, is_developed')
          .eq('game_id', gameId)
          .eq('x', x)
          .eq('y', y)
          .is('parent_address', null)  // Only match root-level cells
          .single();
        existingTerritory = data;
      }

      // Resource nodes exist as unclaimed territories with node_type set
      const isResourceNode = existingTerritory?.node_type && !existingTerritory?.owner;
      const isAlreadyOwned = existingTerritory?.owner;
      const previousOwner = existingTerritory?.owner || null;
      const isEnemyTakeover = isAlreadyOwned && existingTerritory.owner !== username;
      const isOwnTerritory = isAlreadyOwned && existingTerritory.owner === username;

      // Can't reclaim your own territory
      if (isOwnTerritory) {
        return res.status(400).json({ error: 'You already own this territory' });
      }

      // v2.2.6: Hostile Takeover - attack a developed macro cell to become its landlord
      // Subcells are unchanged; only macro ownership transfers
      const isHostileTakeover = isEnemyTakeover &&
                                 existingTerritory?.is_developed &&
                                 (existingTerritory?.cell_level === 0 || existingTerritory?.cell_level === undefined) &&
                                 !parentAddress;  // Must be at macro level

      if (isHostileTakeover) {
        console.log(`[Hostile Takeover] ${username} attempting to seize developed cell ${targetAddress} from ${previousOwner}`);

        // Calculate takeover cost: BASE × ACTIVITY_TIER × SCARCITY × (1 - VELOCITY) × (1 - GUERRILLA)
        // Note: NO overextension discount, NO fortification (that's for subcells)
        let takeoverCost = GRID_WARS_CONFIG.hostileTakeoverBaseCost || 150;

        // Get defender's activity tier
        const { data: defender } = await supabase
          .from('grid_wars_players')
          .select('last_answer_at, territories_count')
          .eq('game_id', gameId)
          .eq('username', previousOwner)
          .single();

        const timeSinceAnswer = defender?.last_answer_at
          ? (Date.now() - new Date(defender.last_answer_at).getTime()) / 1000
          : Infinity;

        // Activity tier multiplier (1.0 for COLD, 1.33 for WARM, 1.67 for ACTIVE)
        let activityTier;
        let activityMultiplier = 1.0;
        if (timeSinceAnswer < GRID_WARS_CONFIG.activeWindowSeconds) {
          activityTier = 'ACTIVE';
          activityMultiplier = 1.67;
        } else if (timeSinceAnswer < GRID_WARS_CONFIG.warmWindowSeconds) {
          activityTier = 'WARM';
          activityMultiplier = 1.33;
        } else {
          activityTier = 'COLD';
          activityMultiplier = 1.0;
        }
        takeoverCost = Math.ceil(takeoverCost * activityMultiplier);

        // Apply scarcity multiplier
        const fillPercent = await getMapFillPercent(gameId);
        const scarcityMultiplier = getScarcityMultiplier(fillPercent);
        takeoverCost = Math.ceil(takeoverCost * scarcityMultiplier);

        // Apply velocity discount
        const velocity = await getPlayerVelocity(gameId, username);
        const velocityTier = getVelocityTier(velocity);
        if (velocityTier.discount > 0) {
          takeoverCost = Math.ceil(takeoverCost * (1 - velocityTier.discount));
        }

        // Apply guerrilla discount
        const attackerCells = player?.territories_count || 0;
        const defenderCells = defender?.territories_count || 0;
        const guerrilla = getGuerrillaDiscount(attackerCells, defenderCells);
        if (guerrilla.discount > 0) {
          takeoverCost = Math.ceil(takeoverCost * (1 - guerrilla.discount));
        }

        console.log(`[Hostile Takeover] Cost breakdown: base=150, activity=${activityTier}(×${activityMultiplier}), scarcity=${scarcityMultiplier.toFixed(2)}, velocity=-${(velocityTier.discount * 100).toFixed(0)}%, guerrilla=-${(guerrilla.discount * 100).toFixed(0)}% → final=${takeoverCost}`);

        // Check if player can afford
        if (currentPoints < takeoverCost) {
          return res.status(400).json({
            error: `Insufficient points for hostile takeover. Need ${takeoverCost}, have ${currentPoints}`,
            required: takeoverCost,
            have: currentPoints,
            isHostileTakeover: true
          });
        }

        // Deduct points from attacker
        await upsertGridWarsPlayer(gameId, username, -takeoverCost);

        // Transfer ownership of MACRO CELL ONLY
        // Subcells remain unchanged
        const { error: updateError } = await supabase
          .from('grid_wars_territories')
          .update({
            owner: username,
            claimed_at: new Date().toISOString()
            // is_developed stays true
            // subcells are NOT touched
          })
          .eq('id', existingTerritory.id);

        if (updateError) {
          console.error('[Hostile Takeover] Failed to update territory:', updateError);
          // Refund points on failure
          await upsertGridWarsPlayer(gameId, username, takeoverCost);
          return res.status(500).json({ error: 'Failed to complete hostile takeover' });
        }

        // Update territory counts
        await upsertGridWarsPlayer(gameId, username, 0, 1);        // Attacker gains 1 territory
        await upsertGridWarsPlayer(gameId, previousOwner, 0, -1); // Defender loses 1 territory

        console.log(`[Hostile Takeover] SUCCESS: ${username} seized ${targetAddress} from ${previousOwner} for ${takeoverCost} pts`);

        // Broadcast hostile takeover event
        broadcast({
          type: 'hostile_takeover',
          gameId,
          attacker: username,
          previousOwner: previousOwner,
          address: targetAddress,
          x,
          y,
          cost: takeoverCost,
          activityTier
        });

        // Also broadcast leaderboard update
        broadcastLeaderboardUpdate(gameId);

        return res.json({
          success: true,
          action: 'hostile_takeover',
          address: targetAddress,
          previousOwner: previousOwner,
          cost: takeoverCost,
          isHostileTakeover: true,
          newPointsTotal: currentPoints - takeoverCost
        });
      }

      // v1.2: Activity-based dynamic pricing for enemy takeover
      let cost = GRID_WARS_CONFIG.claimCost;
      let defenderIsActive = false;
      if (isEnemyTakeover) {
        // Check if defender has been active recently
        const { data: defender } = await supabase
          .from('grid_wars_players')
          .select('last_answer_at')
          .eq('game_id', gameId)
          .eq('username', previousOwner)
          .single();

        const timeSinceAnswer = defender?.last_answer_at
          ? (Date.now() - new Date(defender.last_answer_at).getTime()) / 1000
          : Infinity;

        // v1.3: 3-tier activity-based pricing
        let activityTier;
        if (timeSinceAnswer < GRID_WARS_CONFIG.activeWindowSeconds) {
          // <3 min = ACTIVE (highest protection)
          cost = GRID_WARS_CONFIG.takeoverCostActive;
          activityTier = 'ACTIVE';
          defenderIsActive = true;
        } else if (timeSinceAnswer < GRID_WARS_CONFIG.warmWindowSeconds) {
          // 3-8 min = WARM (medium protection)
          cost = GRID_WARS_CONFIG.takeoverCostWarm;
          activityTier = 'WARM';
          defenderIsActive = false;
        } else {
          // >8 min = COLD (no protection)
          cost = GRID_WARS_CONFIG.takeoverCostCold;
          activityTier = 'COLD';
          defenderIsActive = false;
        }

        // v1.5: Apply velocity discount for attackers who are earning fast
        const velocity = await getPlayerVelocity(gameId, username);
        const velocityTier = getVelocityTier(velocity);
        if (velocityTier.discount > 0) {
          cost = Math.ceil(cost * (1 - velocityTier.discount));
        }

        // v1.5: Apply guerrilla discount (small vs large)
        const attackerCells = player?.territories_count || 0;
        const { data: defenderData } = await supabase
          .from('grid_wars_players')
          .select('territories_count')
          .eq('game_id', gameId)
          .eq('username', previousOwner)
          .single();
        const defenderCells = defenderData?.territories_count || 0;
        const guerrilla = getGuerrillaDiscount(attackerCells, defenderCells);
        if (guerrilla.discount > 0) {
          cost = Math.ceil(cost * (1 - guerrilla.discount));
        }

        // v1.5: Apply overextension discount (isolated/edge cells easier to take)
        const overextension = await getOverextensionDiscount(gameId, x, y, previousOwner);
        if (overextension.discount > 0) {
          cost = Math.ceil(cost * (1 - overextension.discount));
        }

        // v2.2.5: Apply fortification multiplier (attacks inside enemy's developed territory cost more)
        const fortification = await getFortificationMultiplier(gameId, username, targetAddress);
        if (fortification.isFortified) {
          cost = Math.ceil(cost * fortification.multiplier);
        }
      } else if (isResourceNode) {
        cost = GRID_WARS_CONFIG.nodeClaimCost;
      } else if (isSurgeCell) {
        cost = GRID_WARS_CONFIG.surgeCost;
      }

      // v1.5: Apply scarcity pricing for neutral cell claims
      // (not enemy takeovers, not surge cells - those are meant to be cheap opportunities)
      let scarcityMultiplier = 1.0;
      let scarcityPhase = null;
      if (!isEnemyTakeover && !isSurgeCell) {
        const fillPercent = await getMapFillPercent(gameId);
        scarcityMultiplier = getScarcityMultiplier(fillPercent);
        scarcityPhase = getScarcityPhase(fillPercent);
        cost = Math.ceil(cost * scarcityMultiplier);
      }

      // v1.3: Apply soft point ceiling (logarithmic cost scaling)
      const baseCost = cost;
      cost = calculateScaledCost(cost, currentPoints);

      // v1.3.1: Check for underdog assist (50% discount for players with 0 territory)
      let underdogApplied = false;
      const underdogResult = await checkUnderdogEligibility(gameId, username);
      if (underdogResult.eligible && !isEnemyTakeover) {
        // Apply discount only for neutral cell claims (not takeovers)
        const discountedCost = Math.max(
          underdogResult.minCost,
          Math.floor(cost * underdogResult.discount)
        );
        cost = discountedCost;
        underdogApplied = true;
      }

      if (currentPoints < cost) {
        return res.status(400).json({
          error: `Insufficient points. Need ${cost}, have ${currentPoints}`,
          baseCost,
          scaledCost: cost
        });
      }

      // Claim or update territory (works for neutral, resource nodes, AND enemy territories)
      if (existingTerritory) {
        // Update existing (resource node or enemy takeover)
        // v2.1.5: Update by ID or address for subcells
        const updateData = {
          owner: username,
          claimed_at: new Date().toISOString(),
          strength: GRID_WARS_CONFIG.maxCellStrength
        };
        // v2.1.3: Include address if missing (for legacy cells without address)
        if (!existingTerritory.address) {
          updateData.address = targetAddress;
          updateData.parent_address = parentAddress || null;
          updateData.cell_level = targetLevel;
          updateData.is_developed = existingTerritory.is_developed || false;
        }

        // v2.1.5: Use ID for precise updates (subcells share x,y with parent)
        if (existingTerritory.id) {
          await supabase
            .from('grid_wars_territories')
            .update(updateData)
            .eq('id', existingTerritory.id);
        } else if (parentAddress) {
          // Subcell - update by address
          await supabase
            .from('grid_wars_territories')
            .update(updateData)
            .eq('game_id', gameId)
            .eq('address', targetAddress);
        } else {
          // Macro - update by x,y (backwards compatible)
          await supabase
            .from('grid_wars_territories')
            .update(updateData)
            .eq('game_id', gameId)
            .eq('x', x)
            .eq('y', y)
            .is('parent_address', null);
        }

        // Decrement previous owner's territory count if takeover
        if (isEnemyTakeover) {
          await supabase.rpc('increment_territories_count', {
            p_game_id: gameId,
            p_username: previousOwner,
            p_delta: -1
          });

          // Notify the defender they lost territory
          broadcast({
            type: 'territory_lost',
            gameId,
            username: previousOwner,
            x,
            y,
            takenBy: username
          });

          // v1.5: Award bounty bonus if defender was a bounty target
          if (await isBountyTarget(gameId, previousOwner)) {
            const bountyBonus = GRID_WARS_CONFIG.bountyBonusPoints;
            await supabase
              .from('grid_wars_players')
              .update({
                action_points: (player?.action_points || 0) - cost + bountyBonus
              })
              .eq('game_id', gameId)
              .eq('username', username);

            broadcast({
              type: 'bounty_claimed',
              gameId,
              attacker: username,
              defender: previousOwner,
              bonus: bountyBonus,
              x,
              y,
              message: `🎯 BOUNTY CLAIMED! +${bountyBonus} pts for striking ${previousOwner}`
            });

            console.log(`Grid Wars v1.5: ${username} claimed bounty on ${previousOwner} (+${bountyBonus} pts)`);
          }
        }
      } else {
        // Insert new territory
        // v2.2.1: Fixed - use targetAddress and correct parent/level for subcell claims
        await supabase
          .from('grid_wars_territories')
          .insert({
            game_id: gameId,
            x,
            y,
            owner: username,
            strength: GRID_WARS_CONFIG.maxCellStrength,
            address: targetAddress,           // v2.2.1: Full address (e.g., "e4.b3" for subcells)
            parent_address: parentAddress || null,  // v2.2.1: Parent from request
            cell_level: targetLevel,          // v2.2.1: Level from request
            is_developed: false
          });
      }

      // Apply resource node buff if applicable
      let buffApplied = null;
      if (isResourceNode) {
        const nodeType = existingTerritory.node_type;
        const updatedBuffs = player?.active_buffs || {};

        if (nodeType === 'amplifier') {
          updatedBuffs.amplifier = { remaining: GRID_WARS_CONFIG.amplifierCharges };
          buffApplied = { type: 'amplifier', charges: GRID_WARS_CONFIG.amplifierCharges };
        } else if (nodeType === 'beacon') {
          const expiresAt = new Date(Date.now() + GRID_WARS_CONFIG.beaconDuration * 1000).toISOString();
          updatedBuffs.beacon = { expires: expiresAt };
          buffApplied = { type: 'beacon', duration: GRID_WARS_CONFIG.beaconDuration };
        } else if (nodeType === 'anchor') {
          const expiresAt = new Date(Date.now() + GRID_WARS_CONFIG.anchorDuration * 1000).toISOString();
          updatedBuffs.anchor = { expires: expiresAt };
          buffApplied = { type: 'anchor', duration: GRID_WARS_CONFIG.anchorDuration };
        }

        // Update player buffs
        await supabase
          .from('grid_wars_players')
          .update({ active_buffs: updatedBuffs })
          .eq('game_id', gameId)
          .eq('username', username);

        broadcast({
          type: 'buff_acquired',
          gameId,
          username,
          buff: buffApplied
        });
      }

      // Clear surge cell if claimed
      if (isSurgeCell) {
        await supabase
          .from('grid_wars_games')
          .update({
            surge_cell_x: null,
            surge_cell_y: null,
            surge_expires: null
          })
          .eq('game_id', gameId);

        broadcast({
          type: 'surge_claimed',
          gameId,
          x,
          y,
          claimedBy: username
        });
      }

      // Update player stats
      await upsertGridWarsPlayer(gameId, username, -cost, 1);

      // Update player's largest cluster
      const newCluster = await updatePlayerCluster(gameId, username);

      // Increment class goal and check if reached
      const goalResult = await incrementClassGoal(gameId);

      // v2.2.5: Process landlord tax for subcell claims/attacks
      const taxResult = await processLandlordTax(gameId, username, targetAddress, cost);
      if (taxResult) {
        // Broadcast rent notification to landlord
        broadcast({
          type: 'rent_collected',
          gameId,
          landlord: taxResult.landlord,
          tenant: taxResult.tenant,
          rent: taxResult.rent,
          cell: taxResult.cell
        });
      }

      // Broadcast
      // v2.1.5: Include address info for subcell claims
      broadcast({
        type: 'territory_claimed',
        gameId,
        username,
        x,
        y,
        address: targetAddress,      // v2.1.5
        parentAddress: parentAddress || null,  // v2.1.5
        cellLevel: targetLevel,      // v2.1.5
        cluster: newCluster,
        isNode: isResourceNode,
        nodeType: existingTerritory?.node_type,
        isTakeover: isEnemyTakeover,
        previousOwner: isEnemyTakeover ? previousOwner : null,
        activityTier: isEnemyTakeover ? activityTier : null  // v1.2.1: For display
      });

      // v1.6: Broadcast leaderboard update for real-time UI sync
      broadcastLeaderboardUpdate(gameId);

      // v1.3: Build authoritative cell state for client reconciliation
      // v2.1.5: Include address info
      const authoritativeCell = {
        x,
        y,
        address: targetAddress,
        parent_address: parentAddress || null,
        cell_level: targetLevel,
        owner: username,
        strength: GRID_WARS_CONFIG.maxCellStrength,
        claimed_at: new Date().toISOString(),
        node_type: existingTerritory?.node_type || null
      };

      // v1.3: Telemetry tracking
      if (isEnemyTakeover) {
        telemetryIncrementTakeoverTier(activityTier);
        trackOwnershipChange('takeover');
      } else {
        telemetryIncrement('claims_total');
        trackOwnershipChange('claim');
      }

      // v1.3.1: Track first claim for onboarding friction metric
      trackFirstClaim(gameId, username);

      // v1.3.1: Mark underdog assist as used if applied
      if (underdogApplied) {
        markUnderdogUsed(gameId, username);
      }

      res.json({
        success: true,
        action: 'claim',
        actionId,  // v1.3: Echo actionId for reconciliation
        x,
        y,
        address: targetAddress,         // v2.1.5: Full address including parent
        parentAddress: parentAddress || null,  // v2.1.5
        cellLevel: targetLevel,         // v2.1.5
        cost,
        baseCost,  // v1.3: Base cost before scaling (for UI display)
        newPoints: currentPoints - cost,
        cluster: newCluster,
        classGoal: goalResult,
        buffApplied,
        wasSurge: isSurgeCell,
        isTakeover: isEnemyTakeover,
        previousOwner: isEnemyTakeover ? previousOwner : null,
        defenderWasActive: defenderIsActive,
        activityTier: isEnemyTakeover ? activityTier : null,  // v1.2.1: 3-tier pricing feedback
        authoritativeCell,  // v1.3: Server-authoritative cell state
        underdogApplied  // v1.3.1: Whether underdog discount was applied
      });

    } else {
      // v1.2: Removed reinforce action (contestation system removed)
      return res.status(400).json({ error: 'Invalid action. Use "claim"' });
    }
  } catch (err) {
    console.error('POST /api/grid-wars/action error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Upsert player and update stats
// v1.4: Also updates lifetime_earned when points are ADDED (positive delta)
async function upsertGridWarsPlayer(gameId, username, pointsDelta, territoriesDelta = 0) {
  // First try to get existing player
  const { data: existing } = await supabase
    .from('grid_wars_players')
    .select('action_points, territories_count, lifetime_earned')
    .eq('game_id', gameId)
    .eq('username', username)
    .single();

  // v1.4: Only add to lifetime_earned when earning (positive delta)
  const isEarning = pointsDelta > 0;

  if (existing) {
    // Update existing
    const updateData = {
      action_points: Math.max(0, existing.action_points + pointsDelta),
      territories_count: Math.max(0, existing.territories_count + territoriesDelta)
    };

    // v1.4: Track lifetime_earned for earnings only (not spending)
    if (isEarning) {
      updateData.lifetime_earned = (existing.lifetime_earned || 0) + pointsDelta;
    }

    const { error } = await supabase
      .from('grid_wars_players')
      .update(updateData)
      .eq('game_id', gameId)
      .eq('username', username);

    if (error) throw error;
    return existing.action_points + pointsDelta;
  } else {
    // Insert new
    const { error } = await supabase
      .from('grid_wars_players')
      .insert({
        game_id: gameId,
        username,
        action_points: Math.max(0, pointsDelta),
        territories_count: Math.max(0, territoriesDelta),
        // v1.4: Initialize lifetime_earned (only if earning)
        lifetime_earned: isEarning ? pointsDelta : 0
      });

    if (error) throw error;
    return pointsDelta;
  }
}

// Get player stats
app.get('/api/grid-wars/players/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId query parameter required' });
    }

    const { data: player, error } = await supabase
      .from('grid_wars_players')
      .select('*')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Player not found - return defaults
        return res.json({
          username,
          game_id: gameId,
          action_points: 0,
          territories_count: 0,
          structures_count: 0
        });
      }
      throw error;
    }

    res.json(player);
  } catch (err) {
    console.error('GET /api/grid-wars/players/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add action points (called when star is earned)
app.post('/api/grid-wars/points/add', async (req, res) => {
  try {
    const { gameId, username, starType, points } = req.body;

    if (!gameId || !username) {
      return res.status(400).json({ error: 'gameId and username required' });
    }

    // Determine base points to add
    let basePoints = points;
    if (basePoints === undefined && starType) {
      basePoints = GRID_WARS_CONFIG.starPoints[starType] || 0;
    }
    if (!basePoints || basePoints <= 0) {
      return res.status(400).json({ error: 'points or valid starType required' });
    }

    // Calculate contiguity bonus based on largest cluster
    const cluster = await calculateLargestCluster(gameId, username);
    const contiguityBonus = Math.min(
      GRID_WARS_CONFIG.maxContiguityBonus,
      Math.floor(cluster / 5)
    );

    // Check for amplifier buff
    let amplifierBonus = 0;
    const { data: player } = await supabase
      .from('grid_wars_players')
      .select('active_buffs')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    let updatedBuffs = player?.active_buffs || {};
    if (updatedBuffs.amplifier && updatedBuffs.amplifier.remaining > 0) {
      amplifierBonus = GRID_WARS_CONFIG.amplifierBonus;
      updatedBuffs.amplifier.remaining -= 1;

      // Remove amplifier buff if exhausted
      if (updatedBuffs.amplifier.remaining <= 0) {
        delete updatedBuffs.amplifier;
      }
    }

    const totalPoints = basePoints + contiguityBonus + amplifierBonus;

    // Update player with points, last_answer_at, and buffs
    const { data: existingPlayer } = await supabase
      .from('grid_wars_players')
      .select('action_points, territories_count, lifetime_earned')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    // v1.4: Calculate diminishing returns multiplier based on empire size
    let earningMultiplier = 1.0;
    if (GRID_WARS_CONFIG.diminishingReturnsEnabled) {
      const territoriesCount = existingPlayer?.territories_count || 0;
      const threshold = GRID_WARS_CONFIG.diminishingReturnsThreshold || 25;
      const minMultiplier = GRID_WARS_CONFIG.diminishingReturnsMinMultiplier || 0.5;
      const factor = GRID_WARS_CONFIG.diminishingReturnsFactor || 0.005;

      if (territoriesCount > threshold) {
        const excess = territoriesCount - threshold;
        earningMultiplier = Math.max(minMultiplier, 1 - (excess * factor));
      }
    }

    // Apply diminishing returns to get adjusted points
    const adjustedPoints = Math.ceil(totalPoints * earningMultiplier);

    if (existingPlayer) {
      await supabase
        .from('grid_wars_players')
        .update({
          action_points: existingPlayer.action_points + adjustedPoints,
          // v1.4: Track lifetime_earned separately (never decreases)
          lifetime_earned: (existingPlayer.lifetime_earned || 0) + adjustedPoints,
          last_answer_at: new Date().toISOString(),
          active_buffs: updatedBuffs
        })
        .eq('game_id', gameId)
        .eq('username', username);
    } else {
      await supabase
        .from('grid_wars_players')
        .insert({
          game_id: gameId,
          username,
          action_points: adjustedPoints,
          // v1.4: Track lifetime_earned separately (never decreases)
          lifetime_earned: adjustedPoints,
          last_answer_at: new Date().toISOString(),
          active_buffs: updatedBuffs
        });
    }

    const newTotal = (existingPlayer?.action_points || 0) + adjustedPoints;

    // v1.5.1: Record point event for velocity tracking (persisted to Supabase)
    await recordPointEvent(gameId, username, adjustedPoints, 'star_earned');

    // v1.5: Calculate and broadcast velocity tier
    const velocity = await getPlayerVelocity(gameId, username);
    const velocityTier = getVelocityTier(velocity);
    broadcast({
      type: 'velocity_update',
      gameId,
      username,
      tier: velocityTier.tier,
      discount: velocityTier.discount,
      velocity
    });

    // Broadcast points earned
    broadcast({
      type: 'points_earned',
      gameId,
      username,
      points: adjustedPoints,
      basePoints,
      contiguityBonus,
      amplifierBonus,
      cluster,
      // v1.4: Include diminishing returns info
      earningMultiplier,
      preDiminishing: totalPoints,
      total: newTotal,
      starType: starType || null
    });

    // v1.6: Broadcast leaderboard update for real-time UI sync
    broadcastLeaderboardUpdate(gameId);

    // v1.4: Log with multiplier info
    const multiplierInfo = earningMultiplier < 1.0 ? ` [${Math.round(earningMultiplier * 100)}% due to empire size]` : '';
    console.log(`Grid Wars: ${username} earned ${adjustedPoints} points (base: ${basePoints}, cluster: +${contiguityBonus}, amplifier: +${amplifierBonus})${multiplierInfo}`);
    res.json({
      success: true,
      pointsAdded: adjustedPoints,
      breakdown: {
        base: basePoints,
        contiguityBonus,
        amplifierBonus,
        cluster,
        // v1.4: Include diminishing returns info
        earningMultiplier,
        preDiminishing: totalPoints
      },
      newTotal
    });
  } catch (err) {
    console.error('POST /api/grid-wars/points/add error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// v2.0: HIERARCHICAL SUBDIVISION ENDPOINTS
// ============================================

/**
 * POST /api/grid-wars/develop
 * Owner develops (subdivides) their cell into 8x8 subcells
 * - Costs 100 points (configurable via developmentCost)
 * - Owner keeps center 4 cells (d4, d5, e4, e5)
 * - Creates 64 subcells (60 neutral, 4 owned)
 */
app.post('/api/grid-wars/develop', async (req, res) => {
  try {
    const { gameId, username, address } = req.body;

    if (!gameId || !username || !address) {
      return res.status(400).json({ error: 'gameId, username, and address required' });
    }

    // Check if hierarchy is enabled
    if (!GRID_WARS_CONFIG.hierarchyEnabled) {
      return res.status(501).json({ error: 'Hierarchical territories not enabled' });
    }

    // 1. Verify cell exists and player owns it
    const { data: cell, error: cellError } = await supabase
      .from('grid_wars_territories')
      .select('*')
      .eq('game_id', gameId)
      .eq('address', address)
      .single();

    if (cellError || !cell) {
      return res.status(404).json({ error: 'Cell not found' });
    }

    if (cell.owner !== username) {
      return res.status(403).json({ error: 'You do not own this cell' });
    }

    if (cell.is_developed) {
      return res.status(400).json({ error: 'Cell already developed' });
    }

    // Check max subdivision level
    const currentLevel = getLevel(address);
    if (currentLevel >= GRID_WARS_CONFIG.maxSubdivisionLevel) {
      return res.status(400).json({
        error: `Maximum subdivision depth reached (${GRID_WARS_CONFIG.maxSubdivisionLevel})`
      });
    }

    // 2. Check player has enough points
    const { data: player, error: playerError } = await supabase
      .from('grid_wars_players')
      .select('action_points')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const cost = GRID_WARS_CONFIG.developmentCost;
    if (player.action_points < cost) {
      return res.status(400).json({
        error: 'Insufficient points',
        required: cost,
        available: player.action_points
      });
    }

    // 3. Deduct points
    await supabase
      .from('grid_wars_players')
      .update({ action_points: player.action_points - cost })
      .eq('game_id', gameId)
      .eq('username', username);

    // 4. Mark cell as developed
    await supabase
      .from('grid_wars_territories')
      .update({ is_developed: true })
      .eq('game_id', gameId)
      .eq('address', address);

    // 5. Create 64 subcells
    const newLevel = currentLevel + 1;
    const centerCells = GRID_WARS_CONFIG.ownerRetentionCells || CENTER_CELLS;
    const subcells = [];
    const now = new Date().toISOString();

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const localAddress = coordsToAddress(x, y);
        const fullAddress = buildAddress(address, x, y);
        const isCenter = centerCells.includes(localAddress);

        subcells.push({
          game_id: gameId,
          address: fullAddress,
          parent_address: address,
          cell_level: newLevel,
          x: x,
          y: y,
          owner: isCenter ? username : null,
          claimed_at: isCenter ? now : null,
          is_developed: false,
          strength: isCenter ? GRID_WARS_CONFIG.maxCellStrength : null
        });
      }
    }

    // v2.1.4: Enhanced error logging for develop subcell creation
    console.log(`[Develop] Creating ${subcells.length} subcells for ${address} at level ${newLevel}`);
    console.log(`[Develop] Sample subcell:`, JSON.stringify(subcells[0], null, 2));

    const { error: insertError } = await supabase
      .from('grid_wars_territories')
      .insert(subcells);

    if (insertError) {
      console.error('[Develop] Supabase insert error:', insertError);
      console.error('[Develop] Error code:', insertError.code);
      console.error('[Develop] Error message:', insertError.message);
      console.error('[Develop] Error details:', insertError.details);
      console.error('[Develop] Failed subcells sample:', JSON.stringify(subcells.slice(0, 2), null, 2));
      return res.status(500).json({
        error: 'Failed to create subcells',
        details: insertError.message,
        code: insertError.code
      });
    }

    // 6. Broadcast development event
    broadcast({
      type: 'cell_developed',
      gameId,
      address,
      developer: username,
      newCells: 64,
      ownerRetained: centerCells.length,
      newLevel
    });

    // Update leaderboard
    broadcastLeaderboardUpdate(gameId);

    console.log(`Grid Wars v2.0: ${username} developed ${address} (64 subcells, kept ${centerCells.length})`);

    res.json({
      success: true,
      address,
      subcellsCreated: 64,
      ownerRetained: centerCells.length,
      ownerCells: centerCells.map(c => buildAddress(address, addressToCoords(c).x, addressToCoords(c).y)),
      cost
    });

  } catch (err) {
    console.error('POST /api/grid-wars/develop error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/grid-wars/drill
 * Attacker forces subdivision of enemy cell
 * - Only available at 85%+ map saturation
 * - Costs 75 points (configurable via drillCost)
 * - Original owner keeps center 4 cells (d4, d5, e4, e5)
 * - Attacker gets corner cell (a1)
 * - Creates 64 subcells (59 neutral, 4 defender, 1 attacker)
 */
app.post('/api/grid-wars/drill', async (req, res) => {
  try {
    const { gameId, username, targetAddress } = req.body;

    if (!gameId || !username || !targetAddress) {
      return res.status(400).json({ error: 'gameId, username, and targetAddress required' });
    }

    // Check if hierarchy is enabled
    if (!GRID_WARS_CONFIG.hierarchyEnabled) {
      return res.status(501).json({ error: 'Hierarchical territories not enabled' });
    }

    // 1. Check map saturation (drilling only at 85%+)
    const { data: allCells, error: countError } = await supabase
      .from('grid_wars_territories')
      .select('owner')
      .eq('game_id', gameId)
      .eq('cell_level', 0);  // Only check macro level

    if (countError) {
      return res.status(500).json({ error: 'Failed to check map saturation' });
    }

    const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
    const claimedCells = (allCells || []).filter(c => c.owner).length;
    const fillPercent = (claimedCells / totalCells) * 100;
    const threshold = GRID_WARS_CONFIG.drillSaturationThreshold || 85;

    if (fillPercent < threshold) {
      return res.status(400).json({
        error: `Drilling only available at ${threshold}%+ map saturation`,
        currentFill: fillPercent.toFixed(1),
        required: threshold
      });
    }

    // 2. Verify target cell exists and is enemy-owned
    const { data: target, error: targetError } = await supabase
      .from('grid_wars_territories')
      .select('*')
      .eq('game_id', gameId)
      .eq('address', targetAddress)
      .single();

    if (targetError || !target) {
      return res.status(404).json({ error: 'Cell not found' });
    }

    if (!target.owner) {
      return res.status(400).json({ error: 'Cannot drill neutral cell — just claim it' });
    }

    if (target.owner === username) {
      return res.status(400).json({ error: 'Cannot drill your own cell — use develop instead' });
    }

    if (target.is_developed) {
      return res.status(400).json({ error: 'Cell already developed — zoom in and claim subcells' });
    }

    // Check max subdivision level
    const currentLevel = getLevel(targetAddress);
    if (currentLevel >= GRID_WARS_CONFIG.maxSubdivisionLevel) {
      return res.status(400).json({
        error: `Maximum subdivision depth reached (${GRID_WARS_CONFIG.maxSubdivisionLevel})`
      });
    }

    // 3. Check attacker has enough points
    const { data: attacker, error: attackerError } = await supabase
      .from('grid_wars_players')
      .select('action_points')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    if (attackerError || !attacker) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const cost = GRID_WARS_CONFIG.drillCost;
    if (attacker.action_points < cost) {
      return res.status(400).json({
        error: 'Insufficient points',
        required: cost,
        available: attacker.action_points
      });
    }

    // 4. Deduct points from attacker
    await supabase
      .from('grid_wars_players')
      .update({ action_points: attacker.action_points - cost })
      .eq('game_id', gameId)
      .eq('username', username);

    // 5. Mark cell as developed
    await supabase
      .from('grid_wars_territories')
      .update({ is_developed: true })
      .eq('game_id', gameId)
      .eq('address', targetAddress);

    // 6. Create 64 subcells
    const originalOwner = target.owner;
    const newLevel = currentLevel + 1;
    const centerCells = GRID_WARS_CONFIG.ownerRetentionCells || CENTER_CELLS;
    const attackerCell = GRID_WARS_CONFIG.attackerDrillCell || DRILL_CELL;
    const subcells = [];
    const now = new Date().toISOString();

    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const localAddress = coordsToAddress(x, y);
        const fullAddress = buildAddress(targetAddress, x, y);

        let owner = null;
        let claimedAt = null;
        let strength = null;

        if (centerCells.includes(localAddress)) {
          owner = originalOwner;
          claimedAt = now;
          strength = GRID_WARS_CONFIG.maxCellStrength;
        } else if (localAddress === attackerCell) {
          owner = username;
          claimedAt = now;
          strength = GRID_WARS_CONFIG.maxCellStrength;
        }

        subcells.push({
          game_id: gameId,
          address: fullAddress,
          parent_address: targetAddress,
          cell_level: newLevel,
          x: x,
          y: y,
          owner,
          claimed_at: claimedAt,
          is_developed: false,
          strength
        });
      }
    }

    // v2.1.4: Enhanced error logging for drill subcell creation
    console.log(`[Drill] Creating ${subcells.length} subcells for ${targetAddress} at level ${newLevel}`);
    console.log(`[Drill] Sample subcell:`, JSON.stringify(subcells[0], null, 2));

    const { error: insertError } = await supabase
      .from('grid_wars_territories')
      .insert(subcells);

    if (insertError) {
      console.error('[Drill] Supabase insert error:', insertError);
      console.error('[Drill] Error code:', insertError.code);
      console.error('[Drill] Error message:', insertError.message);
      console.error('[Drill] Error details:', insertError.details);
      console.error('[Drill] Failed subcells sample:', JSON.stringify(subcells.slice(0, 2), null, 2));
      return res.status(500).json({
        error: 'Failed to create subcells',
        details: insertError.message,
        code: insertError.code
      });
    }

    // 7. Broadcast drill event
    const attackerFullAddress = buildAddress(targetAddress, addressToCoords(attackerCell).x, addressToCoords(attackerCell).y);
    const defenderCells = centerCells.map(c => buildAddress(targetAddress, addressToCoords(c).x, addressToCoords(c).y));

    broadcast({
      type: 'cell_drilled',
      gameId,
      address: targetAddress,
      attacker: username,
      defender: originalOwner,
      attackerGained: attackerFullAddress,
      defenderRetained: defenderCells,
      newLevel
    });

    // Update leaderboard
    broadcastLeaderboardUpdate(gameId);

    console.log(`Grid Wars v2.0: ${username} drilled into ${originalOwner}'s ${targetAddress}`);

    res.json({
      success: true,
      address: targetAddress,
      attackerCell: attackerFullAddress,
      defenderCells,
      cost
    });

  } catch (err) {
    console.error('POST /api/grid-wars/drill error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * v2.2: POST /api/grid-wars/gift
 * Gift a cell to another player (free transfer)
 */
app.post('/api/grid-wars/gift', async (req, res) => {
  try {
    const { gameId, fromUsername, toUsername, address } = req.body;

    console.log('[Gift]', { from: fromUsername, to: toUsername, address });

    if (!gameId || !fromUsername || !toUsername || !address) {
      return res.status(400).json({ error: 'gameId, fromUsername, toUsername, and address required' });
    }

    // Can't gift to yourself
    if (fromUsername === toUsername) {
      return res.status(400).json({ error: 'Cannot gift to yourself' });
    }

    // 1. Verify ownership
    const { data: cell, error: cellError } = await supabase
      .from('grid_wars_territories')
      .select('owner, is_developed, cell_level')
      .eq('game_id', gameId)
      .eq('address', address)
      .single();

    if (cellError || !cell) {
      return res.status(404).json({ error: 'Cell not found' });
    }

    if (cell.owner !== fromUsername) {
      return res.status(403).json({ error: 'You do not own this cell' });
    }

    // 2. Verify recipient exists in game
    const { data: recipient } = await supabase
      .from('grid_wars_players')
      .select('username')
      .eq('game_id', gameId)
      .eq('username', toUsername)
      .single();

    if (!recipient) {
      return res.status(404).json({ error: `Player "${toUsername}" not found in this game` });
    }

    // 3. Transfer ownership
    await supabase
      .from('grid_wars_territories')
      .update({
        owner: toUsername,
        claimed_at: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .eq('address', address);

    // 4. Update territory counts for both players
    await supabase.rpc('increment_territories_count', {
      p_game_id: gameId,
      p_username: fromUsername,
      p_delta: -1
    });
    await supabase.rpc('increment_territories_count', {
      p_game_id: gameId,
      p_username: toUsername,
      p_delta: 1
    });

    // 5. Record the gift
    await supabase.from('grid_wars_gifts').insert({
      game_id: gameId,
      from_username: fromUsername,
      to_username: toUsername,
      address: address
    });

    // 6. Broadcast
    broadcast({
      type: 'territory_gifted',
      gameId,
      from: fromUsername,
      to: toUsername,
      address: address
    });

    // 7. Update leaderboard
    broadcastLeaderboardUpdate(gameId);

    console.log('[Gift] Success:', fromUsername, '->', toUsername, address);
    res.json({ success: true, from: fromUsername, to: toUsername, address });
  } catch (err) {
    console.error('POST /api/grid-wars/gift error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get leaderboard for Grid Wars
// v1.6: Single leaderboard sorted by lifetime_earned
// v2.0: Includes macro_cells and sub_cells counts for hierarchy display
app.get('/api/grid-wars/leaderboard', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId query parameter required' });
    }

    // v1.6: Select lifetime_earned and sort by it (single metric leaderboard)
    const { data: players, error } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, lifetime_earned')
      .eq('game_id', gameId)
      .order('lifetime_earned', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return res.json([]);
      }
      throw error;
    }

    // v2.0: Get cell counts by level (macro vs subcell)
    const { data: territories } = await supabase
      .from('grid_wars_territories')
      .select('owner, cell_level')
      .eq('game_id', gameId)
      .not('owner', 'is', null);

    // Count macro (level 0) and sub (level > 0) cells per player
    const cellCounts = {};
    for (const t of territories || []) {
      if (!cellCounts[t.owner]) {
        cellCounts[t.owner] = { macro: 0, sub: 0 };
      }
      if (t.cell_level === 0 || t.cell_level === null) {
        cellCounts[t.owner].macro++;
      } else {
        cellCounts[t.owner].sub++;
      }
    }

    // Get real names
    const usernames = (players || []).map(p => p.username);
    let usersMap = {};
    if (usernames.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('username, real_name')
        .in('username', usernames);

      for (const u of users || []) {
        usersMap[u.username] = u.real_name;
      }
    }

    const leaderboard = (players || []).map(p => ({
      ...p,
      real_name: usersMap[p.username] || null,
      macro_cells: cellCounts[p.username]?.macro || 0,    // v2.0
      sub_cells: cellCounts[p.username]?.sub || 0         // v2.0
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('GET /api/grid-wars/leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * v1.6: Broadcast leaderboard update to all connected clients
 * Called after territory claims or points earned to keep UI in sync
 * v2.0: Includes macro_cells and sub_cells for hierarchy display
 */
async function broadcastLeaderboardUpdate(gameId) {
  try {
    const { data: players, error } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, lifetime_earned')
      .eq('game_id', gameId)
      .order('lifetime_earned', { ascending: false });

    if (error) {
      console.error('broadcastLeaderboardUpdate error:', error);
      return;
    }

    // v2.0: Get cell counts by level (macro vs subcell)
    const { data: territories } = await supabase
      .from('grid_wars_territories')
      .select('owner, cell_level')
      .eq('game_id', gameId)
      .not('owner', 'is', null);

    const cellCounts = {};
    for (const t of territories || []) {
      if (!cellCounts[t.owner]) {
        cellCounts[t.owner] = { macro: 0, sub: 0 };
      }
      if (t.cell_level === 0 || t.cell_level === null) {
        cellCounts[t.owner].macro++;
      } else {
        cellCounts[t.owner].sub++;
      }
    }

    // Get real names
    const usernames = (players || []).map(p => p.username);
    let usersMap = {};
    if (usernames.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('username, real_name')
        .in('username', usernames);

      for (const u of users || []) {
        usersMap[u.username] = u.real_name;
      }
    }

    const leaderboard = (players || []).map(p => ({
      ...p,
      real_name: usersMap[p.username] || null,
      macro_cells: cellCounts[p.username]?.macro || 0,
      sub_cells: cellCounts[p.username]?.sub || 0
    }));

    broadcast({
      type: 'leaderboard_update',
      gameId,
      leaderboard
    });
  } catch (err) {
    console.error('broadcastLeaderboardUpdate error:', err);
  }
}

// v1.4: Multi-dimensional leaderboard (Scholar, Banker, General)
app.get('/api/grid-wars/leaderboard/multi', async (req, res) => {
  try {
    const { gameId, username, limit = 5 } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId query parameter required' });
    }

    const parsedLimit = Math.min(parseInt(limit) || 5, 20);

    // Get all players for the game with relevant stats
    // Try with lifetime_earned first, fall back to without if column doesn't exist
    let allPlayers = null;
    let error = null;

    // First try with lifetime_earned column
    // Include all players (removed action_points > 0 filter that excluded spenders)
    const result1 = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, lifetime_earned')
      .eq('game_id', gameId);

    if (result1.error && result1.error.message?.includes('lifetime_earned')) {
      // Column doesn't exist, try without it
      console.log('[leaderboard/multi] lifetime_earned column not found, using fallback');
      const result2 = await supabase
        .from('grid_wars_players')
        .select('username, action_points, territories_count')
        .eq('game_id', gameId);
      allPlayers = result2.data;
      error = result2.error;
    } else {
      allPlayers = result1.data;
      error = result1.error;
    }

    if (error) {
      if (error.code === '42P01') {
        return res.json({ scholar: [], banker: [], general: [], playerRanks: null });
      }
      throw error;
    }

    const players = allPlayers || [];

    // Get real names
    const usernames = players.map(p => p.username);
    let usersMap = {};
    if (usernames.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('username, real_name')
        .in('username', usernames);

      for (const u of users || []) {
        usersMap[u.username] = u.real_name;
      }
    }

    // Scholar: Sort by lifetime_earned (total points earned)
    // Falls back to action_points if lifetime_earned not yet migrated
    const scholarRanked = [...players]
      .sort((a, b) => (b.lifetime_earned || b.action_points || 0) - (a.lifetime_earned || a.action_points || 0))
      .map((p, i) => ({
        rank: i + 1,
        username: p.username,
        real_name: usersMap[p.username] || null,
        value: p.lifetime_earned || p.action_points || 0,
        label: 'lifetime_earned'
      }));

    // Banker: Sort by action_points (current balance)
    const bankerRanked = [...players]
      .sort((a, b) => (b.action_points || 0) - (a.action_points || 0))
      .map((p, i) => ({
        rank: i + 1,
        username: p.username,
        real_name: usersMap[p.username] || null,
        value: p.action_points || 0,
        label: 'action_points'
      }));

    // General: Sort by territories_count (cells owned)
    const generalRanked = [...players]
      .sort((a, b) => (b.territories_count || 0) - (a.territories_count || 0))
      .map((p, i) => ({
        rank: i + 1,
        username: p.username,
        real_name: usersMap[p.username] || null,
        value: p.territories_count || 0,
        label: 'territories_count'
      }));

    // Calculate player's own ranks if username provided
    let playerRanks = null;
    if (username) {
      const scholarRank = scholarRanked.find(p => p.username === username);
      const bankerRank = bankerRanked.find(p => p.username === username);
      const generalRank = generalRanked.find(p => p.username === username);

      playerRanks = {
        scholar: scholarRank ? { rank: scholarRank.rank, value: scholarRank.value } : null,
        banker: bankerRank ? { rank: bankerRank.rank, value: bankerRank.value } : null,
        general: generalRank ? { rank: generalRank.rank, value: generalRank.value } : null
      };
    }

    res.json({
      scholar: scholarRanked.slice(0, parsedLimit),
      banker: bankerRanked.slice(0, parsedLimit),
      general: generalRanked.slice(0, parsedLimit),
      playerRanks
    });
  } catch (err) {
    console.error('GET /api/grid-wars/leaderboard/multi error:', err);
    res.status(500).json({ error: err.message });
  }
});

// v1.4: Teacher scouting report
app.get('/api/grid-wars/scouting-report', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId query parameter required' });
    }

    // Get all players with stats
    const { data: players, error } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, lifetime_earned, last_answer_at')
      .eq('game_id', gameId);

    if (error) {
      if (error.code === '42P01') {
        return res.json({ players: [], thresholds: GRID_WARS_CONFIG.scoutingThresholds });
      }
      throw error;
    }

    const allPlayers = players || [];

    // Get real names
    const usernames = allPlayers.map(p => p.username);
    let usersMap = {};
    if (usernames.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('username, real_name')
        .in('username', usernames);

      for (const u of users || []) {
        usersMap[u.username] = u.real_name;
      }
    }

    // Get thresholds from config
    const thresholds = GRID_WARS_CONFIG.scoutingThresholds || {
      highLifetime: 100,
      lowLifetime: 30,
      highCells: 15,
      lowCells: 3
    };

    // Calculate status for each player
    // Falls back to action_points if lifetime_earned not yet migrated
    const playersWithStatus = allPlayers.map(p => {
      const lifetime = p.lifetime_earned || p.action_points || 0;
      const cells = p.territories_count || 0;

      let status;
      if (lifetime >= thresholds.highLifetime && cells >= thresholds.highCells) {
        status = { code: 'leader', emoji: '👑', color: '#fbbf24' };
      } else if (lifetime >= thresholds.highLifetime && cells < thresholds.lowCells) {
        status = { code: 'aggressive', emoji: '🎯', color: '#f97316' };
      } else if (lifetime < thresholds.lowLifetime && cells < thresholds.lowCells) {
        status = { code: 'needs_help', emoji: '⚠️', color: '#ef4444' };
      } else {
        status = { code: 'active', emoji: '✓', color: '#22c55e' };
      }

      // Check if online (answered within last 10 minutes)
      const isOnline = p.last_answer_at &&
        (Date.now() - new Date(p.last_answer_at).getTime()) < 10 * 60 * 1000;

      return {
        username: p.username,
        real_name: usersMap[p.username] || null,
        action_points: p.action_points || 0,
        lifetime_earned: lifetime,  // Already uses fallback
        territories_count: cells,
        online: isOnline,
        status
      };
    });

    // Sort by lifetime_earned descending (which includes fallback)
    playersWithStatus.sort((a, b) => b.lifetime_earned - a.lifetime_earned);

    res.json({
      players: playersWithStatus,
      thresholds
    });
  } catch (err) {
    console.error('GET /api/grid-wars/scouting-report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// AVATAR SYSTEM ENDPOINTS
// ============================================

// Get player's avatar and position
app.get('/api/grid-wars/avatar/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const gameId = req.query.gameId || 'default';

    // Get player data
    const { data: player, error } = await supabase
      .from('grid_wars_players')
      .select('avatar_format, position_x, position_y, health')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!player) {
      // Player doesn't exist yet, return defaults
      return res.json({
        username,
        avatar: generateAvatarDisplay(username, 'A'),
        position: null,
        health: 100,
        needsInit: true
      });
    }

    const avatar = generateAvatarDisplay(username, player.avatar_format || 'A');

    res.json({
      username,
      avatar,
      position: { x: player.position_x, y: player.position_y },
      health: player.health || 100,
      needsInit: false
    });

  } catch (err) {
    console.error('GET /api/grid-wars/avatar/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Initialize player with avatar and spawn position
app.post('/api/grid-wars/avatar/init', async (req, res) => {
  try {
    const { username, gameId = 'default' } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Get all existing players for avatar format collision check
    const { data: existingPlayers } = await supabase
      .from('grid_wars_players')
      .select('username, avatar_format, position_x, position_y')
      .eq('game_id', gameId);

    // Determine avatar format (avoid collisions)
    const existingAvatars = (existingPlayers || []).map(p => ({
      username: p.username,
      format: p.avatar_format || 'A'
    }));
    const avatar = getUniqueAvatar(username, existingAvatars);

    // Calculate spawn position (far from others, away from edges)
    const mapSize = 20;
    const margin = 3;
    let spawnX = Math.floor(mapSize / 2);
    let spawnY = Math.floor(mapSize / 2);

    if (existingPlayers && existingPlayers.length > 0) {
      // Find position farthest from all existing players
      let bestDistance = 0;

      for (let x = margin; x < mapSize - margin; x++) {
        for (let y = margin; y < mapSize - margin; y++) {
          let minDist = Infinity;

          for (const p of existingPlayers) {
            if (p.position_x !== null && p.position_y !== null) {
              const dist = Math.sqrt(
                Math.pow(x - p.position_x, 2) + Math.pow(y - p.position_y, 2)
              );
              if (dist < minDist) minDist = dist;
            }
          }

          // If no players have positions, minDist stays Infinity
          if (minDist === Infinity) minDist = 999;

          if (minDist > bestDistance) {
            bestDistance = minDist;
            spawnX = x;
            spawnY = y;
          }
        }
      }
    }

    // v1.2.1: Check if player is new (for boot bonus)
    const existingPlayer = (existingPlayers || []).find(p => p.username === username);
    const isNewPlayer = !existingPlayer;

    // Upsert player with avatar and position
    const { data: player, error } = await supabase
      .from('grid_wars_players')
      .upsert({
        game_id: gameId,
        username,
        avatar_format: avatar.format,
        position_x: spawnX,
        position_y: spawnY,
        health: 100,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'game_id,username'
      })
      .select()
      .single();

    if (error) throw error;

    // v1.3.1: Track session start for telemetry
    trackPlayerSessionStart(gameId, username);

    // v1.2.1: Award boot bonus to new players
    let bootBonusAwarded = 0;
    if (isNewPlayer) {
      const bootBonus = GRID_WARS_CONFIG.bootBonus;
      await supabase
        .from('grid_wars_players')
        .update({ action_points: bootBonus })
        .eq('game_id', gameId)
        .eq('username', username);
      bootBonusAwarded = bootBonus;
      console.log(`Grid Wars: Boot bonus ${bootBonus} pts awarded to new player ${username}`);
    }

    // Broadcast new player joined
    broadcast({
      type: 'player_spawned',
      gameId,
      username,
      avatar,
      position: { x: spawnX, y: spawnY },
      health: 100,
      bootBonus: bootBonusAwarded  // v1.2.1: For toast notification
    });

    res.json({
      success: true,
      username,
      avatar,
      position: { x: spawnX, y: spawnY },
      health: 100,
      bootBonus: bootBonusAwarded,  // v1.2.1: For toast notification
      actionPoints: isNewPlayer ? bootBonusAwarded : (player?.action_points || 0)
    });

  } catch (err) {
    console.error('POST /api/grid-wars/avatar/init error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Move player avatar
app.post('/api/grid-wars/avatar/move', async (req, res) => {
  try {
    const { username, gameId = 'default', x, y } = req.body;

    if (!username || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'Username and position required' });
    }

    // Validate position is within map
    const mapSize = 20;
    if (x < 0 || x >= mapSize || y < 0 || y >= mapSize) {
      return res.status(400).json({ error: 'Position out of bounds' });
    }

    // Update player position
    const { data: player, error } = await supabase
      .from('grid_wars_players')
      .update({
        position_x: x,
        position_y: y,
        updated_at: new Date().toISOString()
      })
      .eq('game_id', gameId)
      .eq('username', username)
      .select()
      .single();

    if (error) throw error;

    // Broadcast movement
    broadcast({
      type: 'player_moved',
      gameId,
      username,
      position: { x, y }
    });

    res.json({
      success: true,
      position: { x, y }
    });

  } catch (err) {
    console.error('POST /api/grid-wars/avatar/move error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all players' avatars and positions for a game
app.get('/api/grid-wars/avatars', async (req, res) => {
  try {
    const gameId = req.query.gameId || 'default';

    const { data: players, error } = await supabase
      .from('grid_wars_players')
      .select('username, avatar_format, position_x, position_y, health, action_points')
      .eq('game_id', gameId);

    if (error) throw error;

    // Generate avatar displays for all players
    const avatars = (players || []).map(p => ({
      username: p.username,
      avatar: generateAvatarDisplay(p.username, p.avatar_format || 'A'),
      position: p.position_x !== null ? { x: p.position_x, y: p.position_y } : null,
      health: p.health || 100,
      points: p.action_points || 0
    }));

    res.json({ avatars });

  } catch (err) {
    console.error('GET /api/grid-wars/avatars error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Trigger surge event
app.post('/api/grid-wars/surge', async (req, res) => {
  try {
    const { gameId, password } = req.body;

    // Verify teacher password
    if (password !== TEACHER_PASSWORD) {
      return res.status(403).json({ error: 'Invalid teacher password' });
    }

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    // Check if there's already an active surge
    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('surge_cell_x, surge_expires')
      .eq('game_id', gameId)
      .single();

    if (game?.surge_expires && new Date(game.surge_expires) > new Date()) {
      return res.status(400).json({ error: 'A surge is already active' });
    }

    // Get all unclaimed cells (excluding resource nodes)
    const { data: territories } = await supabase
      .from('grid_wars_territories')
      .select('x, y')
      .eq('game_id', gameId);

    const claimedSet = new Set((territories || []).map(t => `${t.x},${t.y}`));

    // Find all unclaimed cells
    const unclaimedCells = [];
    for (let x = 0; x < GRID_WARS_CONFIG.mapSize; x++) {
      for (let y = 0; y < GRID_WARS_CONFIG.mapSize; y++) {
        if (!claimedSet.has(`${x},${y}`)) {
          unclaimedCells.push({ x, y });
        }
      }
    }

    if (unclaimedCells.length === 0) {
      return res.status(400).json({ error: 'No unclaimed cells available for surge' });
    }

    // Pick a random unclaimed cell
    const surgeCell = unclaimedCells[Math.floor(Math.random() * unclaimedCells.length)];
    const surgeExpires = new Date(Date.now() + GRID_WARS_CONFIG.surgeDuration * 1000).toISOString();

    // Update game with surge cell
    await supabase
      .from('grid_wars_games')
      .update({
        surge_cell_x: surgeCell.x,
        surge_cell_y: surgeCell.y,
        surge_expires: surgeExpires
      })
      .eq('game_id', gameId);

    // Broadcast surge event
    broadcast({
      type: 'surge_activated',
      gameId,
      x: surgeCell.x,
      y: surgeCell.y,
      cost: GRID_WARS_CONFIG.surgeCost,
      expiresIn: GRID_WARS_CONFIG.surgeDuration
    });

    console.log(`Grid Wars: Surge activated at (${surgeCell.x}, ${surgeCell.y}) for ${GRID_WARS_CONFIG.surgeDuration}s`);

    res.json({
      success: true,
      surge: {
        x: surgeCell.x,
        y: surgeCell.y,
        cost: GRID_WARS_CONFIG.surgeCost,
        expiresIn: GRID_WARS_CONFIG.surgeDuration
      }
    });
  } catch (err) {
    console.error('POST /api/grid-wars/surge error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Teacher: Update class goal target
app.post('/api/grid-wars/class-goal', async (req, res) => {
  try {
    const { gameId, password, target, reset } = req.body;

    // Verify teacher password
    if (password !== TEACHER_PASSWORD) {
      return res.status(403).json({ error: 'Invalid teacher password' });
    }

    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    const updates = {};
    if (target !== undefined) {
      updates.class_goal_target = target;
    }
    if (reset) {
      updates.class_goal_current = 0;
    }

    await supabase
      .from('grid_wars_games')
      .update(updates)
      .eq('game_id', gameId);

    broadcast({
      type: 'class_goal_updated',
      gameId,
      target: target || undefined,
      reset: reset || false
    });

    res.json({ success: true, updates });
  } catch (err) {
    console.error('POST /api/grid-wars/class-goal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// v1.3: SPAM PREVENTION ENDPOINTS
// ============================================

// Report wrong answer (called by client after incorrect drill submission)
app.post('/api/grid-wars/wrong-answer', async (req, res) => {
  try {
    const { gameId, username } = req.body;

    if (!gameId || !username) {
      return res.status(400).json({ error: 'gameId and username required' });
    }

    const result = trackWrongAnswer(gameId, username);

    if (result.triggered) {
      // Broadcast cooldown event to notify other clients
      broadcast({
        type: 'spam_cooldown_triggered',
        gameId,
        username,
        cooldownSeconds: GRID_WARS_CONFIG.spamCooldownSeconds
      });
    }

    res.json({
      success: true,
      inCooldown: result.inCooldown,
      cooldownRemaining: result.cooldownRemaining,
      message: result.inCooldown ? `SYSTEM RECALIBRATING (${result.cooldownRemaining}s remaining)` : null
    });
  } catch (err) {
    console.error('POST /api/grid-wars/wrong-answer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check cooldown status
app.get('/api/grid-wars/cooldown', async (req, res) => {
  try {
    const { gameId, username } = req.query;

    if (!gameId || !username) {
      return res.status(400).json({ error: 'gameId and username required' });
    }

    const result = checkCooldown(gameId, username);
    res.json(result);
  } catch (err) {
    console.error('GET /api/grid-wars/cooldown error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get game config (for client)
// v1.3: Added spam prevention settings, tier windows
app.get('/api/grid-wars/config', (req, res) => {
  res.json({
    mapSize: GRID_WARS_CONFIG.mapSize,
    claimCost: GRID_WARS_CONFIG.claimCost,
    takeoverCostBase: GRID_WARS_CONFIG.takeoverCostBase,
    takeoverCostCold: GRID_WARS_CONFIG.takeoverCostCold,
    takeoverCostWarm: GRID_WARS_CONFIG.takeoverCostWarm,
    takeoverCostActive: GRID_WARS_CONFIG.takeoverCostActive,
    nodeClaimCost: GRID_WARS_CONFIG.nodeClaimCost,
    surgeCost: GRID_WARS_CONFIG.surgeCost,
    maxContiguityBonus: GRID_WARS_CONFIG.maxContiguityBonus,
    healthMax: GRID_WARS_CONFIG.healthMax,
    healthDrainNeutral: GRID_WARS_CONFIG.healthDrainNeutral,
    healthDrainEnemy: GRID_WARS_CONFIG.healthDrainEnemy,
    healthRegenHome: GRID_WARS_CONFIG.healthRegenHome,
    // v1.3: Activity windows
    activeWindowSeconds: GRID_WARS_CONFIG.activeWindowSeconds,
    warmWindowSeconds: GRID_WARS_CONFIG.warmWindowSeconds,
    activeDrillingWindow: GRID_WARS_CONFIG.activeDrillingWindow,
    // Strength & buffs
    maxCellStrength: GRID_WARS_CONFIG.maxCellStrength,
    beaconDuration: GRID_WARS_CONFIG.beaconDuration,
    anchorDuration: GRID_WARS_CONFIG.anchorDuration,
    amplifierCharges: GRID_WARS_CONFIG.amplifierCharges,
    amplifierBonus: GRID_WARS_CONFIG.amplifierBonus,
    surgeDuration: GRID_WARS_CONFIG.surgeDuration,
    nodePositions: GRID_WARS_CONFIG.nodePositions,
    // v1.3: Spam prevention
    spamWindowSeconds: GRID_WARS_CONFIG.spamWindowSeconds,
    spamThreshold: GRID_WARS_CONFIG.spamThreshold,
    spamCooldownSeconds: GRID_WARS_CONFIG.spamCooldownSeconds,
    // v1.3: Visual dimming
    dimmingMinOpacity: GRID_WARS_CONFIG.dimmingMinOpacity,
    dimmingFadeMinutes: GRID_WARS_CONFIG.dimmingFadeMinutes
  });
});

// ============================================
// HTTP SERVER + WEBSOCKET
// ============================================
const server = http.createServer(app);

// v1.2.1: Enable per-message deflate compression for messages >1KB
const wss = new WebSocketServer({
  server,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3  // Balanced compression
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    threshold: 1024  // Only compress messages > 1KB
  }
});

// Track connected clients
const clients = new Map(); // ws -> { username, lastHeartbeat, gameId }

// v1.2: Network optimizations - throttling and delta compression
let lastGridBroadcast = 0;
const GRID_BROADCAST_INTERVAL = 500; // Max 2 broadcasts per second
let pendingGridUpdates = []; // Buffer for delta updates

// v1.2.1: Sequence numbers for gap detection
let broadcastSequence = 0;

function broadcast(message) {
  broadcastSequence++;
  const messageWithSeq = { ...message, seq: broadcastSequence };
  const payload = JSON.stringify(messageWithSeq);
  for (const [ws] of clients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload);
    }
  }
}

/**
 * v1.2: Throttled broadcast for grid updates
 * Batches updates and sends at most every 500ms
 */
function throttledGridBroadcast(message) {
  const now = Date.now();

  // For territory changes, add to pending deltas
  if (message.type === 'territory_claimed' || message.type === 'cell_decayed' ||
      message.type === 'cell_strength_changed') {
    pendingGridUpdates.push(message);
  }

  // Throttle: only broadcast if enough time has passed
  if (now - lastGridBroadcast >= GRID_BROADCAST_INTERVAL) {
    // Send batched delta if we have pending updates
    if (pendingGridUpdates.length > 0) {
      broadcast({
        type: 'grid_delta',
        gameId: message.gameId,
        updates: pendingGridUpdates
      });
      pendingGridUpdates = [];
    }
    // Also send the original message for immediate feedback
    broadcast(message);
    lastGridBroadcast = now;
  }
}

/**
 * v1.2: Send full state snapshot to a specific client (for reconnection)
 */
async function sendStateSnapshot(ws, gameId) {
  try {
    // Get territories
    const { data: territories } = await supabase
      .from('grid_wars_territories')
      .select('x, y, owner, strength, node_type')
      .eq('game_id', gameId);

    // Get players with positions
    const { data: players } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, health, position_x, position_y, avatar_format, active_buffs, last_answer_at')
      .eq('game_id', gameId);

    // Get game state (for surge)
    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('surge_cell_x, surge_cell_y, surge_expires, class_goal_current')
      .eq('game_id', gameId)
      .single();

    const snapshot = {
      type: 'state_snapshot',
      gameId,
      seq: broadcastSequence,  // v1.2.1: Include current seq for client sync
      territories: territories || [],
      players: players || [],
      surge: game?.surge_cell_x !== null ? {
        x: game.surge_cell_x,
        y: game.surge_cell_y,
        expiresIn: game.surge_expires ? Math.max(0, (new Date(game.surge_expires) - new Date()) / 1000) : 0
      } : null,
      classGoal: {
        current: game?.class_goal_current || 0,
        target: GRID_WARS_CONFIG.classGoalTarget
      }
    };

    if (ws.readyState === 1) {
      ws.send(JSON.stringify(snapshot));
    }
  } catch (err) {
    console.error('Error sending state snapshot:', err);
  }
}

function getOnlineUsers() {
  const users = [];
  for (const [, data] of clients) {
    if (data.username) {
      users.push(data.username);
    }
  }
  return [...new Set(users)]; // Dedupe
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  clients.set(ws, { username: null, lastHeartbeat: Date.now(), gameId: null });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'identify':
          const client = clients.get(ws);
          const oldUsername = client?.username;
          const isReconnection = oldUsername && oldUsername === message.username;

          clients.set(ws, {
            username: message.username,
            lastHeartbeat: Date.now(),
            gameId: message.gameId || client?.gameId || null
          });

          // Broadcast user online if new
          if (message.username && message.username !== oldUsername) {
            broadcast({ type: 'user_online', username: message.username });
          }

          // Send presence snapshot
          ws.send(JSON.stringify({
            type: 'presence_snapshot',
            users: getOnlineUsers()
          }));

          // v1.2: Send full state snapshot on reconnection or initial connection
          if (message.gameId) {
            sendStateSnapshot(ws, message.gameId);
          }
          break;

        case 'request_state':
          // v1.2: Client can explicitly request state snapshot (for reconnection)
          const reqClient = clients.get(ws);
          if (message.gameId) {
            reqClient.gameId = message.gameId;
            sendStateSnapshot(ws, message.gameId);
          }
          break;

        case 'resync_request':
          // v1.2.1: Client detected sequence gap, send full state with current seq
          const rsClient = clients.get(ws);
          if (message.gameId) {
            console.log(`Grid Wars: Resync requested by ${rsClient?.username} (seq gap: ${message.lastSeq} → ${message.expectedSeq})`);
            sendStateSnapshot(ws, message.gameId);
          }
          break;

        case 'heartbeat':
          const hbClient = clients.get(ws);
          if (hbClient) {
            hbClient.lastHeartbeat = Date.now();
          }
          break;

        case 'star_earned':
          // Rebroadcast to all clients
          broadcast({
            type: 'star_earned',
            username: message.username,
            star_type: message.star_type,
            scenario_topic: message.scenario_topic
          });
          break;

        case 'class_time_start':
          // Teacher started class time - broadcast to all
          console.log('Class time started by:', clients.get(ws)?.username);
          broadcast({
            type: 'class_time_start',
            goal: message.goal || 3
          });
          break;

        case 'class_time_end':
          // Teacher ended class time - broadcast to all
          console.log('Class time ended. Stars earned:', message.stars);
          broadcast({
            type: 'class_time_end',
            stars: message.stars,
            goalReached: message.goalReached
          });
          break;
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    const client = clients.get(ws);
    if (client?.username) {
      // Check if user is still connected on another socket
      let stillConnected = false;
      for (const [otherWs, otherData] of clients) {
        if (otherWs !== ws && otherData.username === client.username) {
          stillConnected = true;
          break;
        }
      }

      if (!stillConnected) {
        broadcast({ type: 'user_offline', username: client.username });
      }
    }
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// v1.6: Clean up stale connections (no heartbeat in 5 minutes)
const STALE_THRESHOLD_MS = GRID_WARS_CONFIG.presenceStaleThresholdMs || 300000;
const PRUNE_INTERVAL_MS = GRID_WARS_CONFIG.presencePruneIntervalMs || 60000;

setInterval(() => {
  const now = Date.now();
  const pruned = [];
  for (const [ws, data] of clients) {
    if (now - data.lastHeartbeat > STALE_THRESHOLD_MS) {
      pruned.push(data.username);
      ws.terminate();
    }
  }
  if (pruned.length > 0) {
    console.log('Pruned stale connections:', pruned.join(', '));
    // Broadcast player_left for each pruned connection
    pruned.forEach(username => {
      if (username) {
        broadcast({ type: 'player_left', username });
      }
    });
  }
}, PRUNE_INTERVAL_MS);

// ============================================
// v1.5.1: POINT EVENTS CLEANUP (Daily)
// ============================================

/**
 * Clean up old point events to prevent table bloat
 * Keeps only last 7 days of events
 */
async function cleanOldPointEvents() {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error, count } = await supabase
      .from('point_events')
      .delete()
      .lt('created_at', oneWeekAgo);

    if (error) {
      console.error('Failed to clean old point events:', error.message);
    } else {
      console.log(`Cleaned ${count || 0} old point events (older than 7 days)`);
    }
  } catch (err) {
    console.error('Point events cleanup error:', err.message);
  }
}

// Run cleanup daily (every 24 hours)
setInterval(cleanOldPointEvents, 24 * 60 * 60 * 1000);

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log(`LSRL Trainer server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);

  // Start Grid Wars server tick
  startGridWarsTick();

  // v1.3: Start telemetry flush
  startTelemetryFlush();
});

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { WebSocketServer } = require('ws');
const http = require('http');
const { buildCartridgePrompt } = require('./prompt-utils.js');
const { ArenaManager, ARENA_CONFIG, RoundState } = require('./ghost-orbits-manager.js');
const { OrbitsMultiplayerManager, MULTIPLAYER_CONFIG } = require('./ghost-orbits-multiplayer-manager.js');

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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// HTTP SERVER + WEBSOCKET SETUP
// ============================================
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Track connected WebSocket clients
const clients = new Map();

// Broadcast message to all connected clients
function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload);
    }
  }
}

// Broadcast to clients in a specific arena (Ghost Orbits)
function broadcastToArena(cartridgeId, periodId, message) {
  const payload = JSON.stringify(message);
  for (const [ws, data] of clients) {
    if (ws.readyState === 1 && data.orbitsArena === `${cartridgeId}:${periodId}`) {
      ws.send(payload);
    }
  }
}

// Send message to a specific user by username
function sendToUser(targetUsername, message) {
  const payload = JSON.stringify(message);
  for (const [ws, data] of clients) {
    if (ws.readyState === 1 && data.username === targetUsername) {
      ws.send(payload);
      return true;
    }
  }
  return false;
}

// ============================================
// GHOST ORBITS ARENA MANAGER
// ============================================
const ghostOrbitsManager = new ArenaManager((message) => {
  // Broadcast to all clients in the arena
  broadcastToArena(message.cartridgeId, message.periodId, message);
});

console.log('[Ghost Orbits] Arena manager initialized');

// ============================================
// GHOST ORBITS MULTIPLAYER MANAGER (Phase 3)
// ============================================
const orbitsMultiplayerManager = new OrbitsMultiplayerManager();

// Set up global lobby status broadcast
orbitsMultiplayerManager.onLobbyStatusChange = (status) => {
  broadcast({
    type: 'orbits_lobby_status',
    payload: status
  });
};

console.log('[Ghost Orbits] Multiplayer manager initialized');

// ============================================
// VERSION - Update this when deploying new versions
// ============================================
const CURRENT_VERSION = '4.1.0';

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
      .select('username, real_name, class_period')
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
  console.log('[DEBUG] /api/progress/:username/sync hit, username:', req.params.username);
  try {
    const { username } = req.params;
    const { starCounts } = req.body; // { gold: N, silver: N, bronze: N, tin: N }

    console.log('[DEBUG] starCounts:', starCounts);

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
    console.error('[DEBUG] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
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
// PROGRESS RESTORE ENDPOINT
// ============================================

app.get('/api/progress/cartridge/:username/:cartridgeId', async (req, res) => {
  try {
    const { username, cartridgeId } = req.params;

    const { data, error } = await supabase
      .from('user_progress')
      .select('gold_stars, silver_stars, bronze_stars, tin_stars, mode_progress, updated_at')
      .eq('username', username)
      .eq('cartridge_id', cartridgeId)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json({ found: false, data: null });
    }
    if (error) throw error;

    res.json({ found: true, data });
  } catch (err) {
    console.error('GET /api/progress/cartridge error:', err);
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

// Unified leaderboard - merges user_progress + lsrl_progress data
app.get('/api/leaderboard/unified', async (req, res) => {
  try {
    const playerMap = new Map();

    // 1. Get all star earners from lsrl_progress (legacy data)
    const { data: progress, error: progressError } = await supabase
      .from('lsrl_progress')
      .select('username, star_type, weighted_points')
      .not('star_type', 'is', null);

    if (progressError && progressError.code !== '42P01') throw progressError;

    const basePoints = { gold: 4, silver: 3, bronze: 2, tin: 1 };

    for (const p of progress || []) {
      const existing = playerMap.get(p.username) || { points: 0, gold: 0, silver: 0, bronze: 0, tin: 0 };
      existing.points += p.weighted_points ?? basePoints[p.star_type] ?? 0;
      if (p.star_type) existing[p.star_type] = (existing[p.star_type] || 0) + 1;
      playerMap.set(p.username, existing);
    }

    // 2. Get aggregate progress from user_progress table (modular platform users)
    const { data: userProgress, error: userProgressError } = await supabase
      .from('user_progress')
      .select('username, total_weighted_score, gold_stars, silver_stars, bronze_stars, tin_stars');

    if (userProgressError && userProgressError.code !== '42P01') {
      console.warn('user_progress table query error:', userProgressError.message);
    }

    for (const p of userProgress || []) {
      const existing = playerMap.get(p.username) || { points: 0, gold: 0, silver: 0, bronze: 0, tin: 0 };
      existing.points += parseFloat(p.total_weighted_score) || 0;
      existing.gold = (existing.gold || 0) + (p.gold_stars || 0);
      existing.silver = (existing.silver || 0) + (p.silver_stars || 0);
      existing.bronze = (existing.bronze || 0) + (p.bronze_stars || 0);
      existing.tin = (existing.tin || 0) + (p.tin_stars || 0);
      playerMap.set(p.username, existing);
    }

    // 3. Get all real names and class periods
    const usernames = [...playerMap.keys()];
    let usersMap = {};
    if (usernames.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < usernames.length; i += batchSize) {
        const batch = usernames.slice(i, i + batchSize);
        const { data: users } = await supabase
          .from('users')
          .select('username, real_name, class_period')
          .in('username', batch);
        for (const u of users || []) {
          usersMap[u.username] = { real_name: u.real_name, class_period: u.class_period };
        }
      }
    }

    // 4. Build and sort leaderboard
    const leaderboard = [...playerMap.entries()]
      .map(([username, data]) => ({
        username,
        real_name: usersMap[username]?.real_name || null,
        class_period: usersMap[username]?.class_period || null,
        weighted_score: Math.round((data.points || 0) * 10) / 10,
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
 * v4.8.1: Also uppercases scores in field-keyed format
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

  // v4.8.1: Normalize field-keyed format (uppercase scores)
  const normalized = {};
  let didNormalize = false;

  for (const [key, value] of Object.entries(parsed)) {
    if (key.startsWith('_')) {
      // Preserve metadata fields
      normalized[key] = value;
    } else if (value && typeof value === 'object' && 'score' in value && validScores.includes(value.score)) {
      // Field-keyed format with valid score - uppercase it
      const upperScore = value.score.toUpperCase();
      if (upperScore !== value.score) {
        didNormalize = true;
      }
      normalized[key] = {
        ...value,
        score: upperScore
      };
    } else {
      // Pass through other fields
      normalized[key] = value;
    }
  }

  if (didNormalize) {
    console.log(`[AI] Normalized field-keyed scores to uppercase`);
  }

  return normalized;
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
// ROSTER MANAGEMENT ENDPOINTS (Teacher Only)
// ============================================

// GET /api/roster - Get all students with class periods (teacher only)
app.get('/api/roster', async (req, res) => {
  try {
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('username, real_name, class_period, created_at')
      .eq('user_type', 'student')
      .order('class_period', { ascending: true, nullsFirst: false })
      .order('username', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('GET /api/roster error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/roster/:username - Update student's real_name and/or class_period
app.put('/api/roster/:username', async (req, res) => {
  try {
    const password = req.headers['x-teacher-password'];
    const { username } = req.params;
    const { real_name, class_period } = req.body;

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    // Validate class_period if provided
    if (class_period !== undefined && class_period !== null) {
      const validPeriods = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
      if (!validPeriods.includes(class_period)) {
        return res.status(400).json({ error: 'Invalid class period. Must be A-G or null.' });
      }
    }

    // Build update object with only provided fields
    const updates = {};
    if (real_name !== undefined) updates.real_name = real_name || null;
    if (class_period !== undefined) updates.class_period = class_period || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('username', username)
      .eq('user_type', 'student')
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('PUT /api/roster/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/roster/bulk-assign - Bulk assign periods to multiple students
app.post('/api/roster/bulk-assign', async (req, res) => {
  try {
    const password = req.headers['x-teacher-password'];
    const { assignments } = req.body; // Array of { username, class_period, real_name? }

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Assignments must be a non-empty array' });
    }

    // Validate all class periods
    const validPeriods = ['A', 'B', 'C', 'D', 'E', 'F', 'G', null];
    for (const a of assignments) {
      if (!a.username) {
        return res.status(400).json({ error: 'Each assignment must have a username' });
      }
      if (a.class_period !== undefined && !validPeriods.includes(a.class_period)) {
        return res.status(400).json({ error: `Invalid class period for ${a.username}. Must be A-G or null.` });
      }
    }

    // Process each assignment
    const results = [];
    const errors = [];

    for (const a of assignments) {
      const updates = {};
      if (a.class_period !== undefined) updates.class_period = a.class_period || null;
      if (a.real_name !== undefined) updates.real_name = a.real_name || null;

      if (Object.keys(updates).length === 0) continue;

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('username', a.username)
        .eq('user_type', 'student')
        .select()
        .single();

      if (error) {
        errors.push({ username: a.username, error: error.message });
      } else if (data) {
        results.push(data);
      } else {
        errors.push({ username: a.username, error: 'Student not found' });
      }
    }

    res.json({
      success: errors.length === 0,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('POST /api/roster/bulk-assign error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PROGRESSION OVERRIDES ENDPOINTS (Teacher Only)
// ============================================

// GET /api/progression-overrides/:cartridgeId - Get all overrides for a cartridge
app.get('/api/progression-overrides/:cartridgeId', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const gameId = req.query.gameId || 'default';

    const { data, error } = await supabase
      .from('progression_overrides')
      .select('mode_id, gold_required')
      .eq('game_id', gameId)
      .eq('cartridge_id', cartridgeId);

    if (error) throw error;

    // Convert array to object keyed by mode_id
    const overrides = {};
    for (const row of (data || [])) {
      overrides[row.mode_id] = row.gold_required;
    }

    res.json({ overrides });
  } catch (err) {
    console.error('GET /api/progression-overrides/:cartridgeId error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/progression-overrides/:cartridgeId/:modeId - Save an override for a specific level
app.put('/api/progression-overrides/:cartridgeId/:modeId', async (req, res) => {
  try {
    const { cartridgeId, modeId } = req.params;
    const { goldRequired, password, gameId = 'default', username } = req.body;

    // Verify teacher password
    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    // Validate goldRequired
    if (typeof goldRequired !== 'number' || goldRequired < 1 || goldRequired > 10) {
      return res.status(400).json({ error: 'goldRequired must be a number between 1 and 10' });
    }

    // Upsert the override
    const { data, error } = await supabase
      .from('progression_overrides')
      .upsert({
        game_id: gameId,
        cartridge_id: cartridgeId,
        mode_id: modeId,
        gold_required: goldRequired,
        updated_by: username || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'game_id,cartridge_id,mode_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast the change via WebSocket
    broadcast({
      type: 'progression_override_changed',
      cartridgeId,
      modeId,
      goldRequired,
      gameId
    });

    res.json({ success: true, override: data });
  } catch (err) {
    console.error('PUT /api/progression-overrides/:cartridgeId/:modeId error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/progression-overrides/:cartridgeId/:modeId - Remove an override
app.delete('/api/progression-overrides/:cartridgeId/:modeId', async (req, res) => {
  try {
    const { cartridgeId, modeId } = req.params;
    const { password, gameId = 'default' } = req.body;

    // Verify teacher password
    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const { error } = await supabase
      .from('progression_overrides')
      .delete()
      .eq('game_id', gameId)
      .eq('cartridge_id', cartridgeId)
      .eq('mode_id', modeId);

    if (error) throw error;

    // Broadcast the removal via WebSocket
    broadcast({
      type: 'progression_override_removed',
      cartridgeId,
      modeId,
      gameId
    });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/progression-overrides/:cartridgeId/:modeId error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/progression-overrides/:cartridgeId - Remove ALL overrides for a cartridge
app.delete('/api/progression-overrides/:cartridgeId', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { password, gameId = 'default' } = req.body;

    // Verify teacher password
    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    // Delete all overrides for this cartridge
    const { error } = await supabase
      .from('progression_overrides')
      .delete()
      .eq('cartridge_id', cartridgeId)
      .eq('game_id', gameId);

    if (error) throw error;

    // Broadcast to connected clients
    broadcastToCartridge(cartridgeId, {
      type: 'progression_overrides_cleared',
      cartridgeId
    });

    console.log(`[Progression] Cleared all overrides for ${cartridgeId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/progression-overrides/:cartridgeId error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GHOST PROFILE ENDPOINTS (Phase 1)
// ============================================

// POST /api/ghost/:cartridgeId/sync - Upsert ghost profile
app.post('/api/ghost/:cartridgeId/sync', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const {
      username, weights, buffer, total_interactions,
      proficiency_score, color, opacity, version
    } = req.body;

    if (!username || !weights) {
      return res.status(400).json({ error: 'Missing required fields: username and weights' });
    }

    const { data, error } = await supabase
      .from('ghost_profiles')
      .upsert({
        username,
        cartridge_id: cartridgeId,
        weights,
        buffer,
        total_interactions,
        proficiency_score,
        color,
        opacity,
        version
      }, {
        onConflict: 'username,cartridge_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, profile: data });
  } catch (err) {
    console.error('POST /api/ghost/:cartridgeId/sync error:', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /api/ghost/:cartridgeId/leaderboard - Get all ghosts for landscape view
// NOTE: This route MUST come before /:username to avoid matching 'leaderboard' as a username
app.get('/api/ghost/:cartridgeId/leaderboard', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.query;

    let query = supabase
      .from('ghost_profiles')
      .select('username, total_interactions, proficiency_score, color, opacity, updated_at')
      .eq('cartridge_id', cartridgeId)
      .order('proficiency_score', { ascending: false });

    // If class_period is provided, filter by joining with users table
    if (class_period) {
      // Get usernames for this period first
      const { data: periodUsers } = await supabase
        .from('users')
        .select('username')
        .eq('class_period', class_period);

      if (periodUsers && periodUsers.length > 0) {
        const usernames = periodUsers.map(u => u.username);
        query = query.in('username', usernames);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ ghosts: data || [] });
  } catch (err) {
    console.error('GET /api/ghost/:cartridgeId/leaderboard error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

// GET /api/ghost/:cartridgeId/:username - Retrieve ghost profile
// NOTE: This route MUST come after /leaderboard to avoid matching 'leaderboard' as a username
app.get('/api/ghost/:cartridgeId/:username', async (req, res) => {
  try {
    const { cartridgeId, username } = req.params;

    const { data, error } = await supabase
      .from('ghost_profiles')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('username', username)
      .single();

    // PGRST116 = no rows returned (not an error)
    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return res.status(404).json({ error: 'Ghost not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('GET /api/ghost/:cartridgeId/:username error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

// ============================================
// GHOST BATTLE ENDPOINTS (Phase 6)
// ============================================

// Battle configuration
const BATTLE_CONFIG = {
  problemCount: 10,
  distribution: { easy: 3, medium: 4, hard: 3 },
  timeVariance: 0.2,
  difficultyModifier: 0.3,
  quickBonus: 0.7,
  incorrectPenalty: 1.5,
  minimumTime: 5
};

const ELO_CONFIG = {
  initialRating: 1200,
  kFactor: 32,
  kFactorNew: 40,
  newGhostThreshold: 10
};

// Seeded RNG for reproducible battles
class SeededRNG {
  constructor(seed) {
    this.state = seed;
  }
  next() {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  range(min, max) { return min + this.next() * (max - min); }
  randInt(min, max) { return Math.floor(this.range(min, max + 1)); }
  shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  fork() { return new SeededRNG(Math.floor(this.next() * 4294967296)); }
}

// Simple sigmoid for probability outputs
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// Lightweight forward pass for battle simulation (no TensorFlow needed)
function ghostPredict(weights, inputs) {
  // Architecture: 10 -> 16 -> 16 -> 4
  // weights: [kernel1(10x16), bias1(16), kernel2(16x16), bias2(16), kernel3(16x4), bias3(4)]
  let layer = inputs;

  // Layer 1: 10 -> 16, ReLU
  let hidden1 = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 10; j++) {
      hidden1[i] += layer[j] * weights[0][j * 16 + i];
    }
    hidden1[i] = Math.max(0, hidden1[i] + weights[1][i]); // ReLU
  }

  // Layer 2: 16 -> 16, ReLU
  let hidden2 = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      hidden2[i] += hidden1[j] * weights[2][j * 16 + i];
    }
    hidden2[i] = Math.max(0, hidden2[i] + weights[3][i]); // ReLU
  }

  // Layer 3: 16 -> 4, linear
  let output = new Array(4).fill(0);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 16; j++) {
      output[i] += hidden2[j] * weights[4][j * 4 + i];
    }
    output[i] += weights[5][i];
  }

  return {
    time: Math.max(0, output[0]) * 60,
    correctProb: sigmoid(output[1]),
    hintProb: sigmoid(output[2]),
    quickProb: sigmoid(output[3])
  };
}

// Generate battle problem sequence
function generateBattleSequence(rng) {
  const difficulties = [];
  for (let i = 0; i < BATTLE_CONFIG.distribution.easy; i++)
    difficulties.push(rng.range(0.0, 0.33));
  for (let i = 0; i < BATTLE_CONFIG.distribution.medium; i++)
    difficulties.push(rng.range(0.33, 0.66));
  for (let i = 0; i < BATTLE_CONFIG.distribution.hard; i++)
    difficulties.push(rng.range(0.66, 1.0));

  return rng.shuffle(difficulties).map((difficulty, index) => ({
    index,
    difficulty,
    inputs: [
      difficulty, rng.range(0.0, 0.5), rng.range(0.0, 0.4), rng.range(0.7, 1.0),
      1.0, rng.range(0.0, 0.3), 0.0, rng.range(0.7, 1.0), 0.5, difficulty
    ]
  }));
}

// Resolve single problem
function resolveProblem(prediction, difficulty, rng) {
  const isCorrect = rng.next() < prediction.correctProb;
  let actualTime = prediction.time * (1 + (rng.next() * 2 - 1) * BATTLE_CONFIG.timeVariance);
  actualTime *= (1 + difficulty * BATTLE_CONFIG.difficultyModifier);
  if (rng.next() < prediction.quickProb) actualTime *= BATTLE_CONFIG.quickBonus;
  if (!isCorrect) actualTime *= BATTLE_CONFIG.incorrectPenalty;
  return { time: Math.max(BATTLE_CONFIG.minimumTime, actualTime), correct: isCorrect };
}

// Run ghost through battle
function runGhostThrough(weights, problems, rng) {
  const timeline = [];
  let totalTime = 0, correctCount = 0;

  for (const problem of problems) {
    const prediction = ghostPredict(weights, problem.inputs);
    const result = resolveProblem(prediction, problem.difficulty, rng);
    timeline.push({ index: problem.index, prediction, result });
    totalTime += result.time;
    if (result.correct) correctCount++;
  }

  return { totalTime, correctCount, timeline };
}

// Simulate full battle
function simulateBattle(weights1, weights2, seed) {
  const rng = new SeededRNG(seed);
  const problems = generateBattleSequence(rng);
  const results1 = runGhostThrough(weights1, problems, rng.fork());
  const results2 = runGhostThrough(weights2, problems, rng.fork());

  let winner;
  if (results1.correctCount !== results2.correctCount) {
    winner = results1.correctCount > results2.correctCount ? 1 : 2;
  } else if (Math.abs(results1.totalTime - results2.totalTime) > 1) {
    winner = results1.totalTime < results2.totalTime ? 1 : 2;
  } else {
    winner = 0;
  }

  return {
    seed, problems,
    challenger: { totalTime: results1.totalTime, correctCount: results1.correctCount, timeline: results1.timeline },
    defender: { totalTime: results2.totalTime, correctCount: results2.correctCount, timeline: results2.timeline },
    winner,
    margin: Math.abs(results1.totalTime - results2.totalTime)
  };
}

// Elo calculations
function calculateExpected(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function updateRatings(ratingA, ratingB, winner, battlesA = 10, battlesB = 10) {
  const kA = battlesA < ELO_CONFIG.newGhostThreshold ? ELO_CONFIG.kFactorNew : ELO_CONFIG.kFactor;
  const kB = battlesB < ELO_CONFIG.newGhostThreshold ? ELO_CONFIG.kFactorNew : ELO_CONFIG.kFactor;
  const expectedA = calculateExpected(ratingA, ratingB);

  let scoreA, scoreB;
  if (winner === 1) { scoreA = 1; scoreB = 0; }
  else if (winner === 2) { scoreA = 0; scoreB = 1; }
  else { scoreA = 0.5; scoreB = 0.5; }

  return {
    newRatingA: ratingA + Math.round(kA * (scoreA - expectedA)),
    newRatingB: ratingB + Math.round(kB * (scoreB - (1 - expectedA)))
  };
}

// POST /api/ghost/:cartridgeId/battle/challenge - Start a battle
app.post('/api/ghost/:cartridgeId/battle/challenge', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { username, opponentUsername, challengeType = 'random' } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    // Get challenger's ghost profile
    const { data: challenger, error: challengerErr } = await supabase
      .from('ghost_profiles')
      .select('username, weights')
      .eq('cartridge_id', cartridgeId)
      .eq('username', username)
      .single();

    if (challengerErr || !challenger) {
      return res.status(404).json({ error: 'Challenger ghost not found' });
    }

    // Find opponent
    let defender;
    if (opponentUsername) {
      const { data: defenderData, error: defenderErr } = await supabase
        .from('ghost_profiles')
        .select('username, weights')
        .eq('cartridge_id', cartridgeId)
        .eq('username', opponentUsername)
        .single();

      if (defenderErr || !defenderData) {
        return res.status(404).json({ error: 'Opponent ghost not found' });
      }
      defender = defenderData;
    } else {
      // Random matchmaking
      const { data: candidates } = await supabase
        .from('ghost_profiles')
        .select('username, weights')
        .eq('cartridge_id', cartridgeId)
        .neq('username', username)
        .limit(20);

      if (!candidates || candidates.length === 0) {
        return res.status(404).json({ error: 'No opponents available' });
      }
      defender = candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Get or create ratings
    const { data: challengerRating } = await supabase
      .from('ghost_ratings')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('username', username)
      .single();

    const { data: defenderRating } = await supabase
      .from('ghost_ratings')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('username', defender.username)
      .single();

    const ratingA = challengerRating?.rating || ELO_CONFIG.initialRating;
    const ratingB = defenderRating?.rating || ELO_CONFIG.initialRating;
    const battlesA = challengerRating?.battles_fought || 0;
    const battlesB = defenderRating?.battles_fought || 0;

    // Run battle simulation
    const seed = Date.now();
    const battleResult = simulateBattle(challenger.weights, defender.weights, seed);

    // Calculate new ratings
    const { newRatingA, newRatingB } = updateRatings(ratingA, ratingB, battleResult.winner, battlesA, battlesB);

    // Store battle record
    const battleLog = {
      seed: battleResult.seed,
      problems: battleResult.problems.map((p, i) => ({
        difficulty: p.difficulty,
        challenger: battleResult.challenger.timeline[i],
        defender: battleResult.defender.timeline[i]
      }))
    };

    const { data: battle, error: battleErr } = await supabase
      .from('ghost_battles')
      .insert({
        cartridge_id: cartridgeId,
        challenger_username: username,
        defender_username: defender.username,
        challenge_type: challengeType,
        seed,
        winner: battleResult.winner === 1 ? username : battleResult.winner === 2 ? defender.username : null,
        winner_side: battleResult.winner,
        challenger_time: battleResult.challenger.totalTime,
        challenger_correct: battleResult.challenger.correctCount,
        defender_time: battleResult.defender.totalTime,
        defender_correct: battleResult.defender.correctCount,
        margin: battleResult.margin,
        challenger_rating_before: ratingA,
        defender_rating_before: ratingB,
        challenger_rating_after: newRatingA,
        defender_rating_after: newRatingB,
        battle_log: battleLog
      })
      .select()
      .single();

    if (battleErr) throw battleErr;

    // Update challenger rating
    await supabase
      .from('ghost_ratings')
      .upsert({
        username,
        cartridge_id: cartridgeId,
        rating: newRatingA,
        battles_fought: battlesA + 1,
        wins: (challengerRating?.wins || 0) + (battleResult.winner === 1 ? 1 : 0),
        losses: (challengerRating?.losses || 0) + (battleResult.winner === 2 ? 1 : 0),
        draws: (challengerRating?.draws || 0) + (battleResult.winner === 0 ? 1 : 0),
        current_streak: battleResult.winner === 1 ? Math.max(1, (challengerRating?.current_streak || 0) + 1) :
                        battleResult.winner === 2 ? Math.min(-1, (challengerRating?.current_streak || 0) - 1) : 0,
        best_streak: Math.max(challengerRating?.best_streak || 0,
                              battleResult.winner === 1 ? (challengerRating?.current_streak || 0) + 1 : 0),
        last_battle_at: new Date().toISOString()
      }, { onConflict: 'username,cartridge_id' });

    // Update defender rating
    await supabase
      .from('ghost_ratings')
      .upsert({
        username: defender.username,
        cartridge_id: cartridgeId,
        rating: newRatingB,
        battles_fought: battlesB + 1,
        wins: (defenderRating?.wins || 0) + (battleResult.winner === 2 ? 1 : 0),
        losses: (defenderRating?.losses || 0) + (battleResult.winner === 1 ? 1 : 0),
        draws: (defenderRating?.draws || 0) + (battleResult.winner === 0 ? 1 : 0),
        current_streak: battleResult.winner === 2 ? Math.max(1, (defenderRating?.current_streak || 0) + 1) :
                        battleResult.winner === 1 ? Math.min(-1, (defenderRating?.current_streak || 0) - 1) : 0,
        best_streak: Math.max(defenderRating?.best_streak || 0,
                              battleResult.winner === 2 ? (defenderRating?.current_streak || 0) + 1 : 0),
        last_battle_at: new Date().toISOString()
      }, { onConflict: 'username,cartridge_id' });

    // Broadcast battle result
    broadcast({
      type: 'ghost_battle_complete',
      battleId: battle.id,
      cartridgeId,
      challenger: username,
      defender: defender.username,
      winner: battle.winner,
      winnerSide: battleResult.winner,
      challengerStats: {
        time: battleResult.challenger.totalTime,
        correct: battleResult.challenger.correctCount,
        ratingChange: newRatingA - ratingA
      },
      defenderStats: {
        time: battleResult.defender.totalTime,
        correct: battleResult.defender.correctCount,
        ratingChange: newRatingB - ratingB
      }
    });

    res.json({
      battleId: battle.id,
      status: 'complete',
      result: {
        winner: battle.winner,
        winnerSide: battleResult.winner,
        challenger: {
          username,
          time: battleResult.challenger.totalTime,
          correct: battleResult.challenger.correctCount,
          ratingBefore: ratingA,
          ratingAfter: newRatingA
        },
        defender: {
          username: defender.username,
          time: battleResult.defender.totalTime,
          correct: battleResult.defender.correctCount,
          ratingBefore: ratingB,
          ratingAfter: newRatingB
        },
        margin: battleResult.margin
      }
    });
  } catch (err) {
    console.error('POST /api/ghost/:cartridgeId/battle/challenge error:', err);
    res.status(500).json({ error: 'Battle failed' });
  }
});

// GET /api/ghost/:cartridgeId/battle/history/:username - Get user's battle history
app.get('/api/ghost/:cartridgeId/battle/history/:username', async (req, res) => {
  try {
    const { cartridgeId, username } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data: battles, error, count } = await supabase
      .from('ghost_battles')
      .select('id, challenger_username, defender_username, winner, winner_side, challenger_time, challenger_correct, defender_time, defender_correct, margin, challenger_rating_before, defender_rating_before, challenger_rating_after, defender_rating_after, created_at', { count: 'exact' })
      .eq('cartridge_id', cartridgeId)
      .or(`challenger_username.eq.${username},defender_username.eq.${username}`)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) throw error;

    res.json({ battles: battles || [], total: count || 0 });
  } catch (err) {
    console.error('GET /api/ghost/:cartridgeId/battle/history/:username error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

// GET /api/ghost/:cartridgeId/battle/rating/:username - Get user's rating
app.get('/api/ghost/:cartridgeId/battle/rating/:username', async (req, res) => {
  try {
    const { cartridgeId, username } = req.params;

    const { data: rating, error } = await supabase
      .from('ghost_ratings')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const ratingData = rating || {
      username,
      cartridge_id: cartridgeId,
      rating: ELO_CONFIG.initialRating,
      battles_fought: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      current_streak: 0,
      best_streak: 0
    };

    // Calculate tier
    let tier;
    if (ratingData.rating < 1000) tier = { name: 'Bronze', icon: 'bronze' };
    else if (ratingData.rating < 1200) tier = { name: 'Silver', icon: 'silver' };
    else if (ratingData.rating < 1400) tier = { name: 'Gold', icon: 'gold' };
    else if (ratingData.rating < 1600) tier = { name: 'Platinum', icon: 'platinum' };
    else tier = { name: 'Diamond', icon: 'diamond' };

    res.json({ ...ratingData, tier });
  } catch (err) {
    console.error('GET /api/ghost/:cartridgeId/battle/rating/:username error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

// GET /api/ghost/:cartridgeId/battle/leaderboard - Get battle ratings leaderboard
app.get('/api/ghost/:cartridgeId/battle/leaderboard', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, limit = 50 } = req.query;

    let query = supabase
      .from('ghost_ratings')
      .select('username, rating, battles_fought, wins, losses, draws, current_streak, best_streak')
      .eq('cartridge_id', cartridgeId)
      .order('rating', { ascending: false })
      .limit(parseInt(limit));

    // Filter by class period if provided
    if (class_period) {
      const { data: periodUsers } = await supabase
        .from('class_roster')
        .select('username')
        .eq('class_period', class_period);

      if (periodUsers && periodUsers.length > 0) {
        query = query.in('username', periodUsers.map(u => u.username));
      }
    }

    const { data: rankings, error } = await query;

    if (error) throw error;

    // Add tier to each ranking
    const rankingsWithTier = (rankings || []).map(r => {
      let tier;
      if (r.rating < 1000) tier = { name: 'Bronze', icon: 'bronze' };
      else if (r.rating < 1200) tier = { name: 'Silver', icon: 'silver' };
      else if (r.rating < 1400) tier = { name: 'Gold', icon: 'gold' };
      else if (r.rating < 1600) tier = { name: 'Platinum', icon: 'platinum' };
      else tier = { name: 'Diamond', icon: 'diamond' };
      return { ...r, tier };
    });

    res.json({ rankings: rankingsWithTier });
  } catch (err) {
    console.error('GET /api/ghost/:cartridgeId/battle/leaderboard error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

// GET /api/ghost/:cartridgeId/battle/:battleId - Get battle details
// NOTE: This route MUST come after /leaderboard, /history, /rating to avoid matching those as battleId
app.get('/api/ghost/:cartridgeId/battle/:battleId', async (req, res) => {
  try {
    const { cartridgeId, battleId } = req.params;

    const { data: battle, error } = await supabase
      .from('ghost_battles')
      .select('*')
      .eq('id', battleId)
      .eq('cartridge_id', cartridgeId)
      .single();

    if (error || !battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json(battle);
  } catch (err) {
    console.error('GET /api/ghost/:cartridgeId/battle/:battleId error:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

// ============================================
// P2P ASSET COORDINATION (Phase 2)
// ============================================
// In-memory state — no database. Tracks who is fetching and who has each asset.
const assetLeases = new Map();   // Map<fileKey, { assignee, leaseExpiry, waitQueue: [{ws, username}] }>
const assetHolders = new Map();  // Map<fileKey, Set<username>>
const LEASE_TIMEOUT_MS = 15000;  // 15 seconds

function handleAssetNeed(ws, message) {
  const client = clients.get(ws);
  if (!client?.username) return;
  const { fileKey } = message;
  if (!fileKey) return;

  // Check if peers already have it
  const holders = assetHolders.get(fileKey);
  if (holders && holders.size > 0) {
    const peers = [...holders].filter(u => u !== client.username);
    if (peers.length > 0) {
      // Find the hash from the first holder for verification
      ws.send(JSON.stringify({
        type: 'asset_available',
        fileKey,
        peers
      }));
      return;
    }
  }

  // Check if someone is already fetching
  const lease = assetLeases.get(fileKey);
  if (lease && lease.leaseExpiry > Date.now()) {
    // Already being fetched — queue this client
    lease.waitQueue.push({ ws, username: client.username });
    ws.send(JSON.stringify({
      type: 'asset_queued',
      fileKey,
      position: lease.waitQueue.length
    }));
    return;
  }

  // Nobody fetching — assign this client
  assetLeases.set(fileKey, {
    assignee: client.username,
    leaseExpiry: Date.now() + LEASE_TIMEOUT_MS,
    waitQueue: []
  });
  ws.send(JSON.stringify({
    type: 'asset_fetch_assigned',
    fileKey
  }));
}

function handleAssetHave(ws, message) {
  const client = clients.get(ws);
  if (!client?.username) return;
  const { fileKey, hash } = message;
  if (!fileKey) return;

  // Register as holder
  if (!assetHolders.has(fileKey)) {
    assetHolders.set(fileKey, new Set());
  }
  assetHolders.get(fileKey).add(client.username);

  // Notify anyone waiting
  const lease = assetLeases.get(fileKey);
  if (lease) {
    const peers = [...(assetHolders.get(fileKey) || [])];
    for (const waiter of lease.waitQueue) {
      try {
        if (waiter.ws.readyState === 1) {
          waiter.ws.send(JSON.stringify({
            type: 'asset_available',
            fileKey,
            peers,
            hash
          }));
        }
      } catch { /* ignore dead sockets */ }
    }
    assetLeases.delete(fileKey);
  }
}

function handleAssetQuery(ws, message) {
  const { fileKey } = message;
  if (!fileKey) return;
  const holders = assetHolders.get(fileKey);
  const peers = holders ? [...holders] : [];
  ws.send(JSON.stringify({
    type: 'asset_holders',
    fileKey,
    peers
  }));
}

function cleanupAssetLeases() {
  const now = Date.now();
  for (const [fileKey, lease] of assetLeases) {
    if (lease.leaseExpiry <= now) {
      // Lease expired — reassign to next waiter if any
      const nextWaiter = lease.waitQueue.shift();
      if (nextWaiter && nextWaiter.ws.readyState === 1) {
        assetLeases.set(fileKey, {
          assignee: nextWaiter.username,
          leaseExpiry: now + LEASE_TIMEOUT_MS,
          waitQueue: lease.waitQueue
        });
        nextWaiter.ws.send(JSON.stringify({
          type: 'asset_fetch_assigned',
          fileKey
        }));
      } else {
        assetLeases.delete(fileKey);
      }
    }
  }
}

function cleanupAssetHoldersForUser(username) {
  for (const [fileKey, holders] of assetHolders) {
    holders.delete(username);
    if (holders.size === 0) {
      assetHolders.delete(fileKey);
    }
  }
  // Reassign any leases held by this user
  for (const [fileKey, lease] of assetLeases) {
    if (lease.assignee === username) {
      const nextWaiter = lease.waitQueue.shift();
      if (nextWaiter && nextWaiter.ws.readyState === 1) {
        assetLeases.set(fileKey, {
          assignee: nextWaiter.username,
          leaseExpiry: Date.now() + LEASE_TIMEOUT_MS,
          waitQueue: lease.waitQueue
        });
        nextWaiter.ws.send(JSON.stringify({
          type: 'asset_fetch_assigned',
          fileKey
        }));
      } else {
        assetLeases.delete(fileKey);
      }
    }
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
  clients.set(ws, { username: null, lastHeartbeat: Date.now(), gameId: null, orbitsArena: null });

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
            gameId: message.gameId || client?.gameId || null,
            orbitsArena: client?.orbitsArena || null  // Preserve Ghost Orbits arena
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

        // ============================================
        // WEBRTC SIGNALING MESSAGES
        // ============================================

        case 'webrtc_activate': {
          // Teacher activates WebRTC mode - broadcast to all connected clients
          const activateClient = clients.get(ws);
          console.log(`[WebRTC] Activated by ${activateClient?.username}`);
          broadcast({
            type: 'webrtc_activate',
            teacherUsername: activateClient?.username
          });
          break;
        }

        case 'webrtc_deactivate': {
          // Teacher deactivates WebRTC mode - broadcast to all
          const deactivateClient = clients.get(ws);
          console.log(`[WebRTC] Deactivated by ${deactivateClient?.username}`);
          broadcast({
            type: 'webrtc_deactivate',
            teacherUsername: deactivateClient?.username
          });
          break;
        }

        case 'webrtc_signal': {
          // Relay signaling message (offer/answer/ice_candidate) to target user
          const signalClient = clients.get(ws);
          const { subtype, targetUsername, payload: signalPayload } = message;

          if (!targetUsername || !subtype) {
            console.warn('[WebRTC] Invalid signal message, missing targetUsername or subtype');
            break;
          }

          sendToUser(targetUsername, {
            type: 'webrtc_signal',
            subtype,
            fromUsername: signalClient?.username,
            targetUsername,
            payload: signalPayload
          });
          break;
        }

        // ============================================
        // P2P ASSET COORDINATION MESSAGES
        // ============================================

        case 'asset_need':
          handleAssetNeed(ws, message);
          break;

        case 'asset_have':
          handleAssetHave(ws, message);
          break;

        case 'asset_query':
          handleAssetQuery(ws, message);
          break;

        case 'p2p_asset_signal': {
          // Relay P2P asset transfer signaling (same pattern as webrtc_signal)
          const p2pClient = clients.get(ws);
          const { targetUsername: p2pTarget, subtype: p2pSubtype, payload: p2pPayload } = message;

          if (!p2pTarget || !p2pSubtype) break;

          sendToUser(p2pTarget, {
            type: 'p2p_asset_signal',
            subtype: p2pSubtype,
            fromUsername: p2pClient?.username,
            targetUsername: p2pTarget,
            payload: p2pPayload
          });
          break;
        }

        // ============================================
        // GHOST ORBITS ARENA MESSAGES
        // ============================================

        case 'join_arena': {
          // Client joins Ghost Orbits arena
          const joinClient = clients.get(ws);
          const { cartridgeId, periodId, ghostProfile } = message;

          if (!joinClient?.username || !cartridgeId || !periodId) {
            ws.send(JSON.stringify({
              type: 'error',
              code: 'INVALID_JOIN',
              message: 'Missing username, cartridgeId, or periodId'
            }));
            break;
          }

          console.log(`[Ghost Orbits] ${joinClient.username} joining ${cartridgeId}:${periodId}`);

          // Track which arena this client is in
          joinClient.orbitsArena = `${cartridgeId}:${periodId}`;

          // Add player to arena
          const joinResult = ghostOrbitsManager.handleJoinArena(
            joinClient.username,
            cartridgeId,
            periodId,
            ghostProfile
          );

          // Send current arena state to joining client
          const arenaState = ghostOrbitsManager.getArenaState(cartridgeId, periodId);
          if (arenaState) {
            ws.send(JSON.stringify({
              type: 'arena_state',
              ...arenaState
            }));
          }
          break;
        }

        case 'leave_arena': {
          // Client leaves Ghost Orbits arena
          const leaveClient = clients.get(ws);
          const { cartridgeId: leaveCartridgeId, periodId: leavePeriodId } = message;

          if (!leaveClient?.username) break;

          console.log(`[Ghost Orbits] ${leaveClient.username} leaving arena`);

          ghostOrbitsManager.handleLeaveArena(
            leaveClient.username,
            leaveCartridgeId || leaveClient.orbitsArena?.split(':')[0],
            leavePeriodId || leaveClient.orbitsArena?.split(':')[1]
          );

          // Clear arena tracking
          delete leaveClient.orbitsArena;
          break;
        }

        case 'input': {
          // Client sends game input (thrust direction)
          const inputClient = clients.get(ws);

          if (!inputClient?.username || !inputClient.orbitsArena) break;

          const [inputCartridgeId, inputPeriodId] = inputClient.orbitsArena.split(':');
          const { direction, thrust } = message;

          ghostOrbitsManager.handleInput(
            inputClient.username,
            inputCartridgeId,
            inputPeriodId,
            direction || { x: 0, y: 0 },
            thrust || false
          );
          break;
        }

        case 'earned_star': {
          // Client earned a star (for Ghost Orbits rejoin)
          const starClient = clients.get(ws);
          const { cartridgeId: starCartridgeId, periodId: starPeriodId } = message;

          if (!starClient?.username) break;

          // If client is in an arena, notify for potential rejoin
          const arenaId = starCartridgeId && starPeriodId
            ? `${starCartridgeId}:${starPeriodId}`
            : starClient.orbitsArena;

          if (arenaId) {
            const [cId, pId] = arenaId.split(':');
            ghostOrbitsManager.handleEarnedStar(starClient.username, cId, pId);
          }
          break;
        }

        // ============================================
        // GHOST ORBITS MULTIPLAYER MESSAGES (Phase 3)
        // ============================================

        case 'orbits_create_room': {
          // Create a new multiplayer room
          const createClient = clients.get(ws);
          if (!createClient?.username) {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: 'Must identify before creating room' }
            }));
            break;
          }

          const { mode } = message.payload || {};
          const result = orbitsMultiplayerManager.createRoom(createClient.username, mode || 'arena');

          if (result.success) {
            // Track this client's multiplayer room
            createClient.orbitsPlayerId = result.playerId;
            createClient.orbitsRoomCode = result.roomCode;
            orbitsMultiplayerManager.setPlayerWs(result.playerId, ws);

            ws.send(JSON.stringify({
              type: 'orbits_room_created',
              payload: {
                roomCode: result.roomCode,
                playerId: result.playerId
              }
            }));

            // Send initial room state so host sees the player list
            const room = orbitsMultiplayerManager.getRoom(result.roomCode);
            if (room) {
              room._broadcastRoomState();
            }

            console.log(`[Orbits MP] ${createClient.username} created room ${result.roomCode}`);
          } else {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: result.error }
            }));
          }
          break;
        }

        case 'orbits_quick_join': {
          // Quick join - find or create a public room
          const quickJoinClient = clients.get(ws);
          if (!quickJoinClient?.username) {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: 'Must identify before joining' }
            }));
            break;
          }

          const { mode: quickJoinMode } = message.payload || {};
          const quickJoinResult = orbitsMultiplayerManager.quickJoin(
            quickJoinClient.username,
            quickJoinMode || 'arena'
          );

          if (quickJoinResult.success) {
            // Track this client's multiplayer room
            quickJoinClient.orbitsPlayerId = quickJoinResult.playerId;
            quickJoinClient.orbitsRoomCode = quickJoinResult.roomCode;
            orbitsMultiplayerManager.setPlayerWs(quickJoinResult.playerId, ws);

            ws.send(JSON.stringify({
              type: 'orbits_quick_joined',
              payload: {
                roomCode: quickJoinResult.roomCode,
                playerId: quickJoinResult.playerId
              }
            }));

            console.log(`[Orbits MP] ${quickJoinClient.username} quick-joined room ${quickJoinResult.roomCode}`);
          } else {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: quickJoinResult.error }
            }));
          }
          break;
        }

        case 'orbits_join_room': {
          // Join an existing multiplayer room
          const joinMpClient = clients.get(ws);
          if (!joinMpClient?.username) {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: 'Must identify before joining room' }
            }));
            break;
          }

          const { roomCode } = message.payload || {};
          if (!roomCode) {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: 'Room code required' }
            }));
            break;
          }

          const joinResult = orbitsMultiplayerManager.joinRoom(roomCode, joinMpClient.username);

          if (joinResult.success) {
            // Track this client's multiplayer room
            joinMpClient.orbitsPlayerId = joinResult.playerId;
            joinMpClient.orbitsRoomCode = joinResult.roomCode;
            orbitsMultiplayerManager.setPlayerWs(joinResult.playerId, ws);

            ws.send(JSON.stringify({
              type: 'orbits_room_joined',
              payload: {
                roomCode: joinResult.roomCode,
                playerId: joinResult.playerId
              }
            }));
            console.log(`[Orbits MP] ${joinMpClient.username} joined room ${roomCode}`);
          } else {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: joinResult.error }
            }));
          }
          break;
        }

        case 'orbits_rejoin_room': {
          // Rejoin room after disconnect (resume existing session)
          const rejoinClient = clients.get(ws);
          if (!rejoinClient?.username) {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: 'Must identify before rejoining room' }
            }));
            break;
          }

          const { roomCode: rejoinRoomCode, playerId: rejoinPlayerId } = message.payload || {};
          if (!rejoinRoomCode || !rejoinPlayerId) {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: 'Room code and player ID required for rejoin' }
            }));
            break;
          }

          const rejoinResult = orbitsMultiplayerManager.rejoinRoom(
            rejoinRoomCode,
            rejoinPlayerId,
            rejoinClient.username,
            ws
          );

          if (rejoinResult.success) {
            rejoinClient.orbitsPlayerId = rejoinResult.playerId;
            rejoinClient.orbitsRoomCode = rejoinResult.roomCode;

            ws.send(JSON.stringify({
              type: 'orbits_room_rejoined',
              payload: {
                roomCode: rejoinResult.roomCode,
                playerId: rejoinResult.playerId,
                isHost: rejoinResult.isHost
              }
            }));
            console.log(`[Orbits MP] ${rejoinClient.username} rejoined room ${rejoinRoomCode}`);
          } else {
            ws.send(JSON.stringify({
              type: 'orbits_error',
              payload: { error: rejoinResult.error }
            }));
          }
          break;
        }

        case 'orbits_ready':
        case 'orbits_start':
        case 'orbits_input':
        case 'orbits_vote_rematch': {
          // Forward to multiplayer manager
          const mpClient = clients.get(ws);
          if (mpClient?.orbitsPlayerId) {
            orbitsMultiplayerManager.handleMessage(mpClient.orbitsPlayerId, ws, message);
          }
          break;
        }

        case 'orbits_add_ai': {
          // Add AI player to room (host only)
          const aiClient = clients.get(ws);
          if (aiClient?.orbitsPlayerId && aiClient?.orbitsRoomCode) {
            const room = orbitsMultiplayerManager.getRoom(aiClient.orbitsRoomCode);
            if (room && aiClient.orbitsPlayerId === room.hostId) {
              const result = room.addAIPlayer();
              if (!result.success) {
                ws.send(JSON.stringify({
                  type: 'orbits_error',
                  payload: { error: result.error }
                }));
              }
            }
          }
          break;
        }

        case 'orbits_start_now': {
          // Vote to start the game immediately
          const startNowClient = clients.get(ws);
          if (startNowClient?.orbitsPlayerId && startNowClient?.orbitsRoomCode) {
            const room = orbitsMultiplayerManager.getRoom(startNowClient.orbitsRoomCode);
            if (room) {
              room.voteStartNow(startNowClient.orbitsPlayerId);
            }
          }
          break;
        }

        case 'orbits_leave': {
          // Leave multiplayer room
          const leaveMpClient = clients.get(ws);
          if (leaveMpClient?.orbitsPlayerId) {
            orbitsMultiplayerManager.leaveRoom(leaveMpClient.orbitsPlayerId);
            delete leaveMpClient.orbitsPlayerId;
            delete leaveMpClient.orbitsRoomCode;
            console.log(`[Orbits MP] ${leaveMpClient.username} left room`);
          }
          break;
        }
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

        // If disconnecting user was a WebRTC teacher, broadcast deactivation
        // (Students will clean up their connections)
        broadcast({
          type: 'webrtc_deactivate',
          teacherUsername: client.username
        });

        // Clean up asset coordination state
        cleanupAssetHoldersForUser(client.username);

        // Handle Ghost Orbits arena leave
        if (client.orbitsArena) {
          const [cartridgeId, periodId] = client.orbitsArena.split(':');
          ghostOrbitsManager.handleLeaveArena(client.username, cartridgeId, periodId);
        }

        // Handle Ghost Orbits multiplayer room leave
        if (client.orbitsPlayerId) {
          orbitsMultiplayerManager.leaveRoom(client.orbitsPlayerId);
        }
      }
    }
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Clean up stale connections (no heartbeat in 5 minutes)
const STALE_THRESHOLD_MS = 300000; // 5 minutes
const PRUNE_INTERVAL_MS = 60000;   // 1 minute

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

  // Clean up expired asset leases
  cleanupAssetLeases();
}, PRUNE_INTERVAL_MS);

// ============================================
// GHOST ORBITS REST ENDPOINTS
// ============================================

// GET /api/ghost-orbits/config - Get arena configuration
app.get('/api/ghost-orbits/config', (req, res) => {
  res.json({
    ...ARENA_CONFIG,
    roundStates: RoundState
  });
});

// GET /api/ghost-orbits/arenas - Get list of active arenas
app.get('/api/ghost-orbits/arenas', (req, res) => {
  const arenas = ghostOrbitsManager.getActiveArenas();
  res.json({ arenas });
});

// GET /api/ghost-orbits/:cartridgeId/:periodId/state - Get arena state
app.get('/api/ghost-orbits/:cartridgeId/:periodId/state', (req, res) => {
  const { cartridgeId, periodId } = req.params;
  const state = ghostOrbitsManager.getArenaState(cartridgeId, periodId);

  if (!state) {
    return res.status(404).json({ error: 'Arena not found' });
  }

  res.json(state);
});

// POST /api/ghost-orbits/:cartridgeId/:periodId/join - Join arena via REST
app.post('/api/ghost-orbits/:cartridgeId/:periodId/join', async (req, res) => {
  try {
    const { cartridgeId, periodId } = req.params;
    const { username, ghostProfile } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const result = ghostOrbitsManager.handleJoinArena(
      username,
      cartridgeId,
      periodId,
      ghostProfile
    );

    const state = ghostOrbitsManager.getArenaState(cartridgeId, periodId);

    res.json({
      success: true,
      ...result,
      state
    });
  } catch (err) {
    console.error('POST /api/ghost-orbits/:cartridgeId/:periodId/join error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ghost-orbits/:cartridgeId/:periodId/leave - Leave arena via REST
app.post('/api/ghost-orbits/:cartridgeId/:periodId/leave', (req, res) => {
  const { cartridgeId, periodId } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  ghostOrbitsManager.handleLeaveArena(username, cartridgeId, periodId);

  res.json({ success: true });
});

// POST /api/ghost-orbits/:cartridgeId/:periodId/earned-star - Notify star earned for rejoin
app.post('/api/ghost-orbits/:cartridgeId/:periodId/earned-star', (req, res) => {
  const { cartridgeId, periodId } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }

  ghostOrbitsManager.handleEarnedStar(username, cartridgeId, periodId);

  res.json({ success: true });
});

// DELETE /api/ghost-orbits/:cartridgeId/:periodId - Destroy arena (teacher only)
app.delete('/api/ghost-orbits/:cartridgeId/:periodId', (req, res) => {
  const password = req.headers['x-teacher-password'];

  if (password !== TEACHER_PASSWORD) {
    return res.status(401).json({ error: 'Teacher authentication required' });
  }

  const { cartridgeId, periodId } = req.params;

  ghostOrbitsManager.destroyArena(cartridgeId, periodId);

  res.json({ success: true });
});

console.log('[Ghost Orbits] REST endpoints registered');

// ============================================
// GHOST ORBITS MULTIPLAYER REST ENDPOINTS
// ============================================

// GET /api/ghost-orbits/multiplayer/rooms - Get active multiplayer rooms
app.get('/api/ghost-orbits/multiplayer/rooms', (req, res) => {
  const rooms = orbitsMultiplayerManager.getActiveRooms();
  res.json({ rooms });
});

// GET /api/ghost-orbits/multiplayer/config - Get multiplayer configuration
app.get('/api/ghost-orbits/multiplayer/config', (req, res) => {
  res.json(MULTIPLAYER_CONFIG);
});

// POST /api/ghost-orbits/multiplayer/create - Create room via REST (for non-WebSocket clients)
app.post('/api/ghost-orbits/multiplayer/create', (req, res) => {
  try {
    const { username, mode } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }

    const result = orbitsMultiplayerManager.createRoom(username, mode || 'arena');

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    console.error('POST /api/ghost-orbits/multiplayer/create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ghost-orbits/multiplayer/join - Join room via REST
app.post('/api/ghost-orbits/multiplayer/join', (req, res) => {
  try {
    const { username, roomCode } = req.body;

    if (!username || !roomCode) {
      return res.status(400).json({ error: 'Username and roomCode required' });
    }

    const result = orbitsMultiplayerManager.joinRoom(roomCode, username);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (err) {
    console.error('POST /api/ghost-orbits/multiplayer/join error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ghost-orbits/multiplayer/room/:roomCode - Get room state
app.get('/api/ghost-orbits/multiplayer/room/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const room = orbitsMultiplayerManager.getRoom(roomCode);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Return basic room info (not full state which includes WS references)
  const players = Array.from(room.players.entries()).map(([id, p]) => ({
    playerId: id,
    username: p.username,
    ready: p.ready,
    color: p.color,
    isHost: id === room.hostId
  }));

  res.json({
    roomCode: room.roomCode,
    state: room.state,
    hostId: room.hostId,
    players,
    mode: room.mode,
    canStart: room.canStart()
  });
});

console.log('[Ghost Orbits] Multiplayer REST endpoints registered');

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log(`LSRL Trainer server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

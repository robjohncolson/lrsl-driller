const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { WebSocketServer } = require('ws');
const http = require('http');
const { buildCartridgePrompt } = require('./prompt-utils.js');

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
// GAME MODE CONFIGURATION (v4.3)
// ============================================

// Game Mode Configuration (matches shared/game-mode.config.js)
const GAME_MODE_CONFIG = {
  modes: { CTF: 'ctf', KOTH: 'koth' },
  tiebreakers: { PONG: 'pong', QUICK_CALC: 'quick_calc', REFLEX_DUEL: 'reflex_duel' },
  defaults: { gameMode: 'ctf', tiebreakerType: 'pong' },
  koth: {
    windowDurationMs: 7 * 60 * 1000,
    fullWeightMs: 3 * 60 * 1000,
    decayStartMs: 3 * 60 * 1000,
    decayMidMs: 5 * 60 * 1000,
    minDecayWeight: 0,
    controlCheckIntervalMs: 1000,
    bankingIntervalMs: 1000,
    tiebreakerThresholdSeconds: 30,
    starPoints: { gold: 4, silver: 3, bronze: 2, tin: 1 }
  },
  quickCalc: {
    pointsToWin: 5,
    lockoutMs: 1000,
    timeoutMs: 15000,
    minNumber: 10,
    maxNumber: 99,
    operations: ['+', '-', '*']
  },
  reflexDuel: {
    pointsToWin: 5,
    minDelayMs: 1500,
    maxDelayMs: 4000,
    tieThresholdMs: 20
  },
  series: {
    matchesToWin: 2,
    readyCheckTimeoutMs: 30000,
    championsPerTeam: 3
  },
  validPeriods: ['A', 'B', 'C', 'D', 'E', 'F', 'G']
};

// ============================================
// LINEAR CTF (CAPTURE THE FLAG) ENDPOINTS
// ============================================

// CTF Configuration (matches shared/ctf.config.js)
const CTF_CONFIG = {
  laneLength: 21,
  startPosition: 10,
  blueFlag: 0,
  redFlag: 20,
  // v4.3.4: pointsPerMove is now dynamic based on player count - use calculatePointsPerMove()
  pointsPerMove: 20, // default fallback
  minPointsPerMove: 2, // minimum points needed to move (for small games)
  starPoints: { gold: 4, silver: 3, bronze: 2, tin: 1 },
  // v4.2: Session and tiebreaker settings
  validPeriods: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  deadZoneMin: 9,
  deadZoneMax: 11,
  championsPerTeam: 3,
  matchesToWin: 2,
  sessionCheckIntervalMs: 10000,
  warningMinutes: [5, 1],
  readyCheckTimeoutMs: 30000
};

/**
 * v4.3.4: Calculate pointsPerMove based on total player count
 * Formula: max(minPointsPerMove, totalPlayers)
 * - 2 players: 2 points to move
 * - 4 players: 4 points to move
 * - 10 players: 10 points to move
 */
function calculatePointsPerMove(totalPlayers) {
  return Math.max(CTF_CONFIG.minPointsPerMove, totalPlayers || CTF_CONFIG.minPointsPerMove);
}

/**
 * Validate class_period parameter
 */
function validateClassPeriod(classPeriod) {
  if (!classPeriod) {
    return { valid: false, error: 'class_period is required' };
  }
  if (!CTF_CONFIG.validPeriods.includes(classPeriod)) {
    return { valid: false, error: `class_period must be one of: ${CTF_CONFIG.validPeriods.join(', ')}` };
  }
  return { valid: true };
}

/**
 * Get or create CTF game for a cartridge and class period
 */
async function getOrCreateCTFGame(cartridgeId, classPeriod) {
  // Try to get existing game
  let { data: game, error } = await supabase
    .from('ctf_games')
    .select('*')
    .eq('cartridge_id', cartridgeId)
    .eq('class_period', classPeriod)
    .single();

  if (error && error.code === 'PGRST116') {
    // No game exists, create one
    const { data: newGame, error: createError } = await supabase
      .from('ctf_games')
      .insert({
        cartridge_id: cartridgeId,
        class_period: classPeriod,
        front_position: CTF_CONFIG.startPosition,
        blue_points: 0,
        red_points: 0,
        winner: null,
        session_status: 'idle'
      })
      .select()
      .single();

    if (createError) throw createError;
    game = newGame;
  } else if (error) {
    throw error;
  }

  return game;
}

/**
 * Get CTF players for a cartridge and class period
 */
async function getCTFPlayers(cartridgeId, classPeriod) {
  const { data: players, error } = await supabase
    .from('ctf_players')
    .select('username, team, points_contributed, session_points, first_point_at')
    .eq('cartridge_id', cartridgeId)
    .eq('class_period', classPeriod)
    .order('points_contributed', { ascending: false });

  if (error && error.code !== '42P01') throw error;
  return players || [];
}

/**
 * Calculate front line position based on points
 * Returns new position and whether a team won
 * v4.3.4: Now takes pointsPerMove as a parameter for dynamic scaling
 */
function calculateFrontPosition(bluePoints, redPoints, pointsPerMove) {
  const ppm = pointsPerMove || CTF_CONFIG.pointsPerMove;
  const blueAdvance = Math.floor(bluePoints / ppm);
  const redAdvance = Math.floor(redPoints / ppm);
  const netPosition = CTF_CONFIG.startPosition + blueAdvance - redAdvance;

  // Clamp to lane bounds
  const position = Math.max(CTF_CONFIG.blueFlag, Math.min(CTF_CONFIG.redFlag, netPosition));

  // Check for victory
  let winner = null;
  if (position >= CTF_CONFIG.redFlag) {
    winner = 'blue';
  } else if (position <= CTF_CONFIG.blueFlag) {
    winner = 'red';
  }

  return { position, winner };
}

// GET /api/ctf/:cartridgeId/state - Get current game state
app.get('/api/ctf/:cartridgeId/state', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { username, class_period } = req.query;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateCTFGame(cartridgeId, class_period);
    const players = await getCTFPlayers(cartridgeId, class_period);

    // Separate by team
    const blueTeam = players.filter(p => p.team === 'blue');
    const redTeam = players.filter(p => p.team === 'red');

    // v4.3.4: Calculate dynamic pointsPerMove based on total player count
    const totalPlayers = players.length;
    const dynamicPointsPerMove = calculatePointsPerMove(totalPlayers);

    // Find current user's team
    let userTeam = null;
    if (username) {
      const userPlayer = players.find(p => p.username === username);
      userTeam = userPlayer?.team || null;
    }

    res.json({
      cartridgeId,
      classPeriod: class_period,
      frontPosition: game.front_position,
      bluePoints: game.blue_points,
      redPoints: game.red_points,
      winner: game.winner,
      blueTeam,
      redTeam,
      userTeam,
      // Session info
      sessionStatus: game.session_status,
      sessionStartTime: game.session_start_time,
      sessionEndTime: game.session_end_time,
      sessionStartedAt: game.session_started_at,
      sessionEndedAt: game.session_ended_at,
      endReason: game.end_reason,
      tiebreakerWinner: game.tiebreaker_winner,
      // v4.3.4: Include dynamic pointsPerMove in config
      config: { ...CTF_CONFIG, pointsPerMove: dynamicPointsPerMove },
      totalPlayers // Include for transparency
    });
  } catch (err) {
    console.error('GET /api/ctf/:cartridgeId/state error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ctf/config - Get CTF configuration
app.get('/api/ctf/config', (req, res) => {
  res.json(CTF_CONFIG);
});

// POST /api/ctf/:cartridgeId/join - Assign player to a team
app.post('/api/ctf/:cartridgeId/join', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { username, team, class_period } = req.body;

    if (!username || !team) {
      return res.status(400).json({ error: 'Username and team required' });
    }

    if (!['blue', 'red'].includes(team)) {
      return res.status(400).json({ error: 'Team must be blue or red' });
    }

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Ensure game exists
    await getOrCreateCTFGame(cartridgeId, class_period);

    // Upsert player
    const { data: player, error } = await supabase
      .from('ctf_players')
      .upsert({
        cartridge_id: cartridgeId,
        class_period,
        username,
        team,
        points_contributed: 0,
        session_points: 0
      }, {
        onConflict: 'cartridge_id,class_period,username'
      })
      .select()
      .single();

    if (error) throw error;

    // Broadcast team update
    broadcast({
      type: 'ctf_player_joined',
      cartridgeId,
      classPeriod: class_period,
      username,
      team
    });

    res.json({ success: true, player });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/join error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/points - Add points from a star
app.post('/api/ctf/:cartridgeId/points', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { username, points, starType, class_period } = req.body;

    if (!username || points === undefined) {
      return res.status(400).json({ error: 'Username and points required' });
    }

    // Round points to integer (weighted scoring can produce decimals like 1.5)
    const pointsInt = Math.round(points);

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get current game state
    const game = await getOrCreateCTFGame(cartridgeId, class_period);

    // Check session status - only accept points during active or idle sessions
    if (game.session_status !== 'active' && game.session_status !== 'idle') {
      return res.status(400).json({
        error: 'Session not active',
        sessionStatus: game.session_status,
        message: game.session_status === 'ended' ? 'Session has ended' :
                 game.session_status === 'tiebreaker' ? 'Tiebreaker in progress' :
                 'Session is scheduled but not started'
      });
    }

    // Get all players to calculate dynamic pointsPerMove
    const players = await getCTFPlayers(cartridgeId, class_period);
    const totalPlayers = players.length;
    const dynamicPointsPerMove = calculatePointsPerMove(totalPlayers);

    // Get player's team
    const player = players.find(p => p.username === username);
    if (!player) {
      return res.status(400).json({ error: 'Player not assigned to a team' });
    }

    // Check if game already won
    if (game.winner) {
      return res.json({
        success: true,
        message: 'Game already won',
        winner: game.winner,
        frontPosition: game.front_position
      });
    }

    // Update player's points (both all-time and session)
    const newPlayerPoints = (player.points_contributed || 0) + pointsInt;
    const newSessionPoints = (player.session_points || 0) + pointsInt;
    const playerUpdate = {
      points_contributed: newPlayerPoints,
      session_points: newSessionPoints
    };

    // Set first_point_at if this is the player's first contribution this session
    if (!player.first_point_at && game.session_status === 'active') {
      playerUpdate.first_point_at = new Date().toISOString();
    }

    await supabase
      .from('ctf_players')
      .update(playerUpdate)
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('username', username);

    // Update team points in game
    const teamPointsField = player.team === 'blue' ? 'blue_points' : 'red_points';
    const currentTeamPoints = player.team === 'blue' ? game.blue_points : game.red_points;
    const newTeamPoints = currentTeamPoints + pointsInt;

    const bluePoints = player.team === 'blue' ? newTeamPoints : game.blue_points;
    const redPoints = player.team === 'red' ? newTeamPoints : game.red_points;

    // Calculate new front position with dynamic pointsPerMove
    const { position: newPosition, winner } = calculateFrontPosition(bluePoints, redPoints, dynamicPointsPerMove);

    // Update game state
    const gameUpdate = {
      [teamPointsField]: newTeamPoints,
      front_position: newPosition
    };
    if (winner) {
      gameUpdate.winner = winner;
      // If a flag was captured during an active session, end the session
      if (game.session_status === 'active') {
        gameUpdate.session_status = 'ended';
        gameUpdate.session_ended_at = new Date().toISOString();
        gameUpdate.end_reason = 'flag_captured';
      }
    }

    const { error: updateError } = await supabase
      .from('ctf_games')
      .update(gameUpdate)
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    if (updateError) throw updateError;

    // Broadcast points added
    broadcast({
      type: 'ctf_points',
      cartridgeId,
      classPeriod: class_period,
      username,
      team: player.team,
      points: pointsInt,
      starType,
      newTeamPoints,
      frontPosition: newPosition
    });

    // If front moved, broadcast that too
    if (newPosition !== game.front_position) {
      broadcast({
        type: 'ctf_front_moved',
        cartridgeId,
        classPeriod: class_period,
        frontPosition: newPosition,
        bluePoints,
        redPoints
      });
    }

    // If game won, broadcast victory
    if (winner) {
      broadcast({
        type: 'ctf_victory',
        cartridgeId,
        classPeriod: class_period,
        winner,
        finalPosition: newPosition
      });
    }

    res.json({
      success: true,
      frontPosition: newPosition,
      bluePoints,
      redPoints,
      winner,
      playerPoints: newPlayerPoints,
      sessionPoints: newSessionPoints,
      // v4.3.4: Include dynamic pointsPerMove
      pointsPerMove: dynamicPointsPerMove,
      totalPlayers
    });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/points error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/reset - Teacher resets game
app.post('/api/ctf/:cartridgeId/reset', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { preserveTeams, class_period } = req.body;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Reset game state (including session state)
    const { error: gameError } = await supabase
      .from('ctf_games')
      .update({
        front_position: CTF_CONFIG.startPosition,
        blue_points: 0,
        red_points: 0,
        winner: null,
        session_status: 'idle',
        session_start_time: null,
        session_end_time: null,
        session_started_at: null,
        session_ended_at: null,
        end_reason: null,
        tiebreaker_winner: null
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    if (gameError) throw gameError;

    // Reset player points (keep team assignments if preserveTeams is true)
    if (preserveTeams) {
      const { error: playerError } = await supabase
        .from('ctf_players')
        .update({
          points_contributed: 0,
          session_points: 0,
          first_point_at: null
        })
        .eq('cartridge_id', cartridgeId)
        .eq('class_period', class_period);

      if (playerError) throw playerError;
    } else {
      // Delete all players
      const { error: deleteError } = await supabase
        .from('ctf_players')
        .delete()
        .eq('cartridge_id', cartridgeId)
        .eq('class_period', class_period);

      if (deleteError) throw deleteError;
    }

    // Delete tiebreaker matches
    await supabase
      .from('ctf_tiebreaker_matches')
      .delete()
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    // Broadcast reset
    broadcast({
      type: 'ctf_reset',
      cartridgeId,
      classPeriod: class_period,
      preserveTeams
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ctf/:cartridgeId/leaderboard - Get team leaderboards
app.get('/api/ctf/:cartridgeId/leaderboard', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.query;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const players = await getCTFPlayers(cartridgeId, class_period);

    // Sort by points within each team
    const blueTeam = players
      .filter(p => p.team === 'blue')
      .sort((a, b) => b.points_contributed - a.points_contributed);

    const redTeam = players
      .filter(p => p.team === 'red')
      .sort((a, b) => b.points_contributed - a.points_contributed);

    const blueTotal = blueTeam.reduce((sum, p) => sum + p.points_contributed, 0);
    const redTotal = redTeam.reduce((sum, p) => sum + p.points_contributed, 0);

    const blueSessionTotal = blueTeam.reduce((sum, p) => sum + (p.session_points || 0), 0);
    const redSessionTotal = redTeam.reduce((sum, p) => sum + (p.session_points || 0), 0);

    res.json({
      blue: { players: blueTeam, totalPoints: blueTotal, sessionPoints: blueSessionTotal },
      red: { players: redTeam, totalPoints: redTotal, sessionPoints: redSessionTotal }
    });
  } catch (err) {
    console.error('GET /api/ctf/:cartridgeId/leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/assign-teams - Bulk team assignment (teacher)
app.post('/api/ctf/:cartridgeId/assign-teams', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { assignments, class_period } = req.body; // Array of { username, team }

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Assignments must be an array' });
    }

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Ensure game exists
    await getOrCreateCTFGame(cartridgeId, class_period);

    // Upsert all players
    const records = assignments.map(a => ({
      cartridge_id: cartridgeId,
      class_period,
      username: a.username,
      team: a.team,
      points_contributed: 0,
      session_points: 0
    }));

    const { error } = await supabase
      .from('ctf_players')
      .upsert(records, {
        onConflict: 'cartridge_id,class_period,username'
      });

    if (error) throw error;

    // Broadcast teams updated
    broadcast({
      type: 'ctf_teams_updated',
      cartridgeId,
      classPeriod: class_period,
      assignments
    });

    res.json({ success: true, count: assignments.length });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/assign-teams error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ctf/:cartridgeId/player/:username - Remove player from game
app.delete('/api/ctf/:cartridgeId/player/:username', async (req, res) => {
  try {
    const { cartridgeId, username } = req.params;
    const { class_period } = req.query;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { error } = await supabase
      .from('ctf_players')
      .delete()
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('username', username);

    if (error) throw error;

    // Broadcast player removed
    broadcast({
      type: 'ctf_player_removed',
      cartridgeId,
      classPeriod: class_period,
      username
    });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/ctf/:cartridgeId/player/:username error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CTF SESSION MANAGEMENT ENDPOINTS
// ============================================

// PUT /api/ctf/:cartridgeId/session/configure - Set session start/end times
app.put('/api/ctf/:cartridgeId/session/configure', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, start_time, end_time } = req.body;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'start_time and end_time required' });
    }

    // Ensure game exists
    const game = await getOrCreateCTFGame(cartridgeId, class_period);

    // Only allow configuration in idle state
    if (game.session_status !== 'idle' && game.session_status !== 'scheduled') {
      return res.status(400).json({
        error: 'Cannot configure session while active or in tiebreaker',
        sessionStatus: game.session_status
      });
    }

    // Update session times
    const { error } = await supabase
      .from('ctf_games')
      .update({
        session_start_time: start_time,
        session_end_time: end_time,
        session_status: 'scheduled'
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    if (error) throw error;

    // Broadcast configuration
    broadcast({
      type: 'ctf_session_configured',
      cartridgeId,
      classPeriod: class_period,
      startTime: start_time,
      endTime: end_time
    });

    res.json({ success: true, startTime: start_time, endTime: end_time });
  } catch (err) {
    console.error('PUT /api/ctf/:cartridgeId/session/configure error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/session/start - Manually start session
app.post('/api/ctf/:cartridgeId/session/start', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, duration_minutes } = req.body;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateCTFGame(cartridgeId, class_period);

    // Allow start from idle, scheduled, or ended state
    // (active and tiebreaker cannot be interrupted)
    if (game.session_status === 'active') {
      return res.status(400).json({
        error: 'Session already active',
        sessionStatus: game.session_status
      });
    }
    if (game.session_status === 'tiebreaker') {
      return res.status(400).json({
        error: 'Tiebreaker in progress - wait for completion or reset',
        sessionStatus: game.session_status
      });
    }

    const now = new Date();
    let sessionEndedAt = null;

    // If duration_minutes provided, calculate end time
    if (duration_minutes) {
      sessionEndedAt = new Date(now.getTime() + duration_minutes * 60 * 1000);
    } else if (game.session_end_time) {
      // Use scheduled end time - parse time and apply to today's date
      const [hours, minutes] = game.session_end_time.split(':');
      sessionEndedAt = new Date(now);
      sessionEndedAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      // If end time is before now, it might be for tomorrow
      if (sessionEndedAt <= now) {
        sessionEndedAt.setDate(sessionEndedAt.getDate() + 1);
      }
    }

    // Reset session points for all players
    await supabase
      .from('ctf_players')
      .update({ session_points: 0, first_point_at: null })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    // Build update object - if starting from 'ended', also reset game state
    const updateData = {
      session_status: 'active',
      session_started_at: now.toISOString(),
      session_ended_at: null,
      end_reason: null,
      winner: null,
      tiebreaker_winner: null
    };

    // If previous session ended, reset the board for a fresh game
    if (game.session_status === 'ended') {
      updateData.front_position = CTF_CONFIG.startPosition;
      updateData.blue_points = 0;
      updateData.red_points = 0;
    }

    // Update game state
    const { error } = await supabase
      .from('ctf_games')
      .update(updateData)
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    if (error) throw error;

    // Broadcast session started
    broadcast({
      type: 'ctf_session_started',
      cartridgeId,
      classPeriod: class_period,
      startedAt: now.toISOString(),
      endsAt: sessionEndedAt ? sessionEndedAt.toISOString() : null
    });

    res.json({
      success: true,
      sessionStatus: 'active',
      startedAt: now.toISOString(),
      endsAt: sessionEndedAt ? sessionEndedAt.toISOString() : null
    });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/session/start error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/session/stop - Manually stop session
app.post('/api/ctf/:cartridgeId/session/stop', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.body;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateCTFGame(cartridgeId, class_period);

    // Only allow stop from active state
    if (game.session_status !== 'active') {
      return res.status(400).json({
        error: 'No active session to stop',
        sessionStatus: game.session_status
      });
    }

    const now = new Date();

    // Check if we need tiebreaker (dead zone: positions 9, 10, 11)
    const inDeadZone = game.front_position >= CTF_CONFIG.deadZoneMin &&
                       game.front_position <= CTF_CONFIG.deadZoneMax;

    let newStatus = 'ended';
    let endReason = 'manual';

    if (inDeadZone) {
      newStatus = 'tiebreaker';
      endReason = null;
    }

    // Update game state
    const { error } = await supabase
      .from('ctf_games')
      .update({
        session_status: newStatus,
        session_ended_at: now.toISOString(),
        end_reason: endReason
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    if (error) throw error;

    // Broadcast session ended
    broadcast({
      type: 'ctf_session_ended',
      cartridgeId,
      classPeriod: class_period,
      reason: endReason || 'tiebreaker_needed',
      frontPosition: game.front_position,
      requiresTiebreaker: inDeadZone
    });

    // If tiebreaker needed, trigger champion selection
    if (inDeadZone) {
      await initiateTiebreaker(cartridgeId, class_period);
    }

    res.json({
      success: true,
      sessionStatus: newStatus,
      endReason: endReason,
      requiresTiebreaker: inDeadZone
    });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/session/stop error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ctf/:cartridgeId/session/status - Get session status with computed timer
app.get('/api/ctf/:cartridgeId/session/status', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.query;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateCTFGame(cartridgeId, class_period);
    const now = new Date();

    let remainingMs = null;
    let endsAt = null;

    if (game.session_status === 'active' && game.session_end_time) {
      // Calculate end time for today
      const [hours, minutes] = game.session_end_time.split(':');
      endsAt = new Date(now);
      endsAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      if (endsAt <= game.session_started_at) {
        endsAt.setDate(endsAt.getDate() + 1);
      }
      remainingMs = Math.max(0, endsAt.getTime() - now.getTime());
    }

    res.json({
      sessionStatus: game.session_status,
      sessionStartTime: game.session_start_time,
      sessionEndTime: game.session_end_time,
      sessionStartedAt: game.session_started_at,
      sessionEndedAt: game.session_ended_at,
      endReason: game.end_reason,
      tiebreakerWinner: game.tiebreaker_winner,
      endsAt: endsAt ? endsAt.toISOString() : null,
      remainingMs,
      frontPosition: game.front_position,
      winner: game.winner
    });
  } catch (err) {
    console.error('GET /api/ctf/:cartridgeId/session/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CTF TIEBREAKER ENDPOINTS
// ============================================

/**
 * Calculate velocity for champion selection
 * Velocity = session_points / minutes_since_first_point
 */
function calculateVelocity(player, now) {
  if (!player.first_point_at || player.session_points === 0) return 0;
  const minutesSinceFirst = (now - new Date(player.first_point_at)) / 60000;
  if (minutesSinceFirst <= 0) return player.session_points; // Just started
  return player.session_points / minutesSinceFirst;
}

/**
 * Select champions for tiebreaker based on velocity
 */
async function selectChampions(cartridgeId, classPeriod) {
  const players = await getCTFPlayers(cartridgeId, classPeriod);
  const now = new Date();

  const bluePlayers = players
    .filter(p => p.team === 'blue' && p.session_points > 0)
    .map(p => ({ ...p, velocity: calculateVelocity(p, now) }))
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, CTF_CONFIG.championsPerTeam);

  const redPlayers = players
    .filter(p => p.team === 'red' && p.session_points > 0)
    .map(p => ({ ...p, velocity: calculateVelocity(p, now) }))
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, CTF_CONFIG.championsPerTeam);

  return { blueChampions: bluePlayers, redChampions: redPlayers };
}

/**
 * Initiate tiebreaker sequence
 */
async function initiateTiebreaker(cartridgeId, classPeriod) {
  const { blueChampions, redChampions } = await selectChampions(cartridgeId, classPeriod);

  // Create tiebreaker match records
  for (let i = 0; i < CTF_CONFIG.championsPerTeam; i++) {
    const bluePlayer = blueChampions[i]?.username || null;
    const redPlayer = redChampions[i]?.username || null;

    await supabase
      .from('ctf_tiebreaker_matches')
      .upsert({
        cartridge_id: cartridgeId,
        class_period: classPeriod,
        match_number: i + 1,
        blue_player: bluePlayer,
        red_player: redPlayer,
        winner: null
      }, {
        onConflict: 'cartridge_id,class_period,match_number'
      });
  }

  // Broadcast tiebreaker starting
  broadcast({
    type: 'ctf_tiebreaker_starting',
    cartridgeId,
    classPeriod,
    blueChampions: blueChampions.map(p => ({ username: p.username, velocity: p.velocity })),
    redChampions: redChampions.map(p => ({ username: p.username, velocity: p.velocity }))
  });
}

// GET /api/ctf/:cartridgeId/tiebreaker/status - Get tiebreaker status
app.get('/api/ctf/:cartridgeId/tiebreaker/status', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.query;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateCTFGame(cartridgeId, class_period);

    // Get tiebreaker matches
    const { data: matches, error } = await supabase
      .from('ctf_tiebreaker_matches')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .order('match_number');

    if (error) throw error;

    // Calculate current score
    let blueWins = 0;
    let redWins = 0;
    matches?.forEach(m => {
      if (m.winner === 'blue' || m.winner === 'forfeit_red') blueWins++;
      if (m.winner === 'red' || m.winner === 'forfeit_blue') redWins++;
    });

    res.json({
      sessionStatus: game.session_status,
      tiebreakerWinner: game.tiebreaker_winner,
      matches: matches || [],
      blueWins,
      redWins,
      matchesToWin: CTF_CONFIG.matchesToWin
    });
  } catch (err) {
    console.error('GET /api/ctf/:cartridgeId/tiebreaker/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/tiebreaker/ready - Champion confirms ready
app.post('/api/ctf/:cartridgeId/tiebreaker/ready', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, username, match_number } = req.body;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Broadcast ready status
    broadcast({
      type: 'ctf_tiebreaker_ready',
      cartridgeId,
      classPeriod: class_period,
      username,
      matchNumber: match_number
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/tiebreaker/ready error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/tiebreaker/match-result - Record match result
app.post('/api/ctf/:cartridgeId/tiebreaker/match-result', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, match_number, winner, blue_score, red_score } = req.body;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (!match_number || !winner) {
      return res.status(400).json({ error: 'match_number and winner required' });
    }

    // Update match record
    const { error: matchError } = await supabase
      .from('ctf_tiebreaker_matches')
      .update({
        winner,
        blue_score: blue_score || 0,
        red_score: red_score || 0,
        ended_at: new Date().toISOString()
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('match_number', match_number);

    if (matchError) throw matchError;

    // Broadcast match end
    broadcast({
      type: 'ctf_tiebreaker_match_end',
      cartridgeId,
      classPeriod: class_period,
      matchNumber: match_number,
      winner,
      blueScore: blue_score || 0,
      redScore: red_score || 0
    });

    // Check if tiebreaker is complete
    const { data: matches } = await supabase
      .from('ctf_tiebreaker_matches')
      .select('winner')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    let blueWins = 0;
    let redWins = 0;
    matches?.forEach(m => {
      if (m.winner === 'blue' || m.winner === 'forfeit_red') blueWins++;
      if (m.winner === 'red' || m.winner === 'forfeit_blue') redWins++;
    });

    let tiebreakerWinner = null;
    if (blueWins >= CTF_CONFIG.matchesToWin) {
      tiebreakerWinner = 'blue';
    } else if (redWins >= CTF_CONFIG.matchesToWin) {
      tiebreakerWinner = 'red';
    }

    if (tiebreakerWinner) {
      // Update game with tiebreaker result
      await supabase
        .from('ctf_games')
        .update({
          session_status: 'ended',
          end_reason: 'tiebreaker_complete',
          tiebreaker_winner: tiebreakerWinner,
          winner: tiebreakerWinner
        })
        .eq('cartridge_id', cartridgeId)
        .eq('class_period', class_period);

      // Broadcast tiebreaker complete
      broadcast({
        type: 'ctf_tiebreaker_complete',
        cartridgeId,
        classPeriod: class_period,
        winner: tiebreakerWinner,
        blueWins,
        redWins
      });
    }

    res.json({
      success: true,
      blueWins,
      redWins,
      tiebreakerComplete: !!tiebreakerWinner,
      tiebreakerWinner
    });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/tiebreaker/match-result error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ctf/:cartridgeId/tiebreaker/start-match - Start a Pong match
app.post('/api/ctf/:cartridgeId/tiebreaker/start-match', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, match_number } = req.body;

    // Validate class_period
    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Get match info
    const { data: match, error } = await supabase
      .from('ctf_tiebreaker_matches')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('match_number', match_number)
      .single();

    if (error) throw error;

    // Update match start time
    await supabase
      .from('ctf_tiebreaker_matches')
      .update({ started_at: new Date().toISOString() })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('match_number', match_number);

    // Broadcast match start
    broadcast({
      type: 'ctf_tiebreaker_match_start',
      cartridgeId,
      classPeriod: class_period,
      matchNumber: match_number,
      bluePlayer: match.blue_player,
      redPlayer: match.red_player
    });

    res.json({
      success: true,
      matchNumber: match_number,
      bluePlayer: match.blue_player,
      redPlayer: match.red_player
    });
  } catch (err) {
    console.error('POST /api/ctf/:cartridgeId/tiebreaker/start-match error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GAME MODE SETTINGS ENDPOINTS (v4.3)
// ============================================

/**
 * Get or create game mode settings for a cartridge/period
 */
async function getOrCreateGameModeSettings(cartridgeId, classPeriod) {
  const { data: existing, error } = await supabase
    .from('game_mode_settings')
    .select('*')
    .eq('cartridge_id', cartridgeId)
    .eq('class_period', classPeriod)
    .single();

  if (existing) return existing;

  // Create with defaults
  const { data: created, error: createError } = await supabase
    .from('game_mode_settings')
    .insert({
      cartridge_id: cartridgeId,
      class_period: classPeriod,
      game_mode: GAME_MODE_CONFIG.defaults.gameMode,
      tiebreaker_type: GAME_MODE_CONFIG.defaults.tiebreakerType
    })
    .select()
    .single();

  if (createError && createError.code !== '23505') throw createError;
  return created || { game_mode: GAME_MODE_CONFIG.defaults.gameMode, tiebreaker_type: GAME_MODE_CONFIG.defaults.tiebreakerType };
}

// GET /api/game-mode/:cartridgeId/settings - Get game mode and tiebreaker settings
app.get('/api/game-mode/:cartridgeId/settings', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.query;

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const settings = await getOrCreateGameModeSettings(cartridgeId, class_period);
    res.json({
      gameMode: settings.game_mode,
      tiebreakerType: settings.tiebreaker_type
    });
  } catch (err) {
    console.error('GET /api/game-mode/:cartridgeId/settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/game-mode/:cartridgeId/settings - Update game mode and tiebreaker settings (teacher only)
app.put('/api/game-mode/:cartridgeId/settings', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.query;
    const { game_mode, tiebreaker_type } = req.body;
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Validate game_mode
    if (game_mode && !Object.values(GAME_MODE_CONFIG.modes).includes(game_mode)) {
      return res.status(400).json({ error: 'Invalid game_mode. Must be ctf or koth.' });
    }

    // Validate tiebreaker_type
    if (tiebreaker_type && !Object.values(GAME_MODE_CONFIG.tiebreakers).includes(tiebreaker_type)) {
      return res.status(400).json({ error: 'Invalid tiebreaker_type. Must be pong, quick_calc, or reflex_duel.' });
    }

    // Upsert settings
    const updates = {};
    if (game_mode) updates.game_mode = game_mode;
    if (tiebreaker_type) updates.tiebreaker_type = tiebreaker_type;

    const { data, error } = await supabase
      .from('game_mode_settings')
      .upsert({
        cartridge_id: cartridgeId,
        class_period: class_period,
        ...updates
      }, { onConflict: 'cartridge_id,class_period' })
      .select()
      .single();

    if (error) throw error;

    // Broadcast settings change
    broadcast({
      type: 'game_mode_changed',
      cartridgeId,
      classPeriod: class_period,
      gameMode: data.game_mode,
      tiebreakerType: data.tiebreaker_type
    });

    res.json({
      gameMode: data.game_mode,
      tiebreakerType: data.tiebreaker_type
    });
  } catch (err) {
    console.error('PUT /api/game-mode/:cartridgeId/settings error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// KING OF THE HILL (KotH) ENDPOINTS (v4.3)
// ============================================

/**
 * Get or create KotH game for a cartridge/period
 */
async function getOrCreateKotHGame(cartridgeId, classPeriod) {
  let game;
  const { data, error } = await supabase
    .from('koth_games')
    .select('*')
    .eq('cartridge_id', cartridgeId)
    .eq('class_period', classPeriod)
    .single();

  if (data) return data;

  // Create new game
  const { data: newGame, error: createError } = await supabase
    .from('koth_games')
    .insert({
      cartridge_id: cartridgeId,
      class_period: classPeriod,
      session_status: 'idle',
      blue_banked_seconds: 0,
      red_banked_seconds: 0
    })
    .select()
    .single();

  if (createError && createError.code !== '23505') throw createError;
  return newGame || { session_status: 'idle', blue_banked_seconds: 0, red_banked_seconds: 0 };
}

/**
 * Get KotH players for a cartridge/period
 */
async function getKotHPlayers(cartridgeId, classPeriod) {
  const { data: players, error } = await supabase
    .from('koth_players')
    .select('username, team, session_points, first_point_at, total_points')
    .eq('cartridge_id', cartridgeId)
    .eq('class_period', classPeriod)
    .order('total_points', { ascending: false });

  if (error && error.code !== '42P01') throw error;
  return players || [];
}

/**
 * Get recent point events within the rolling window
 */
async function getKotHPointEvents(cartridgeId, classPeriod) {
  const windowStart = new Date(Date.now() - GAME_MODE_CONFIG.koth.windowDurationMs);

  const { data: events, error } = await supabase
    .from('koth_point_events')
    .select('username, team, points, earned_at')
    .eq('cartridge_id', cartridgeId)
    .eq('class_period', classPeriod)
    .gte('earned_at', windowStart.toISOString())
    .order('earned_at', { ascending: false });

  if (error && error.code !== '42P01') throw error;
  return events || [];
}

/**
 * Calculate rolling total with decay for KotH
 */
function calculateKotHRollingTotal(team, pointEvents) {
  const { fullWeightMs, decayStartMs, decayMidMs, windowDurationMs } = GAME_MODE_CONFIG.koth;
  const now = Date.now();
  let total = 0;

  for (const event of pointEvents.filter(e => e.team === team)) {
    const ageMs = now - new Date(event.earned_at).getTime();

    if (ageMs < 0) continue; // Future event (shouldn't happen)

    if (ageMs < fullWeightMs) {
      // 0-3 min: 100% weight
      total += event.points;
    } else if (ageMs < decayMidMs) {
      // 3-5 min: decay from 100% to 50%
      const decayProgress = (ageMs - decayStartMs) / (decayMidMs - decayStartMs);
      total += event.points * (1 - decayProgress * 0.5);
    } else if (ageMs < windowDurationMs) {
      // 5-7 min: decay from 50% to 0%
      const finalDecayProgress = (ageMs - decayMidMs) / (windowDurationMs - decayMidMs);
      total += event.points * 0.5 * (1 - finalDecayProgress);
    }
    // >= 7 min: fully expired, don't add
  }

  return Math.floor(total);
}

/**
 * Determine hill holder based on rolling totals
 */
function determineHillHolder(blueTotal, redTotal) {
  if (blueTotal > redTotal) return 'blue';
  if (redTotal > blueTotal) return 'red';
  return null; // Contested/tied
}

// GET /api/koth/:cartridgeId/state - Get current KotH game state
app.get('/api/koth/:cartridgeId/state', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { username, class_period } = req.query;

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateKotHGame(cartridgeId, class_period);
    const players = await getKotHPlayers(cartridgeId, class_period);
    const pointEvents = await getKotHPointEvents(cartridgeId, class_period);

    // Calculate rolling totals
    const blueRollingTotal = calculateKotHRollingTotal('blue', pointEvents);
    const redRollingTotal = calculateKotHRollingTotal('red', pointEvents);
    const currentHolder = determineHillHolder(blueRollingTotal, redRollingTotal);

    // Separate by team
    const blueTeam = players.filter(p => p.team === 'blue');
    const redTeam = players.filter(p => p.team === 'red');

    // Find current user's team
    let userTeam = null;
    if (username) {
      const userPlayer = players.find(p => p.username === username);
      userTeam = userPlayer?.team || null;
    }

    res.json({
      cartridgeId,
      classPeriod: class_period,
      blueBankedSeconds: game.blue_banked_seconds,
      redBankedSeconds: game.red_banked_seconds,
      blueRollingTotal,
      redRollingTotal,
      currentHillHolder: currentHolder,
      hillControlSince: game.hill_control_since,
      winner: game.winner,
      blueTeam,
      redTeam,
      userTeam,
      sessionStatus: game.session_status,
      sessionStartTime: game.session_start_time,
      sessionEndTime: game.session_end_time,
      sessionStartedAt: game.session_started_at,
      sessionEndedAt: game.session_ended_at,
      endReason: game.end_reason,
      tiebreakerWinner: game.tiebreaker_winner,
      config: GAME_MODE_CONFIG.koth
    });
  } catch (err) {
    console.error('GET /api/koth/:cartridgeId/state error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/koth/:cartridgeId/join - Assign player to a team
app.post('/api/koth/:cartridgeId/join', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { username, team, class_period } = req.body;

    if (!username || !team) {
      return res.status(400).json({ error: 'Username and team required' });
    }

    if (!['blue', 'red'].includes(team)) {
      return res.status(400).json({ error: 'Team must be blue or red' });
    }

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    await getOrCreateKotHGame(cartridgeId, class_period);

    const { data: player, error } = await supabase
      .from('koth_players')
      .upsert({
        cartridge_id: cartridgeId,
        class_period,
        username,
        team,
        session_points: 0,
        total_points: 0
      }, { onConflict: 'cartridge_id,class_period,username' })
      .select()
      .single();

    if (error) throw error;

    broadcast({
      type: 'koth_player_joined',
      cartridgeId,
      classPeriod: class_period,
      username,
      team
    });

    res.json({ success: true, team });
  } catch (err) {
    console.error('POST /api/koth/:cartridgeId/join error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/koth/:cartridgeId/points - Add points from earned star
app.post('/api/koth/:cartridgeId/points', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { username, points, starType, class_period } = req.body;

    if (!username || points === undefined) {
      return res.status(400).json({ error: 'Username and points required' });
    }

    // Round points to integer (weighted scoring can produce decimals like 1.5)
    const pointsInt = Math.round(points);

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateKotHGame(cartridgeId, class_period);

    // Check session status
    if (game.session_status !== 'idle' && game.session_status !== 'active') {
      return res.status(400).json({ error: 'Session not active' });
    }

    // Get player
    const { data: player, error: playerError } = await supabase
      .from('koth_players')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('username', username)
      .single();

    if (playerError || !player) {
      return res.status(400).json({ error: 'Player not found. Join a team first.' });
    }

    // Record point event
    const { error: eventError } = await supabase
      .from('koth_point_events')
      .insert({
        cartridge_id: cartridgeId,
        class_period,
        username,
        team: player.team,
        points: pointsInt,
        star_type: starType
      });

    if (eventError) throw eventError;

    // Update player stats
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('koth_players')
      .update({
        session_points: player.session_points + pointsInt,
        total_points: player.total_points + pointsInt,
        first_point_at: player.first_point_at || now
      })
      .eq('id', player.id);

    if (updateError) throw updateError;

    // Get updated rolling totals
    const pointEvents = await getKotHPointEvents(cartridgeId, class_period);
    const blueTotal = calculateKotHRollingTotal('blue', pointEvents);
    const redTotal = calculateKotHRollingTotal('red', pointEvents);
    const newHolder = determineHillHolder(blueTotal, redTotal);

    // Check if hill control changed
    if (newHolder !== game.current_hill_holder) {
      await supabase
        .from('koth_games')
        .update({
          current_hill_holder: newHolder,
          hill_control_since: newHolder ? now : null
        })
        .eq('cartridge_id', cartridgeId)
        .eq('class_period', class_period);

      broadcast({
        type: 'koth_hill_control_changed',
        cartridgeId,
        classPeriod: class_period,
        holder: newHolder,
        since: now
      });
    }

    broadcast({
      type: 'koth_points',
      cartridgeId,
      classPeriod: class_period,
      username,
      team: player.team,
      points: pointsInt,
      blueTotal,
      redTotal
    });

    res.json({
      success: true,
      team: player.team,
      blueRollingTotal: blueTotal,
      redRollingTotal: redTotal,
      hillHolder: newHolder
    });
  } catch (err) {
    console.error('POST /api/koth/:cartridgeId/points error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/koth/:cartridgeId/session/configure - Configure session times
app.put('/api/koth/:cartridgeId/session/configure', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, start_time, end_time } = req.body;
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateKotHGame(cartridgeId, class_period);

    if (game.session_status !== 'idle') {
      return res.status(400).json({ error: 'Cannot configure session while active' });
    }

    const { data, error } = await supabase
      .from('koth_games')
      .update({
        session_start_time: start_time,
        session_end_time: end_time,
        session_status: 'scheduled'
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .select()
      .single();

    if (error) throw error;

    broadcast({
      type: 'koth_session_configured',
      cartridgeId,
      classPeriod: class_period,
      startTime: start_time,
      endTime: end_time
    });

    res.json({ startTime: start_time, endTime: end_time });
  } catch (err) {
    console.error('PUT /api/koth/:cartridgeId/session/configure error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/koth/:cartridgeId/session/start - Start session manually
app.post('/api/koth/:cartridgeId/session/start', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, duration_minutes } = req.body;
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateKotHGame(cartridgeId, class_period);

    if (game.session_status === 'active') {
      return res.status(400).json({ error: 'Session already active' });
    }

    const now = new Date();
    let endTime = game.session_end_time;

    if (duration_minutes) {
      const endDate = new Date(now.getTime() + duration_minutes * 60000);
      endTime = endDate.toTimeString().slice(0, 5);
    }

    // Reset session points for all players
    await supabase
      .from('koth_players')
      .update({ session_points: 0, first_point_at: null })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    const { data, error } = await supabase
      .from('koth_games')
      .update({
        session_status: 'active',
        session_started_at: now.toISOString(),
        session_end_time: endTime,
        blue_banked_seconds: 0,
        red_banked_seconds: 0,
        current_hill_holder: null,
        hill_control_since: null,
        winner: null
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .select()
      .single();

    if (error) throw error;

    broadcast({
      type: 'koth_session_started',
      cartridgeId,
      classPeriod: class_period,
      startedAt: now.toISOString(),
      endsAt: endTime
    });

    res.json({ startedAt: now.toISOString(), endTime });
  } catch (err) {
    console.error('POST /api/koth/:cartridgeId/session/start error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/koth/:cartridgeId/session/stop - Stop session manually
app.post('/api/koth/:cartridgeId/session/stop', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.body;
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const game = await getOrCreateKotHGame(cartridgeId, class_period);

    if (game.session_status !== 'active') {
      return res.status(400).json({ error: 'No active session to stop' });
    }

    const now = new Date();

    // Determine winner based on banked time
    let winner = null;
    let requiresTiebreaker = false;
    const diff = Math.abs(game.blue_banked_seconds - game.red_banked_seconds);

    if (diff <= GAME_MODE_CONFIG.koth.tiebreakerThresholdSeconds) {
      requiresTiebreaker = true;
    } else if (game.blue_banked_seconds > game.red_banked_seconds) {
      winner = 'blue';
    } else {
      winner = 'red';
    }

    const { data, error } = await supabase
      .from('koth_games')
      .update({
        session_status: requiresTiebreaker ? 'tiebreaker' : 'ended',
        session_ended_at: now.toISOString(),
        end_reason: 'manual',
        winner: winner
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .select()
      .single();

    if (error) throw error;

    broadcast({
      type: 'koth_session_ended',
      cartridgeId,
      classPeriod: class_period,
      endedAt: now.toISOString(),
      reason: 'manual',
      blueBankedSeconds: game.blue_banked_seconds,
      redBankedSeconds: game.red_banked_seconds,
      winner,
      requiresTiebreaker
    });

    res.json({
      sessionStatus: data.session_status,
      winner,
      requiresTiebreaker,
      blueBankedSeconds: game.blue_banked_seconds,
      redBankedSeconds: game.red_banked_seconds
    });
  } catch (err) {
    console.error('POST /api/koth/:cartridgeId/session/stop error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/koth/:cartridgeId/reset - Reset game
app.post('/api/koth/:cartridgeId/reset', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { preserveTeams, class_period } = req.body;
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Reset game state
    const { error: gameError } = await supabase
      .from('koth_games')
      .update({
        session_status: 'idle',
        session_start_time: null,
        session_end_time: null,
        session_started_at: null,
        session_ended_at: null,
        blue_banked_seconds: 0,
        red_banked_seconds: 0,
        current_hill_holder: null,
        hill_control_since: null,
        end_reason: null,
        winner: null,
        tiebreaker_winner: null
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    if (gameError) throw gameError;

    // Delete point events
    await supabase
      .from('koth_point_events')
      .delete()
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period);

    if (!preserveTeams) {
      await supabase
        .from('koth_players')
        .delete()
        .eq('cartridge_id', cartridgeId)
        .eq('class_period', class_period);
    } else {
      await supabase
        .from('koth_players')
        .update({ session_points: 0, first_point_at: null })
        .eq('cartridge_id', cartridgeId)
        .eq('class_period', class_period);
    }

    broadcast({
      type: 'koth_reset',
      cartridgeId,
      classPeriod: class_period,
      preserveTeams
    });

    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/koth/:cartridgeId/reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/koth/:cartridgeId/leaderboard - Get player rankings
app.get('/api/koth/:cartridgeId/leaderboard', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period } = req.query;

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const players = await getKotHPlayers(cartridgeId, class_period);

    const blueTeam = players
      .filter(p => p.team === 'blue')
      .sort((a, b) => b.session_points - a.session_points);
    const redTeam = players
      .filter(p => p.team === 'red')
      .sort((a, b) => b.session_points - a.session_points);

    res.json({ blueTeam, redTeam });
  } catch (err) {
    console.error('GET /api/koth/:cartridgeId/leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// UNIFIED TIEBREAKER ENDPOINTS (v4.3)
// ============================================

// GET /api/tiebreaker/:cartridgeId/status - Get tiebreaker status
app.get('/api/tiebreaker/:cartridgeId/status', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, game_mode } = req.query;

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const mode = game_mode || GAME_MODE_CONFIG.defaults.gameMode;

    // Get champions
    const { data: champions } = await supabase
      .from('tiebreaker_champions')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('game_mode', mode)
      .order('champion_rank');

    const blueChampions = (champions || []).filter(c => c.team === 'blue');
    const redChampions = (champions || []).filter(c => c.team === 'red');

    // Get matches
    const { data: matches } = await supabase
      .from('tiebreaker_matches')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('game_mode', mode)
      .order('match_number');

    res.json({
      blueChampions,
      redChampions,
      matches: matches || [],
      matchesToWin: GAME_MODE_CONFIG.series.matchesToWin
    });
  } catch (err) {
    console.error('GET /api/tiebreaker/:cartridgeId/status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiebreaker/:cartridgeId/ready - Mark champion as ready
app.post('/api/tiebreaker/:cartridgeId/ready', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, game_mode, username, match_number } = req.body;

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const mode = game_mode || GAME_MODE_CONFIG.defaults.gameMode;

    // Find the match
    const { data: match, error } = await supabase
      .from('tiebreaker_matches')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('game_mode', mode)
      .eq('match_number', match_number)
      .single();

    if (error || !match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Determine which side the player is on
    let update = {};
    if (match.blue_player === username) {
      update.blue_ready = true;
    } else if (match.red_player === username) {
      update.red_ready = true;
    } else {
      return res.status(400).json({ error: 'Player not in this match' });
    }

    // Check if both ready
    const bothReady = (match.blue_ready || update.blue_ready) && (match.red_ready || update.red_ready);
    if (bothReady) {
      update.status = 'ready';
    }

    await supabase
      .from('tiebreaker_matches')
      .update(update)
      .eq('id', match.id);

    broadcast({
      type: 'tiebreaker_ready',
      cartridgeId,
      classPeriod: class_period,
      gameMode: mode,
      username,
      matchNumber: match_number,
      bothReady
    });

    res.json({ success: true, bothReady });
  } catch (err) {
    console.error('POST /api/tiebreaker/:cartridgeId/ready error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiebreaker/:cartridgeId/start-match - Start a tiebreaker match
app.post('/api/tiebreaker/:cartridgeId/start-match', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, game_mode, match_number } = req.body;
    const password = req.headers['x-teacher-password'];

    if (password !== TEACHER_PASSWORD) {
      return res.status(401).json({ error: 'Teacher authentication required' });
    }

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const mode = game_mode || GAME_MODE_CONFIG.defaults.gameMode;

    const { data: match, error } = await supabase
      .from('tiebreaker_matches')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('game_mode', mode)
      .eq('match_number', match_number)
      .single();

    if (error || !match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const now = new Date().toISOString();

    await supabase
      .from('tiebreaker_matches')
      .update({
        status: 'in_progress',
        started_at: now
      })
      .eq('id', match.id);

    broadcast({
      type: 'tiebreaker_match_start',
      cartridgeId,
      classPeriod: class_period,
      gameMode: mode,
      matchNumber: match_number,
      bluePlayer: match.blue_player,
      redPlayer: match.red_player
    });

    res.json({
      success: true,
      matchNumber: match_number,
      bluePlayer: match.blue_player,
      redPlayer: match.red_player
    });
  } catch (err) {
    console.error('POST /api/tiebreaker/:cartridgeId/start-match error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tiebreaker/:cartridgeId/match-result - Record match result
app.post('/api/tiebreaker/:cartridgeId/match-result', async (req, res) => {
  try {
    const { cartridgeId } = req.params;
    const { class_period, game_mode, match_number, winner, blue_score, red_score } = req.body;

    const validation = validateClassPeriod(class_period);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const mode = game_mode || GAME_MODE_CONFIG.defaults.gameMode;

    const now = new Date().toISOString();

    // Update match
    const { data: match, error } = await supabase
      .from('tiebreaker_matches')
      .update({
        status: 'complete',
        winner,
        blue_score,
        red_score,
        ended_at: now
      })
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('game_mode', mode)
      .eq('match_number', match_number)
      .select()
      .single();

    if (error) throw error;

    // Get all matches to check if series is complete
    const { data: allMatches } = await supabase
      .from('tiebreaker_matches')
      .select('*')
      .eq('cartridge_id', cartridgeId)
      .eq('class_period', class_period)
      .eq('game_mode', mode);

    const blueWins = (allMatches || []).filter(m => m.winner === 'blue').length;
    const redWins = (allMatches || []).filter(m => m.winner === 'red').length;
    const seriesWinner = blueWins >= GAME_MODE_CONFIG.series.matchesToWin ? 'blue' :
                         redWins >= GAME_MODE_CONFIG.series.matchesToWin ? 'red' : null;

    broadcast({
      type: 'tiebreaker_match_end',
      cartridgeId,
      classPeriod: class_period,
      gameMode: mode,
      matchNumber: match_number,
      winner,
      blueScore: blue_score,
      redScore: red_score,
      seriesWinner,
      blueWins,
      redWins
    });

    // If series complete, update game
    if (seriesWinner) {
      const gameTable = mode === 'ctf' ? 'ctf_games' : 'koth_games';

      await supabase
        .from(gameTable)
        .update({
          session_status: 'ended',
          winner: seriesWinner,
          tiebreaker_winner: seriesWinner
        })
        .eq('cartridge_id', cartridgeId)
        .eq('class_period', class_period);

      broadcast({
        type: 'tiebreaker_series_complete',
        cartridgeId,
        classPeriod: class_period,
        gameMode: mode,
        winner: seriesWinner,
        blueWins,
        redWins
      });
    }

    res.json({
      success: true,
      matchNumber: match_number,
      winner,
      seriesWinner,
      blueWins,
      redWins
    });
  } catch (err) {
    console.error('POST /api/tiebreaker/:cartridgeId/match-result error:', err);
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
}, PRUNE_INTERVAL_MS);

// ============================================
// CTF SESSION TIMER POLLING
// ============================================

/**
 * Check for scheduled sessions that need to start
 */
async function checkScheduledSessions() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Find games that are scheduled and should start
    const { data: games, error } = await supabase
      .from('ctf_games')
      .select('*')
      .eq('session_status', 'scheduled')
      .lte('session_start_time', currentTime);

    if (error) throw error;

    for (const game of games || []) {
      // Skip if end time has passed (session was never started)
      if (game.session_end_time && game.session_end_time <= currentTime) {
        continue;
      }

      console.log(`[CTF Session] Auto-starting session for ${game.cartridge_id} period ${game.class_period}`);

      // Reset session points for all players
      await supabase
        .from('ctf_players')
        .update({ session_points: 0, first_point_at: null })
        .eq('cartridge_id', game.cartridge_id)
        .eq('class_period', game.class_period);

      // Update game to active
      await supabase
        .from('ctf_games')
        .update({
          session_status: 'active',
          session_started_at: now.toISOString(),
          session_ended_at: null,
          end_reason: null,
          winner: null,
          tiebreaker_winner: null
        })
        .eq('id', game.id);

      // Broadcast session started
      broadcast({
        type: 'ctf_session_started',
        cartridgeId: game.cartridge_id,
        classPeriod: game.class_period,
        startedAt: now.toISOString(),
        endsAt: null
      });
    }
  } catch (err) {
    console.error('[CTF Session] Error checking scheduled sessions:', err);
  }
}

/**
 * Check for active sessions that need to end (timeout)
 */
async function checkEndingSessions() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    // Find games that are active and have passed their end time
    const { data: games, error } = await supabase
      .from('ctf_games')
      .select('*')
      .eq('session_status', 'active')
      .not('session_end_time', 'is', null);

    if (error) throw error;

    for (const game of games || []) {
      // Check if end time has passed
      if (game.session_end_time > currentTime) {
        // Check if we need to send warnings
        const endTimeParts = game.session_end_time.split(':');
        const endDate = new Date(now);
        endDate.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]), 0, 0);
        const remainingMs = endDate.getTime() - now.getTime();
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        // Send warnings at 5 and 1 minute marks
        for (const warnMin of CTF_CONFIG.warningMinutes || [5, 1]) {
          if (remainingMinutes === warnMin) {
            broadcast({
              type: 'ctf_session_warning',
              cartridgeId: game.cartridge_id,
              classPeriod: game.class_period,
              minutesRemaining: warnMin
            });
          }
        }
        continue;
      }

      console.log(`[CTF Session] Auto-ending session for ${game.cartridge_id} period ${game.class_period}`);

      // Check if we need tiebreaker
      const inDeadZone = game.front_position >= CTF_CONFIG.deadZoneMin &&
                         game.front_position <= CTF_CONFIG.deadZoneMax;

      let newStatus = 'ended';
      let endReason = 'timeout';

      if (inDeadZone) {
        newStatus = 'tiebreaker';
        endReason = null;
      }

      // Update game state
      await supabase
        .from('ctf_games')
        .update({
          session_status: newStatus,
          session_ended_at: now.toISOString(),
          end_reason: endReason
        })
        .eq('id', game.id);

      // Broadcast session ended
      broadcast({
        type: 'ctf_session_ended',
        cartridgeId: game.cartridge_id,
        classPeriod: game.class_period,
        reason: endReason || 'tiebreaker_needed',
        frontPosition: game.front_position,
        requiresTiebreaker: inDeadZone
      });

      // If tiebreaker needed, initiate it
      if (inDeadZone) {
        await initiateTiebreaker(game.cartridge_id, game.class_period);
      }
    }
  } catch (err) {
    console.error('[CTF Session] Error checking ending sessions:', err);
  }
}

// Start session timer polling (every 10 seconds)
setInterval(async () => {
  await checkScheduledSessions();
  await checkEndingSessions();
}, CTF_CONFIG.sessionCheckIntervalMs || 10000);

console.log('[CTF Session] Timer polling started');

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log(`LSRL Trainer server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

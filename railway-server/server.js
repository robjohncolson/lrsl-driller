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
      level_multiplier
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

    // Calculate weighted points: base_points * level_multiplier
    const basePoints = { gold: 4, silver: 3, bronze: 2, tin: 1 };
    const starBasePoints = star_type ? (basePoints[star_type] || 0) : 0;
    const multiplier = level_multiplier || 1.0;
    const weightedPoints = starBasePoints * multiplier;

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
        weighted_points: weightedPoints
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
    return parsed;
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
    return parsed;
  }
  throw new Error('Groq: Invalid response structure');
}

/**
 * Check if a parsed response is a valid grading response
 * Accepts responses for any cartridge (LSRL, residuals, etc.)
 */
function isValidGradingResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;

  // Check if it has at least one field with a score
  const validScores = ['E', 'P', 'I', 'e', 'p', 'i'];

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

/**
 * Build a prompt from a cartridge-specific template
 * Replaces {{variables}} with values from scenario and answers
 */
function buildCartridgePrompt(template, scenario, answers) {
  let prompt = template;

  // Build problem context from scenario
  const contextParts = [];
  if (scenario.topic) contextParts.push(`Topic: ${scenario.topic}`);
  if (scenario.mode) contextParts.push(`Mode: ${scenario.mode}`);
  if (scenario.givenValues) contextParts.push(`Given values: ${scenario.givenValues}`);
  if (scenario.r) contextParts.push(`r = ${scenario.r}`);
  if (scenario.slope) contextParts.push(`Slope = ${scenario.slope}`);
  if (scenario.intercept) contextParts.push(`Intercept = ${scenario.intercept}`);
  const problemContext = contextParts.join('\n');

  // Build student response from answers
  const studentResponse = Object.entries(answers)
    .map(([field, value]) => `${field}: ${value}`)
    .join('\n');

  // Build expected answer from gradingPairs if available
  const expectedAnswer = scenario.gradingPairs || 'See grading pairs in context';

  // Replace special template variables
  prompt = prompt.replace(/\{\{problemContext\}\}/g, problemContext);
  prompt = prompt.replace(/\{\{studentResponse\}\}/g, studentResponse);
  prompt = prompt.replace(/\{\{expectedAnswer\}\}/g, expectedAnswer);

  // Replace scenario variables
  for (const [key, value] of Object.entries(scenario)) {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }
  }

  // Replace answer variables (e.g., {{predictedAnswer}}, {{residualAnswer}})
  for (const [key, value] of Object.entries(answers)) {
    const answerKey = `${key}Answer`;
    const regex = new RegExp(`\\{\\{${answerKey}\\}\\}`, 'g');
    prompt = prompt.replace(regex, String(value || ''));
  }

  // Handle conditional sections {{#if mode}}...{{/if}}
  // For residuals: calculateMode, interpretMode, analyzeMode
  const mode = scenario.mode || '';
  const modeFlags = {
    calculateMode: mode === 'calculate',
    interpretMode: mode === 'interpret',
    analyzeMode: mode === 'analyze'
  };

  for (const [flag, isActive] of Object.entries(modeFlags)) {
    const ifRegex = new RegExp(`\\{\\{#if ${flag}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'g');
    if (isActive) {
      // Keep the content, remove the markers
      prompt = prompt.replace(ifRegex, '$1');
    } else {
      // Remove the entire block
      prompt = prompt.replace(ifRegex, '');
    }
  }

  // Handle other conditional variables like {{#if residualPositive}}
  const residualPositive = parseFloat(scenario.residual) > 0;
  prompt = prompt.replace(/\{\{#if residualPositive\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    residualPositive ? '$1' : '$2');

  // Compute derived values
  const moreOrLess = residualPositive ? 'more' : 'less';
  prompt = prompt.replace(/\{\{moreOrLess\}\}/g, moreOrLess);

  // Clean up any remaining unmatched {{...}} that weren't replaced
  prompt = prompt.replace(/\{\{[^}]+\}\}/g, '');

  return prompt.trim();
}

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

// Game config - territory exploration with contestation and nodes
const GRID_WARS_CONFIG = {
  claimCost: 10,
  nodeClaimCost: 15,           // Resource nodes cost more
  surgeCost: 5,                // Surge cells cost less
  reinforceCost: 5,            // Cost to remotely reinforce a contested cell
  starPoints: {
    gold: 4,
    silver: 3,
    bronze: 2,
    tin: 1
  },
  mapSize: 20,
  classGoalTarget: 200,
  classGoalBonus: 10,
  maxContiguityBonus: 3,

  // Contestation settings
  contestationStartTime: 30,    // Seconds adjacent before contestation starts
  contestationFlipTime: 90,     // Total seconds to flip (30 start + 60 contested)

  // Decay settings
  decayIntervalMs: 60000,       // Isolated cells lose 1 strength per minute
  maxCellStrength: 3,           // Initial and max strength

  // Active drilling bonus
  activeDrillingWindow: 60,     // Seconds - if answered within this window, drain halved

  // Health settings
  healthMax: 100,
  healthDrainNeutral: 2,        // HP/sec on unclaimed land
  healthDrainEnemy: 5,          // HP/sec on enemy territory
  healthRegenHome: 5,           // HP/sec on own territory

  // Buff durations (in seconds)
  beaconDuration: 300,          // 5 minutes
  anchorDuration: 180,          // 3 minutes
  amplifierCharges: 5,          // Number of bonus answers
  amplifierBonus: 3,            // Bonus points per answer

  // Surge settings
  surgeDuration: 90,            // Seconds surge cell lasts

  // Resource node positions
  nodePositions: [
    { x: 10, y: 10, type: 'amplifier' },  // Center
    { x: 4, y: 4, type: 'beacon' },       // Top-left quadrant
    { x: 15, y: 15, type: 'anchor' }      // Bottom-right quadrant
  ],

  // Server tick interval
  tickIntervalMs: 5000          // 5 seconds
};

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

/**
 * Start contestation on a cell
 */
async function startContestation(gameId, x, y, contesterUsername) {
  await supabase
    .from('grid_wars_territories')
    .update({
      contested_by: contesterUsername,
      contested_since: new Date().toISOString()
    })
    .eq('game_id', gameId)
    .eq('x', x)
    .eq('y', y);

  broadcast({
    type: 'contestation_started',
    gameId,
    x,
    y,
    contester: contesterUsername
  });

  console.log(`Grid Wars: Contestation started at (${x}, ${y}) by ${contesterUsername}`);
}

/**
 * Clear contestation on a cell
 */
async function clearContestation(gameId, x, y) {
  await supabase
    .from('grid_wars_territories')
    .update({
      contested_by: null,
      contested_since: null
    })
    .eq('game_id', gameId)
    .eq('x', x)
    .eq('y', y);

  broadcast({
    type: 'contestation_cleared',
    gameId,
    x,
    y
  });
}

/**
 * Flip a contested cell to neutral
 */
async function flipCellToNeutral(gameId, x, y, previousOwner) {
  await supabase
    .from('grid_wars_territories')
    .delete()
    .eq('game_id', gameId)
    .eq('x', x)
    .eq('y', y);

  // Update previous owner's territory count and cluster
  if (previousOwner) {
    const { data: player } = await supabase
      .from('grid_wars_players')
      .select('territories_count')
      .eq('game_id', gameId)
      .eq('username', previousOwner)
      .single();

    if (player) {
      await supabase
        .from('grid_wars_players')
        .update({ territories_count: Math.max(0, player.territories_count - 1) })
        .eq('game_id', gameId)
        .eq('username', previousOwner);

      await updatePlayerCluster(gameId, previousOwner);
    }

    // Decrement class goal
    const { data: game } = await supabase
      .from('grid_wars_games')
      .select('class_goal_current')
      .eq('game_id', gameId)
      .single();

    if (game) {
      await supabase
        .from('grid_wars_games')
        .update({ class_goal_current: Math.max(0, game.class_goal_current - 1) })
        .eq('game_id', gameId);
    }
  }

  broadcast({
    type: 'cell_flipped_neutral',
    gameId,
    x,
    y,
    previousOwner
  });

  console.log(`Grid Wars: Cell (${x}, ${y}) flipped to neutral`);
}

/**
 * Check and update contestation status for all active games
 */
async function processContestations() {
  const { data: games } = await supabase
    .from('grid_wars_games')
    .select('game_id')
    .eq('status', 'active');

  for (const game of games || []) {
    await processGameContestations(game.game_id);
  }
}

/**
 * Process contestations for a single game
 */
async function processGameContestations(gameId) {
  const now = new Date();

  // Get all players with positions
  const { data: players } = await supabase
    .from('grid_wars_players')
    .select('username, position_x, position_y, health')
    .eq('game_id', gameId)
    .not('position_x', 'is', null);

  // Get all territories with owners
  const { data: territories } = await supabase
    .from('grid_wars_territories')
    .select('x, y, owner, contested_by, contested_since, strength')
    .eq('game_id', gameId)
    .not('owner', 'is', null);

  if (!players || !territories) return;

  const playerMap = new Map(players.map(p => [p.username, p]));

  for (const territory of territories) {
    const owner = playerMap.get(territory.owner);
    if (!owner) continue;

    // Check if any player is contesting this cell
    let validContester = null;

    for (const player of players) {
      if (player.username === territory.owner) continue;

      // Check if player is adjacent and has more health
      if (isAdjacentTo(player.position_x, player.position_y, territory.x, territory.y)) {
        if (player.health > owner.health) {
          validContester = player.username;
          break;
        }
      }
    }

    if (validContester) {
      // Start or continue contestation
      if (!territory.contested_by) {
        await startContestation(gameId, territory.x, territory.y, validContester);
      } else if (territory.contested_by === validContester) {
        // Check if contestation should flip the cell
        const contestDuration = (now - new Date(territory.contested_since)) / 1000;
        if (contestDuration >= GRID_WARS_CONFIG.contestationFlipTime) {
          await flipCellToNeutral(gameId, territory.x, territory.y, territory.owner);
        }
      }
    } else if (territory.contested_by) {
      // Owner is nearby or contester left - clear contestation
      const contester = playerMap.get(territory.contested_by);
      if (!contester || !isAdjacentTo(contester.position_x, contester.position_y, territory.x, territory.y)) {
        await clearContestation(gameId, territory.x, territory.y);
      }
    }
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

/**
 * Main server tick function - runs every 5 seconds
 */
async function gridWarsServerTick() {
  try {
    // Process contestations (every tick)
    await processContestations();

    // Process decay (every minute)
    const now = Date.now();
    if (now - lastDecayTick >= GRID_WARS_CONFIG.decayIntervalMs) {
      await processDecay();
      lastDecayTick = now;
    }

    // Check surge expiration
    await processSurgeExpiration();

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

    // Get territories with all new fields
    const { data: territories, error: terrError } = await supabase
      .from('grid_wars_territories')
      .select('x, y, owner, claimed_at, strength, contested_by, contested_since, node_type')
      .eq('game_id', gameId);

    if (terrError) throw terrError;

    // Get structures (legacy)
    const { data: structures, error: structError } = await supabase
      .from('grid_wars_structures')
      .select('x, y, structure_type, owner, health, built_at')
      .eq('game_id', gameId);

    if (structError) throw structError;

    // Get players with all new fields
    const { data: players, error: playersError } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, structures_count, largest_cluster, health, position_x, position_y, avatar_format, last_answer_at, active_buffs, updated_at')
      .eq('game_id', gameId)
      .order('action_points', { ascending: false });

    if (playersError) throw playersError;

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
        nodeClaimCost: GRID_WARS_CONFIG.nodeClaimCost,
        surgeCost: GRID_WARS_CONFIG.surgeCost,
        reinforceCost: GRID_WARS_CONFIG.reinforceCost
      }
    });
  } catch (err) {
    console.error('GET /api/grid-wars/games/:gameId/state error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Perform an action (claim territory, reinforce)
app.post('/api/grid-wars/action', async (req, res) => {
  try {
    const { gameId, username, action, x, y } = req.body;

    if (!gameId || !username || !action || x === undefined || y === undefined) {
      return res.status(400).json({ error: 'Missing required fields: gameId, username, action, x, y' });
    }

    // Validate coordinates
    if (x < 0 || x >= GRID_WARS_CONFIG.mapSize || y < 0 || y >= GRID_WARS_CONFIG.mapSize) {
      return res.status(400).json({ error: 'Coordinates out of bounds' });
    }

    // Get player's current state
    const { data: player } = await supabase
      .from('grid_wars_players')
      .select('action_points, territories_count, active_buffs')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

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
      // Check if already owned or is a resource node placeholder
      const { data: existingTerritory } = await supabase
        .from('grid_wars_territories')
        .select('owner, node_type, strength')
        .eq('game_id', gameId)
        .eq('x', x)
        .eq('y', y)
        .single();

      // Resource nodes exist as unclaimed territories with node_type set
      const isResourceNode = existingTerritory?.node_type && !existingTerritory?.owner;
      const isAlreadyOwned = existingTerritory?.owner;

      if (isAlreadyOwned) {
        return res.status(400).json({ error: 'Territory already claimed' });
      }

      // Determine cost
      let cost = GRID_WARS_CONFIG.claimCost;
      if (isResourceNode) {
        cost = GRID_WARS_CONFIG.nodeClaimCost;
      } else if (isSurgeCell) {
        cost = GRID_WARS_CONFIG.surgeCost;
      }

      if (currentPoints < cost) {
        return res.status(400).json({ error: `Insufficient points. Need ${cost}, have ${currentPoints}` });
      }

      // Claim or update territory
      if (existingTerritory) {
        // Update existing (resource node)
        await supabase
          .from('grid_wars_territories')
          .update({
            owner: username,
            claimed_at: new Date().toISOString(),
            strength: GRID_WARS_CONFIG.maxCellStrength
          })
          .eq('game_id', gameId)
          .eq('x', x)
          .eq('y', y);
      } else {
        // Insert new territory
        await supabase
          .from('grid_wars_territories')
          .insert({
            game_id: gameId,
            x,
            y,
            owner: username,
            strength: GRID_WARS_CONFIG.maxCellStrength
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

      // Broadcast
      broadcast({
        type: 'territory_claimed',
        gameId,
        username,
        x,
        y,
        cluster: newCluster,
        isNode: isResourceNode,
        nodeType: existingTerritory?.node_type
      });

      res.json({
        success: true,
        action: 'claim',
        x,
        y,
        cost,
        newPoints: currentPoints - cost,
        cluster: newCluster,
        classGoal: goalResult,
        buffApplied,
        wasSurge: isSurgeCell
      });

    } else if (action === 'reinforce') {
      // Reinforce a contested cell remotely
      const cost = GRID_WARS_CONFIG.reinforceCost;

      // Check if cell is owned by player and is contested
      const { data: territory } = await supabase
        .from('grid_wars_territories')
        .select('owner, contested_by')
        .eq('game_id', gameId)
        .eq('x', x)
        .eq('y', y)
        .single();

      if (!territory || territory.owner !== username) {
        return res.status(400).json({ error: 'You do not own this territory' });
      }

      if (!territory.contested_by) {
        return res.status(400).json({ error: 'This territory is not being contested' });
      }

      if (currentPoints < cost) {
        return res.status(400).json({ error: `Insufficient points. Need ${cost}, have ${currentPoints}` });
      }

      // Clear contestation
      await supabase
        .from('grid_wars_territories')
        .update({
          contested_by: null,
          contested_since: null,
          strength: GRID_WARS_CONFIG.maxCellStrength
        })
        .eq('game_id', gameId)
        .eq('x', x)
        .eq('y', y);

      // Deduct points
      await upsertGridWarsPlayer(gameId, username, -cost, 0);

      broadcast({
        type: 'territory_reinforced',
        gameId,
        username,
        x,
        y
      });

      res.json({
        success: true,
        action: 'reinforce',
        x,
        y,
        cost,
        newPoints: currentPoints - cost
      });

    } else {
      return res.status(400).json({ error: 'Invalid action. Use "claim" or "reinforce"' });
    }
  } catch (err) {
    console.error('POST /api/grid-wars/action error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Upsert player and update stats
async function upsertGridWarsPlayer(gameId, username, pointsDelta, territoriesDelta = 0) {
  // First try to get existing player
  const { data: existing } = await supabase
    .from('grid_wars_players')
    .select('action_points, territories_count')
    .eq('game_id', gameId)
    .eq('username', username)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('grid_wars_players')
      .update({
        action_points: Math.max(0, existing.action_points + pointsDelta),
        territories_count: Math.max(0, existing.territories_count + territoriesDelta)
      })
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
        territories_count: Math.max(0, territoriesDelta)
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
      .select('action_points')
      .eq('game_id', gameId)
      .eq('username', username)
      .single();

    if (existingPlayer) {
      await supabase
        .from('grid_wars_players')
        .update({
          action_points: existingPlayer.action_points + totalPoints,
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
          action_points: totalPoints,
          last_answer_at: new Date().toISOString(),
          active_buffs: updatedBuffs
        });
    }

    const newTotal = (existingPlayer?.action_points || 0) + totalPoints;

    // Broadcast points earned
    broadcast({
      type: 'points_earned',
      gameId,
      username,
      points: totalPoints,
      basePoints,
      contiguityBonus,
      amplifierBonus,
      cluster,
      total: newTotal,
      starType: starType || null
    });

    console.log(`Grid Wars: ${username} earned ${totalPoints} points (base: ${basePoints}, cluster: +${contiguityBonus}, amplifier: +${amplifierBonus})`);
    res.json({
      success: true,
      pointsAdded: totalPoints,
      breakdown: {
        base: basePoints,
        contiguityBonus,
        amplifierBonus,
        cluster
      },
      newTotal
    });
  } catch (err) {
    console.error('POST /api/grid-wars/points/add error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get leaderboard for Grid Wars
app.get('/api/grid-wars/leaderboard', async (req, res) => {
  try {
    const { gameId } = req.query;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId query parameter required' });
    }

    const { data: players, error } = await supabase
      .from('grid_wars_players')
      .select('username, action_points, territories_count, structures_count')
      .eq('game_id', gameId)
      .order('territories_count', { ascending: false })
      .limit(20);

    if (error) {
      if (error.code === '42P01') {
        return res.json([]);
      }
      throw error;
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
      real_name: usersMap[p.username] || null
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('GET /api/grid-wars/leaderboard error:', err);
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

    // Broadcast new player joined
    broadcast({
      type: 'player_spawned',
      gameId,
      username,
      avatar,
      position: { x: spawnX, y: spawnY },
      health: 100
    });

    res.json({
      success: true,
      username,
      avatar,
      position: { x: spawnX, y: spawnY },
      health: 100
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

// Get game config (for client)
app.get('/api/grid-wars/config', (req, res) => {
  res.json({
    mapSize: GRID_WARS_CONFIG.mapSize,
    claimCost: GRID_WARS_CONFIG.claimCost,
    nodeClaimCost: GRID_WARS_CONFIG.nodeClaimCost,
    surgeCost: GRID_WARS_CONFIG.surgeCost,
    reinforceCost: GRID_WARS_CONFIG.reinforceCost,
    healthMax: GRID_WARS_CONFIG.healthMax,
    healthDrainNeutral: GRID_WARS_CONFIG.healthDrainNeutral,
    healthDrainEnemy: GRID_WARS_CONFIG.healthDrainEnemy,
    healthRegenHome: GRID_WARS_CONFIG.healthRegenHome,
    activeDrillingWindow: GRID_WARS_CONFIG.activeDrillingWindow,
    contestationStartTime: GRID_WARS_CONFIG.contestationStartTime,
    contestationFlipTime: GRID_WARS_CONFIG.contestationFlipTime,
    maxCellStrength: GRID_WARS_CONFIG.maxCellStrength,
    beaconDuration: GRID_WARS_CONFIG.beaconDuration,
    anchorDuration: GRID_WARS_CONFIG.anchorDuration,
    amplifierCharges: GRID_WARS_CONFIG.amplifierCharges,
    amplifierBonus: GRID_WARS_CONFIG.amplifierBonus,
    surgeDuration: GRID_WARS_CONFIG.surgeDuration,
    nodePositions: GRID_WARS_CONFIG.nodePositions
  });
});

// ============================================
// HTTP SERVER + WEBSOCKET
// ============================================
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Track connected clients
const clients = new Map(); // ws -> { username, lastHeartbeat }

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload);
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
  clients.set(ws, { username: null, lastHeartbeat: Date.now() });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'identify':
          const oldUsername = clients.get(ws)?.username;
          clients.set(ws, { username: message.username, lastHeartbeat: Date.now() });

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
          const client = clients.get(ws);
          if (client) {
            client.lastHeartbeat = Date.now();
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

// Clean up stale connections (no heartbeat in 60 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [ws, data] of clients) {
    if (now - data.lastHeartbeat > 60000) {
      console.log('Closing stale connection:', data.username);
      ws.terminate();
    }
  }
}, 30000);

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log(`LSRL Trainer server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}`);

  // Start Grid Wars server tick
  startGridWarsTick();
});

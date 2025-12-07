# LSRL Trainer - Multiplayer Design Doc

## Overview

Add shared leaderboard, real-time presence, and cloud persistence to the LSRL Conclusion Trainer. Students can see each other's progress, compete for stars, and have their data backed up to survive localStorage wipes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LSRL Trainer (Browser)                   │
├─────────────────────────────────────────────────────────────────┤
│  Dexie.js (IndexedDB)          │  WebSocket Client              │
│  - Local cache of progress     │  - Real-time presence          │
│  - Offline-first               │  - Star notifications          │
│  - Survives most admin wipes   │  - Leaderboard updates         │
└──────────────┬──────────────────┴──────────────┬────────────────┘
               │ REST API                        │ WebSocket
               ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Railway Server (Node.js)                     │
├─────────────────────────────────────────────────────────────────┤
│  Express REST API              │  WebSocket Server              │
│  - /api/users                  │  - Presence tracking           │
│  - /api/progress               │  - Broadcast star events       │
│  - /api/leaderboard            │  - Heartbeat management        │
│  - /api/settings (API keys)    │                                │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────────┤
│  Tables: users, lsrl_progress, user_settings                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Supabase)

### `users` table
```sql
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  real_name TEXT,
  password TEXT,  -- plaintext ok for pedagogy app
  user_type TEXT DEFAULT 'student',  -- 'student' | 'teacher'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `lsrl_progress` table
```sql
CREATE TABLE lsrl_progress (
  id SERIAL PRIMARY KEY,
  username TEXT REFERENCES users(username),
  scenario_topic TEXT,  -- e.g., "Ice Cream Sales"

  -- Results
  slope_score TEXT,      -- 'E' | 'P' | 'I'
  intercept_score TEXT,
  correlation_score TEXT,

  -- Gamification
  hints_used INTEGER DEFAULT 0,  -- 0-3
  star_type TEXT,        -- 'gold' | 'silver' | 'bronze' | 'tin' | null
  all_correct BOOLEAN DEFAULT FALSE,

  -- Metadata
  grading_mode TEXT,     -- 'keywords' | 'ai' | 'both'
  ai_provider TEXT,      -- 'gemini' | 'groq' | null

  completed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for leaderboard queries
  CONSTRAINT valid_star CHECK (star_type IN ('gold', 'silver', 'bronze', 'tin') OR star_type IS NULL)
);

CREATE INDEX idx_progress_username ON lsrl_progress(username);
CREATE INDEX idx_progress_completed ON lsrl_progress(completed_at DESC);
```

### `user_settings` table (for API key backup)
```sql
CREATE TABLE user_settings (
  username TEXT PRIMARY KEY REFERENCES users(username),
  gemini_key TEXT,  -- encrypted or plaintext (classroom use)
  groq_key TEXT,
  preferred_provider TEXT DEFAULT 'groq',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Dexie.js Schema (Local)

```javascript
const db = new Dexie('LSRLTrainer');

db.version(1).stores({
  // Current user identity
  meta: 'key',  // { key: 'identity', value: 'Apple_Tiger' }

  // Local progress cache (mirrors Supabase)
  progress: '++id, username, completed_at',

  // Cached user settings
  settings: 'username',

  // Sync tracking
  sync: 'key'  // { key: 'lastSync', value: timestamp }
});
```

---

## Railway Server Endpoints

### Authentication
```
POST /api/users
  Body: { username, real_name, password }
  → Creates new user, returns { success, username }

POST /api/users/verify
  Body: { username, password }
  → Returns { valid: true/false }

GET /api/users
  → Returns list of usernames for dropdown
```

### Progress
```
POST /api/progress
  Body: { username, scenario_topic, slope_score, intercept_score,
          correlation_score, hints_used, star_type, all_correct,
          grading_mode, ai_provider }
  → Saves to Supabase, broadcasts via WebSocket

GET /api/progress/:username
  → Returns user's full history

GET /api/progress/:username/stats
  → Returns { totalStars: {gold, silver, bronze, tin},
              streaks: {slope, intercept, correlation},
              totalAttempts, perfectRuns }
```

### Leaderboard
```
GET /api/leaderboard
  Query: ?period=today|week|all&limit=20
  → Returns ranked list:
    [{ username, real_name, gold, silver, bronze, tin,
       weighted_score, last_active }]

  Weighted score: gold*4 + silver*3 + bronze*2 + tin*1
```

### Settings (API Key Backup)
```
GET /api/settings/:username
  Headers: { x-password: userPassword }
  → Returns { gemini_key, groq_key, preferred_provider }

POST /api/settings/:username
  Headers: { x-password: userPassword }
  Body: { gemini_key, groq_key, preferred_provider }
  → Updates user settings
```

---

## WebSocket Protocol

### Client → Server
```javascript
// Identify on connect
{ type: 'identify', username: 'Apple_Tiger' }

// Keep-alive every 30 seconds
{ type: 'heartbeat', username: 'Apple_Tiger' }

// Notify star earned (server will broadcast)
{ type: 'star_earned', username: 'Apple_Tiger',
  star_type: 'gold', scenario_topic: 'Ice Cream Sales' }
```

### Server → Client (Broadcasts)
```javascript
// Current online users
{ type: 'presence_snapshot', users: ['Apple_Tiger', 'Mango_Bear', ...] }

// User came online
{ type: 'user_online', username: 'Strawberry_Wolf' }

// User went offline
{ type: 'user_offline', username: 'Strawberry_Wolf' }

// Someone earned a star! (show notification)
{ type: 'star_earned', username: 'Apple_Tiger',
  star_type: 'gold', scenario_topic: 'Ice Cream Sales' }

// Leaderboard changed (trigger refresh)
{ type: 'leaderboard_update' }
```

---

## UI Components

### 1. Username Modal (on first visit)
```
┌─────────────────────────────────────────┐
│         Welcome to LSRL Trainer!        │
├─────────────────────────────────────────┤
│                                         │
│  Your username: [Apple_Tiger    ] 🔄    │
│                                         │
│  Your name:     [________________]      │
│                                         │
│  Password:      [________________]      │
│  (so you can log back in)               │
│                                         │
│  ─── OR sign in ───                     │
│                                         │
│  Existing user: [▼ Select user   ]      │
│  Password:      [________________]      │
│                                         │
│              [ Let's Go! ]              │
└─────────────────────────────────────────┘
```

### 2. Presence Indicator (header)
```
┌────────────────────────────────────────────────────────────────┐
│ LSRL Trainer    👥 5 online    [🏆 Leaderboard]    [⚙ Settings]│
└────────────────────────────────────────────────────────────────┘
```

Clicking "5 online" shows tooltip: "Apple_Tiger, Mango_Bear, ..."

### 3. Leaderboard Panel (slide-out or modal)
```
┌─────────────────────────────────────────┐
│  🏆 Class Leaderboard     [Today ▼]     │
├─────────────────────────────────────────┤
│  #1  🥇 Mango_Bear                      │
│      ⭐12 🥈8 🥉4 ○2  = 78 pts         │
│                                         │
│  #2  🥈 Apple_Tiger  ← YOU              │
│      ⭐10 🥈6 🥉5 ○3  = 67 pts         │
│                                         │
│  #3  🥉 Strawberry_Wolf                 │
│      ⭐8 🥈9 🥉3 ○1   = 62 pts         │
│                                         │
│  #4  Kiwi_Dolphin                       │
│      ⭐5 🥈4 🥉6 ○4   = 42 pts         │
│  ...                                    │
└─────────────────────────────────────────┘

Legend: ⭐=gold(4pts) 🥈=silver(3pts) 🥉=bronze(2pts) ○=tin(1pt)
```

### 4. Real-time Notifications (toast)
```
┌─────────────────────────────────────┐
│ ⭐ Mango_Bear earned a Gold star!   │
│    on "Ice Cream Sales"             │
└─────────────────────────────────────┘
(auto-dismiss after 3 seconds)
```

---

## Implementation Order

### Phase 1: Local Persistence (Dexie.js)
1. Add Dexie.js CDN to lsrl_trainer.html
2. Create db.js module with schema
3. Migrate existing localStorage to IndexedDB
4. Add sync tracking for future cloud sync

### Phase 2: Username System
1. Create username modal HTML/CSS
2. Generate random Fruit_Animal names
3. Store identity in IndexedDB
4. Show username in header

### Phase 3: Backend Setup
1. Create Supabase project + tables
2. Clone/extend existing Railway server
3. Add LSRL-specific endpoints
4. Test API locally

### Phase 4: Cloud Sync
1. POST progress after each graded attempt
2. GET stats on page load
3. Sync settings (API keys) to cloud backup
4. Handle offline gracefully

### Phase 5: Real-time Features
1. WebSocket connection on page load
2. Presence tracking (online indicator)
3. Star earned broadcasts
4. Toast notifications

### Phase 6: Leaderboard
1. Leaderboard API endpoint
2. Slide-out panel UI
3. Period filter (today/week/all)
4. Auto-refresh on WebSocket update

---

## Random Username Generator

```javascript
const FRUITS = [
  'Apple', 'Mango', 'Kiwi', 'Strawberry', 'Banana',
  'Orange', 'Grape', 'Peach', 'Cherry', 'Lemon',
  'Lime', 'Melon', 'Papaya', 'Coconut', 'Pineapple'
];

const ANIMALS = [
  'Tiger', 'Bear', 'Wolf', 'Dolphin', 'Eagle',
  'Panda', 'Koala', 'Fox', 'Owl', 'Hawk',
  'Lion', 'Shark', 'Whale', 'Otter', 'Falcon'
];

function generateUsername() {
  const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${fruit}_${animal}`;
}
```

---

## File Structure (new files)

```
lsrl-driller/
├── lsrl_trainer.html      (existing, add new components)
├── js/
│   ├── db.js              (Dexie.js setup & operations)
│   ├── auth.js            (username modal & identity)
│   ├── railway_client.js  (REST + WebSocket client)
│   ├── leaderboard.js     (leaderboard UI)
│   └── notifications.js   (toast notifications)
├── railway-server/
│   ├── server.js          (Express + WebSocket)
│   ├── package.json
│   └── .env.example
└── DESIGN_MULTIPLAYER.md  (this file)
```

---

## Environment Variables (Railway)

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...

# Optional: Server-side AI grading
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# Server
PORT=3000
```

---

## Security Notes

- Passwords stored plaintext (acceptable for classroom pedagogy app)
- API keys in user_settings are per-user backups, not shared
- Supabase anon key is read-heavy, writes go through Railway
- WebSocket doesn't require auth (presence is public in classroom)
- Teacher mode via hardcoded password (like scavenge app)

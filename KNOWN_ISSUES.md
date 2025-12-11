# Known Issues and Investigation Notes

This document tracks known issues in the app.html platform and serves as context for future debugging sessions.

---

## Issue 1: Only 3 Levels Showing for Simplify Radicals Cartridge

### Symptoms
- Students only see 3 levels (modes) in the mode tabs, even though the manifest defines 5 levels
- Levels 4 and 5 (Complex Numbers, Complex No Scaffolding) are not appearing

### CONFIRMED: All Code Is Present

After investigation, **all the code exists and is complete**:
- `cartridges/algebra2-radicals/manifest.json` - defines all 5 levels correctly
- `cartridges/algebra2-radicals/generator.js` - handles all 5 mode IDs
- `cartridges/algebra2-radicals/grading-rules.js` - has rules for all field types
- `platform/core/input-renderer.js` - imports and handles `visual-radical-complex`
- `platform/core/radical-complex-game.js` - full implementation exists

### Likely Root Cause: Deployment Issue

The file `platform/core/radical-complex-game.js` shows as **untracked** in git (`??` status). This means:
1. The file exists locally but was never committed to git
2. When deployed to Vercel, this file is **missing** from the build
3. When `input-renderer.js` tries to `import { RadicalComplexGame }`, it fails
4. This likely causes a module loading error that prevents modes 4 and 5 from rendering

### FIX REQUIRED

```bash
# Add the untracked file to git
git add platform/core/radical-complex-game.js
git commit -m "add RadicalComplexGame for Level 4/5 complex number radicals"
git push
```

After this, Vercel will redeploy with the missing file included.

### Verification Steps
1. Run `git status` - confirm `radical-complex-game.js` is no longer untracked
2. After deployment, open browser console on the live site
3. Check for import/module errors
4. Verify all 5 modes now appear (even if locked behind gold star requirements)

---

## Issue 2: Leaderboard Not Updating with New Student Stars

### Symptoms
- Old AP Stats students (from `index.html` legacy app) appear on leaderboard
- New students using `app.html` don't appear on leaderboard
- Stars earned in `app.html` don't sync to leaderboard

### Root Cause Analysis

The leaderboard fetches data from the server via:
```
GET /api/leaderboard?period=all&limit=20
```

This calls the Supabase function `get_leaderboard()` which queries the `lsrl_progress` table.

**The issue is that app.html does NOT save progress to the server!**

Looking at `app.html` lines 1818-1830, when a star is earned:
```javascript
// Notify server (WebSocket only - for real-time notifications)
if (wsClient.isConnected() && userSystem.currentUser) {
  wsClient.notifyStarEarned(
    userSystem.currentUser.username,
    starType,
    state.currentProblem?.context?.topic || 'Practice'
  );
}
```

This ONLY sends a WebSocket notification for real-time display to other users. It does NOT call:
```
POST /api/progress
```

The legacy `index.html` DOES call `/api/progress` to persist star data to the database.

### Solution Required

In `app.html`, after a star is earned (around line 1830), add:
```javascript
// PERSIST to database for leaderboard
if (userSystem.currentUser) {
  const problem = platform.currentProblem;
  fetch(`${SERVER_URL}/api/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: userSystem.currentUser.username,
      scenario_topic: problem?.context?.topic || 'Practice',
      star_type: starType,
      all_correct: true,
      hints_used: state.game.hintsUsed || 0,
      grading_mode: 'keywords', // or get actual mode
      // Individual scores if available from grading results
    })
  }).catch(err => console.warn('Failed to save progress:', err));
}
```

### Additional Considerations

1. **Schema Mismatch**: The `lsrl_progress` table has LSRL-specific columns (`slope_score`, `intercept_score`, `correlation_score`). For the radicals cartridge, these would be NULL which is acceptable, but consider:
   - Creating a more generic `progress` table
   - Or adding a `cartridge_id` column and making score columns nullable

2. **User Creation**: Verify that students creating accounts in `app.html` are also being saved to the `users` table in Supabase. Check `platform/core/user-system.js` for the registration flow.

3. **Server URL**: Ensure `SERVER_URL` is correctly configured in `app.html` to point to the Railway server.

---

## Architecture Overview for Context

### Data Flow for Stars

**Legacy (index.html):**
1. Student earns star
2. POST to `/api/progress` saves to `lsrl_progress` table
3. Leaderboard queries `lsrl_progress` via `get_leaderboard()` function
4. Old AP Stats students appear because their data is in the database

**New Platform (app.html):**
1. Student earns star
2. GameEngine updates localStorage only (`driller_${cartridgeId}_gameState`)
3. WebSocket notification sent (ephemeral, not persisted)
4. **NO database write occurs**
5. Leaderboard shows no data for these students

### Key Files

| File | Purpose |
|------|---------|
| `platform/app.html` | Main app entry point |
| `platform/core/game-engine.js` | Star/streak tracking (localStorage only) |
| `platform/core/leaderboard.js` | Fetches from `/api/leaderboard` |
| `platform/core/websocket-client.js` | Real-time notifications (not persistence) |
| `railway-server/server.js` | REST API and WebSocket server |
| `supabase_schema.sql` | Database schema |
| `cartridges/algebra2-radicals/manifest.json` | Radicals cartridge config |

---

## Quick Reference: Where to Look

### For "modes not showing" issues:
1. Check manifest.json has correct mode definitions
2. Check input-renderer.js has handlers for all input types
3. Check generator.js handles all mode IDs
4. Check grading-rules.js has rules for all field IDs
5. Check browser console for errors

### For "leaderboard not updating" issues:
1. Check if `/api/progress` is being called after star earned
2. Check if user exists in `users` table
3. Check server logs on Railway for errors
4. Check Supabase `lsrl_progress` table for records
5. Verify `get_leaderboard()` function in Supabase

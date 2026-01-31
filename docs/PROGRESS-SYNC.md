# Progress Sync (Restore + Sync)

## Overview
This document describes the bidirectional sync between localStorage and Supabase
to prevent student progress loss when local data is cleared.

## API Endpoint Reference

### GET `/api/progress/cartridge/:username/:cartridgeId`
Returns stored progress for a single cartridge.

Response:
- `{ found: false, data: null }` when no record exists
- `{ found: true, data }` when found, where `data` includes:
  - `gold_stars`, `silver_stars`, `bronze_stars`, `tin_stars`
  - `mode_progress` (per-mode star counts)
  - `updated_at` (ISO timestamp)

Errors:
- `500` with `{ error }` on server errors

## Data Flow Diagram
```
Client (localStorage)
        |
        | loadCartridge()
        v
GameEngine.restoreFromServer()
        |
        +--> GET /api/progress/cartridge/:username/:cartridgeId
                 |
                 v
        Supabase user_progress
        |
        v
Compare timestamps -> choose server or local
        |
        v
Update localStorage + unlocks
```

## Conflict Resolution Rules
- Local empty, server has data: restore from server
- Local newer (by timestamp): keep local
- Server newer: restore from server
- Network error: fall back to local
- First-time user: no restore

## Troubleshooting
- If restore does not happen, confirm the user is logged in and `username` is set.
- Ensure the server endpoint is deployed and reachable.
- If unlocks look wrong, confirm `mode_progress` exists and `updated_at` is valid.
- For offline scenarios, verify no exceptions are thrown and local state remains.

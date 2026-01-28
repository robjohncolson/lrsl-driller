# CTF Timed Sessions v4.2 — Specification

## Overview

Replace the current "race to flag" CTF model with time-bounded sessions that fit classroom periods. Sessions have scheduled start/end times, and close games trigger a Pong tiebreaker tournament.

---

## Session Lifecycle

### States

| State | Description |
|-------|-------------|
| `scheduled` | Session configured but not yet started |
| `active` | Drilling in progress, points flowing, front line moving |
| `tiebreaker` | Session ended in dead zone, Pong matches in progress |
| `ended` | Session complete, results displayed |

### Transitions

```
SCHEDULED ──▶ ACTIVE ──▶ ENDED
    │            │          ▲
    │            │          │
    │            ├──▶ TIEBREAKER ──┘
    │            │          
    │            └──▶ EARLY_VICTORY (flag captured) ──▶ ENDED
    │
    └──▶ (manual start OR clock hits start_time)
```

---

## Session Configuration

### Teacher-Set Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_time` | Local time (HH:MM) | When session begins (or null for manual start only) |
| `end_time` | Local time (HH:MM) | When drilling stops (should be ~7 min before bell) |
| `manual_start` | Boolean | Allow teacher to start session manually |
| `manual_stop` | Boolean | Allow teacher to end session early |

### Fixed Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `start_position` | 10 | Front line always resets to center |
| `total_positions` | 21 | Positions 0-20 |
| `points_per_move` | 20 | Team points needed to move line 1 position |
| `dead_zone` | 9-11 | Positions that trigger tiebreaker |
| `tiebreaker_duration` | 2 min | Max time for Pong tournament |

---

## Win Conditions

### At Session End (clock or manual stop)

| Front Position | Result |
|----------------|--------|
| 0-8 | **Red wins** (captured Blue flag or dominant position) |
| 9-11 | **Dead zone** → Tiebreaker triggered |
| 12-20 | **Blue wins** (captured Red flag or dominant position) |

### During Session (rare)

| Condition | Result |
|-----------|--------|
| Position reaches 0 | **Red wins** (captured Blue flag) — Early victory |
| Position reaches 20 | **Blue wins** (captured Red flag) — Early victory |

---

## Tiebreaker System

### Trigger Condition

Session ends with front position in dead zone (9, 10, or 11).

### Champion Selection

1. Calculate **point-velocity** for each player:
   ```
   velocity = points_contributed / minutes_active
   ```
   Where `minutes_active` = time from first point earned to session end.
   
   *Alternative (simpler):* Use raw `points_contributed` as selection criteria.

2. Select **top 3** from each team by velocity (or points).

3. Rank: #1 (highest), #2, #3 (lowest of selected)

### Ready Check (30 seconds)

1. System announces tiebreaker, displays selected champions
2. Champions must confirm presence (button click / keypress)
3. After 30 seconds:
   - Present players are locked in
   - Missing players forfeit their slot
   - If a team has 0 players present → **Team forfeit**
   - If BOTH teams have 0 players present → **Draw** (no winner, defending succeeds)

### Match Format

**Best of 3 matches** — First team to win 2 matches wins the session.

| Match | Blue Player | Red Player |
|-------|-------------|------------|
| 1 | #1 (highest velocity) | #1 (highest velocity) |
| 2 | #2 | #2 |
| 3 (if needed) | #3 | #3 |

### Pong Match Rules

- **First to 5 points** wins the match
- Pure Pong — no quiz questions
- Ball speed: [TBD - tune for ~30-40 sec matches]
- If a player disconnects mid-match → opponent wins match

### Match Flow

```
Match 1: Blue #1 vs Red #1
         │
    ┌────┴────┐
    ▼         ▼
 Blue 1-0   Red 0-1
    │         │
    ▼         ▼
Match 2: Blue #2 vs Red #2
         │
    ┌────┴────┐
    ▼         ▼
 Blue 2-0   Red 0-2   1-1 (either direction)
 BLUE WINS  RED WINS      │
                          ▼
                    Match 3: Blue #3 vs Red #3
                          │
                     ┌────┴────┐
                     ▼         ▼
                  BLUE WINS  RED WINS
```

### Forfeit Scenarios

| Scenario | Result |
|----------|--------|
| Blue player missing, Red present | Red wins that match |
| Red player missing, Blue present | Blue wins that match |
| Both players missing for a match | Match skipped, no point awarded |
| Entire Blue team absent | **Red wins session** (team forfeit) |
| Entire Red team absent | **Blue wins session** (team forfeit) |
| Both entire teams absent | **Draw** (no winner) |

---

## Database Schema Changes

### Modify `ctf_games` table

```sql
ALTER TABLE ctf_games ADD COLUMN session_status VARCHAR(20) DEFAULT 'scheduled';
-- Values: 'scheduled', 'active', 'tiebreaker', 'ended'

ALTER TABLE ctf_games ADD COLUMN start_time TIME;          -- Local time, nullable
ALTER TABLE ctf_games ADD COLUMN end_time TIME;            -- Local time, nullable  
ALTER TABLE ctf_games ADD COLUMN session_started_at TIMESTAMPTZ;  -- Actual start
ALTER TABLE ctf_games ADD COLUMN session_ended_at TIMESTAMPTZ;    -- Actual end
ALTER TABLE ctf_games ADD COLUMN end_reason VARCHAR(20);   
-- Values: 'timeout', 'manual', 'flag_captured', 'tiebreaker_complete'

ALTER TABLE ctf_games ADD COLUMN tiebreaker_winner VARCHAR(10);  -- 'blue', 'red', null
```

### Modify `ctf_players` table

```sql
ALTER TABLE ctf_players ADD COLUMN first_point_at TIMESTAMPTZ;  -- For velocity calc
ALTER TABLE ctf_players ADD COLUMN session_points INT DEFAULT 0; -- Points this session only
```

### New `ctf_tiebreaker_matches` table

```sql
CREATE TABLE ctf_tiebreaker_matches (
    id SERIAL PRIMARY KEY,
    cartridge_id VARCHAR(100) NOT NULL,
    session_ended_at TIMESTAMPTZ NOT NULL,  -- Links to specific session
    match_number INT NOT NULL,              -- 1, 2, or 3
    blue_player VARCHAR(50),                -- Username or null if forfeit
    red_player VARCHAR(50),
    blue_score INT,                         -- Pong points (0-5)
    red_score INT,
    winner VARCHAR(10),                     -- 'blue', 'red', 'skip' (both absent)
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    UNIQUE(cartridge_id, session_ended_at, match_number)
);
```

---

## API Endpoints

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/ctf/:cartridgeId/session/configure` | Set start_time, end_time |
| `POST` | `/api/ctf/:cartridgeId/session/start` | Manual start |
| `POST` | `/api/ctf/:cartridgeId/session/stop` | Manual stop |
| `GET` | `/api/ctf/:cartridgeId/session/status` | Get current session state |

#### Configure Session
```json
PUT /api/ctf/:cartridgeId/session/configure
{
    "start_time": "09:15",      // Local time HH:MM, or null
    "end_time": "09:53",        // Local time HH:MM
    "class_period": "A"         // Optional: for multi-period support
}
```

#### Session Status Response
```json
GET /api/ctf/:cartridgeId/session/status
{
    "status": "active",
    "start_time": "09:15",
    "end_time": "09:53",
    "started_at": "2026-01-18T09:15:00Z",
    "time_remaining_seconds": 1847,
    "front_position": 12,
    "blue_points": 156,
    "red_points": 98
}
```

### Tiebreaker

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ctf/:cartridgeId/tiebreaker/status` | Get tiebreaker state, champions |
| `POST` | `/api/ctf/:cartridgeId/tiebreaker/ready` | Champion confirms presence |
| `POST` | `/api/ctf/:cartridgeId/tiebreaker/match-result` | Record Pong match outcome |

---

## WebSocket Messages

### New Messages

| Message | Direction | Payload |
|---------|-----------|---------|
| `ctf_session_started` | Server → Client | `{cartridgeId, startedAt, endTime}` |
| `ctf_session_ending_soon` | Server → Client | `{cartridgeId, secondsRemaining: 60}` |
| `ctf_session_ended` | Server → Client | `{cartridgeId, position, result, winner?}` |
| `ctf_tiebreaker_starting` | Server → Client | `{cartridgeId, blueChampions[], redChampions[], readyDeadline}` |
| `ctf_tiebreaker_ready` | Client → Server | `{cartridgeId, username}` |
| `ctf_tiebreaker_match_start` | Server → Client | `{matchNumber, bluePlayer, redPlayer}` |
| `ctf_tiebreaker_match_end` | Server → Client | `{matchNumber, winner, blueScore, redScore, seriesScore}` |
| `ctf_tiebreaker_complete` | Server → Client | `{cartridgeId, winner, matchResults[]}` |

---

## UI Components

### Teacher Controls (CTF Panel additions)

1. **Session Configuration**
   - Start time picker (HH:MM, local time)
   - End time picker (HH:MM, local time)
   - "Start Now" button (manual start)
   - "End Session" button (manual stop, with confirmation)

2. **Session Status Display**
   - Current state badge (Scheduled / Active / Tiebreaker / Ended)
   - Countdown timer showing time remaining
   - "Ending in X:XX" warning when < 2 minutes

### Student Display

1. **During Active Session**
   - Existing CTF visualization
   - Session timer in corner
   - "Session ends in X:XX" when < 5 minutes

2. **Tiebreaker Phase**
   - Full-screen Pong arena for participants
   - Spectator view for non-participants
   - Live series score (Blue 1 - Red 0)
   - "MATCH 2 OF 3" indicator

3. **Results Screen**
   - Winning team celebration
   - MVP stats (top contributors)
   - Tiebreaker recap if applicable

---

## Timing Diagram (Example Class Period)

```
9:00  ─┬─ Bell rings
       │
9:02  ─┼─ Teacher opens Driller, configures session
       │   start_time: 9:05
       │   end_time: 9:53 (7 min before 10:00 bell)
       │
9:05  ─┼─ SESSION STARTS (auto or manual)
       │   Status: ACTIVE
       │   Students drilling, earning points
       │
       │   ... drilling continues ...
       │
9:48  ─┼─ "5 minutes remaining" warning
       │
9:52  ─┼─ "1 minute remaining" warning  
       │
9:53  ─┼─ SESSION ENDS
       │   Position = 10 (dead zone)
       │   Status: TIEBREAKER
       │
9:53  ─┼─ Ready check begins (30 sec)
       │   Champions selected, must confirm
       │
9:53:30 ┼─ Match 1 begins
       │
9:54:10 ┼─ Match 1 ends (Blue wins)
       │   Series: Blue 1 - Red 0
       │
9:54:15 ┼─ Match 2 begins
       │
9:54:50 ┼─ Match 2 ends (Red wins)
       │   Series: Blue 1 - Red 1
       │
9:54:55 ┼─ Match 3 begins (deciding match!)
       │
9:55:30 ┼─ Match 3 ends (Blue wins)
       │   BLUE WINS SESSION
       │   Status: ENDED
       │
9:55:30 ┼─ Results screen displayed
       │
10:00 ─┴─ Bell rings, students pack up
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| No students drill during session | Session ends, position stays at 10, no winner (draw) |
| Only one team has players | That team accumulates points, likely wins outright |
| Teacher never sets end_time | Session runs indefinitely until manual stop or flag capture |
| Server restart during active session | Restore from DB, session continues (times are absolute) |
| Student joins mid-session | Can join team and contribute normally |
| Student leaves during tiebreaker ready check | Treated as not present, may forfeit slot |
| Network issues during Pong match | 10-second timeout, then opponent wins if no reconnect |

---

## Migration Path from v4.1

1. Add new columns to `ctf_games` and `ctf_players`
2. Create `ctf_tiebreaker_matches` table
3. Existing games get `session_status = 'ended'`
4. No data migration needed for active games (reset on next session anyway)

---

## Testing Checklist

- [ ] Session starts at scheduled time
- [ ] Session starts on manual trigger
- [ ] Session ends at scheduled time
- [ ] Session ends on manual stop
- [ ] Points flow normally during active session
- [ ] Early victory (flag capture) ends session immediately
- [ ] Dead zone triggers tiebreaker
- [ ] Clear win (outside dead zone) skips tiebreaker
- [ ] Champion selection by point-velocity works
- [ ] Ready check timeout works (30 sec)
- [ ] Player forfeit when not ready
- [ ] Team forfeit when no players ready
- [ ] Draw when both teams absent
- [ ] Pong match starts correctly
- [ ] Pong match records winner
- [ ] Best-of-3 logic correct
- [ ] Tiebreaker result becomes session winner
- [ ] UI shows correct state at each phase
- [ ] Timer countdown accurate
- [ ] Reset clears session for next period

# Grid Wars Tuning Guide

This document explains the tunable parameters in Grid Wars and their effects on gameplay. All values are defined in `shared/gridwars.config.js`.

## Economy Knobs

### Territory Costs

| Parameter | Default | Description |
|-----------|---------|-------------|
| `claimCost` | 10 | Cost to claim neutral territory |
| `takeoverCostCold` | 15 | Cost to claim enemy territory (defender inactive >10min) |
| `takeoverCostWarm` | 20 | Cost to claim enemy territory (defender inactive 2-10min) |
| `takeoverCostActive` | 25 | Cost to claim enemy territory (defender active <2min) |
| `nodeClaimCost` | 15 | Cost to claim resource nodes |
| `surgeCost` | 5 | Cost to claim surge cells |

**Tuning tips:**
- Lower `claimCost` → faster territory expansion, more aggressive play
- Higher `takeoverCostActive` → more protection for engaged students
- The spread between COLD and ACTIVE costs determines how much activity matters

### Star Points

| Star Type | Points |
|-----------|--------|
| Gold | 4 |
| Silver | 3 |
| Bronze | 2 |
| Tin | 1 |

These values control how quickly students accumulate points. Doubling all values doubles game speed.

### Bonuses

| Parameter | Default | Description |
|-----------|---------|-------------|
| `bootBonus` | 15 | Points given to new players on join |
| `classGoalBonus` | 10 | Points awarded to ALL players when class goal reached |
| `maxContiguityBonus` | 5 | Max bonus from connected territory (cluster_size / 5) |
| `amplifierBonus` | 3 | Extra points per answer when amplifier buff active |

**Tuning tips:**
- `bootBonus` should be >= `claimCost` so new players can claim immediately
- Higher `maxContiguityBonus` rewards empire building but creates snowball effect
- `classGoalBonus` creates excitement spikes; higher = more impactful

## Activity Windows (v1.3 Updated)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `activeWindowSeconds` | 180 | Time after answering to be considered ACTIVE (3 min) |
| `warmWindowSeconds` | 480 | Time after answering to be considered WARM (8 min) |

Students are:
- **ACTIVE** if they answered within 3 minutes → territories cost 25 pts to take
- **WARM** if they answered within 3-8 minutes → territories cost 20 pts to take
- **COLD** if they haven't answered in 8+ minutes → territories cost 15 pts to take

**Tuning tips:**
- Increase `activeWindowSeconds` if students complain about being attacked while solving complex problems
- The WARM tier provides intermediate protection for bathroom breaks, etc.

## Visual Dimming

| Parameter | Default | Description |
|-----------|---------|-------------|
| `dimmingMinOpacity` | 0.3 | Minimum territory opacity at max fade (30%) |
| `dimmingFadeMinutes` | 15 | Minutes to reach minimum opacity |

Territories visually fade as their owner becomes inactive. This helps students identify vulnerable targets.

**Tuning tips:**
- Lower `dimmingMinOpacity` → more obvious which territories are "cold"
- Lower `dimmingFadeMinutes` → faster visual feedback

## Decay Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `decayIntervalMs` | 60000 | How often isolated cells lose strength (1 min) |
| `maxCellStrength` | 3 | Initial/max strength (takes 3 decay cycles to die) |

Isolated cells (not connected to player's largest cluster) decay over time. This prevents permanent map pollution from abandoned territories.

**Tuning tips:**
- Lower `decayIntervalMs` → faster map cleanup, punishes overextension
- Higher `maxCellStrength` → more forgiving, cells survive longer when cut off

## Health Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `healthMax` | 100 | Maximum player health |
| `healthDrainNeutral` | 2 | HP/sec lost on unclaimed land |
| `healthDrainEnemy` | 5 | HP/sec lost on enemy territory |
| `healthRegenHome` | 5 | HP/sec gained on own territory |

Health creates pressure to stay on friendly territory and penalizes deep raids.

**Tuning tips:**
- Higher `healthDrainEnemy` → more dangerous to attack
- Higher `healthRegenHome` → safer home bases

## Buff Durations

| Parameter | Default | Description |
|-----------|---------|-------------|
| `amplifierCharges` | 5 | Number of answers with bonus before buff expires |
| `amplifierBonus` | 3 | Extra points per answer with buff |
| `beaconDuration` | 300 | Duration of beacon buff (5 min) |
| `anchorDuration` | 180 | Duration of anchor buff (3 min) |

Resource nodes provide buffs when claimed. Currently all nodes are amplifiers.

## Surge Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `surgeDuration` | 90 | How long surge cell remains claimable (1.5 min) |

Teachers can spawn surge cells (cheap to claim) to create excitement.

## Network Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `tickIntervalMs` | 5000 | Server tick interval for decay/surge checks (5 sec) |
| `broadcastThrottleMs` | 500 | Minimum time between grid delta broadcasts |

**Tuning tips:**
- Lower `broadcastThrottleMs` → more responsive but more bandwidth
- Lower `tickIntervalMs` → more frequent decay checks

## Quick Reference: Common Adjustments

### "Students get attacked while solving problems"
- Increase `activeWindowSeconds` from 120 to 180 (3 min)
- Or increase `takeoverCostActive` from 25 to 30

### "Map gets too cluttered with abandoned territories"
- Decrease `decayIntervalMs` from 60000 to 30000
- Or decrease `maxCellStrength` from 3 to 2

### "New players feel underpowered"
- Increase `bootBonus` from 15 to 20
- Or decrease `claimCost` from 10 to 8

### "Dominant players snowball too hard"
- Decrease `maxContiguityBonus` from 5 to 3
- Or increase `takeoverCostCold` from 15 to 18

### "Game feels too slow"
- Increase all `starPoints` values by 50%
- Or decrease all costs by 20%

---

## v1.3 Features

### Spam Prevention

| Parameter | Default | Description |
|-----------|---------|-------------|
| `spamWindowSeconds` | 60 | Rolling window for wrong answer tracking (1 min) |
| `spamThreshold` | 3 | Wrong answers in window to trigger cooldown |
| `spamCooldownSeconds` | 30 | Cooldown duration that blocks drill submissions |

When a student gets 3 wrong answers within 60 seconds, they enter a 30-second cooldown where they cannot submit drill answers. Grid Wars claims still work during cooldown.

**Tuning tips:**
- Increase `spamThreshold` if students are frustrated by accidental cooldowns
- Decrease `spamCooldownSeconds` for younger students
- Increase for students who are clearly spamming random answers

### Soft Point Ceiling

| Parameter | Default | Description |
|-----------|---------|-------------|
| `pointCeilingEnabled` | true | Enable logarithmic cost scaling |
| `pointCeilingScaleFactor` | 0.1 | Multiplier for log10(points) |
| `pointCeilingMinPoints` | 10 | Minimum points before scaling applies |

Claim costs scale logarithmically with player points to prevent runaway accumulation:
- At 10 pts: costs × 1.1 (10 → 11)
- At 100 pts: costs × 1.2 (10 → 12)
- At 1000 pts: costs × 1.3 (10 → 13)

**Tuning tips:**
- Increase `pointCeilingScaleFactor` if dominant players still snowball
- Set `pointCeilingEnabled: false` to disable entirely

### AFK Erosion

| Parameter | Default | Description |
|-----------|---------|-------------|
| `afkThresholdSeconds` | 900 | Inactivity time before erosion (15 min) |
| `afkErosionIntervalMs` | 60000 | How often to check/erode (1 min) |
| `afkErosionStrength` | 1 | Strength lost per erosion tick |

Edge cells (cells with fewer than 4 same-owner neighbors) of inactive players erode over time. This prevents students from claiming territory and going AFK.

**Tuning tips:**
- Increase `afkThresholdSeconds` if students need longer breaks
- Decrease to encourage more active play

### Telemetry

| Parameter | Default | Description |
|-----------|---------|-------------|
| `telemetryEnabled` | true | Enable server-side metrics logging |
| `telemetryFlushIntervalMs` | 300000 | How often to flush metrics (5 min) |

Tracks claims, takeovers by tier, cooldowns triggered, and AFK erosions. Logs JSON to server console every 5 minutes.

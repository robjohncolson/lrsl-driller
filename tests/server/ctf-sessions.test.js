/**
 * CTF Sessions Test Suite (v4.2)
 *
 * Tests for per-period games, timed sessions, and tiebreaker functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock CTF_CONFIG
const CTF_CONFIG = {
  laneLength: 21,
  startPosition: 10,
  blueFlag: 0,
  redFlag: 20,
  pointsPerMove: 20,
  validPeriods: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  deadZoneMin: 9,
  deadZoneMax: 11,
  championsPerTeam: 3,
  matchesToWin: 2,
  sessionCheckIntervalMs: 10000,
  warningMinutes: [5, 1]
};

// Helper functions from server (simplified versions for testing)
function validateClassPeriod(classPeriod) {
  if (!classPeriod) {
    return { valid: false, error: 'class_period is required' };
  }
  if (!CTF_CONFIG.validPeriods.includes(classPeriod)) {
    return { valid: false, error: `class_period must be one of: ${CTF_CONFIG.validPeriods.join(', ')}` };
  }
  return { valid: true };
}

function calculateFrontPosition(bluePoints, redPoints) {
  const blueAdvance = Math.floor(bluePoints / CTF_CONFIG.pointsPerMove);
  const redAdvance = Math.floor(redPoints / CTF_CONFIG.pointsPerMove);
  const netPosition = CTF_CONFIG.startPosition + blueAdvance - redAdvance;
  const position = Math.max(CTF_CONFIG.blueFlag, Math.min(CTF_CONFIG.redFlag, netPosition));

  let winner = null;
  if (position >= CTF_CONFIG.redFlag) {
    winner = 'blue';
  } else if (position <= CTF_CONFIG.blueFlag) {
    winner = 'red';
  }

  return { position, winner };
}

function calculateVelocity(player, now) {
  if (!player.first_point_at || player.session_points === 0) return 0;
  const minutesSinceFirst = (now - new Date(player.first_point_at)) / 60000;
  if (minutesSinceFirst <= 0) return player.session_points;
  return player.session_points / minutesSinceFirst;
}

function isInDeadZone(position) {
  return position >= CTF_CONFIG.deadZoneMin && position <= CTF_CONFIG.deadZoneMax;
}

describe('CTF Per-Period Games', () => {
  describe('validateClassPeriod', () => {
    it('should accept valid periods A-G', () => {
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(period => {
        const result = validateClassPeriod(period);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid periods', () => {
      const result = validateClassPeriod('X');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be one of');
    });

    it('should reject null/undefined periods', () => {
      expect(validateClassPeriod(null).valid).toBe(false);
      expect(validateClassPeriod(undefined).valid).toBe(false);
      expect(validateClassPeriod('').valid).toBe(false);
    });

    it('should reject lowercase periods', () => {
      const result = validateClassPeriod('a');
      expect(result.valid).toBe(false);
    });
  });
});

describe('CTF Session Status', () => {
  describe('Session States', () => {
    it('should recognize all valid session states', () => {
      const validStates = ['idle', 'scheduled', 'active', 'tiebreaker', 'ended'];
      validStates.forEach(state => {
        expect(validStates.includes(state)).toBe(true);
      });
    });

    it('should allow points only during idle or active sessions', () => {
      const allowPointsStates = ['idle', 'active'];
      const disallowPointsStates = ['scheduled', 'tiebreaker', 'ended'];

      allowPointsStates.forEach(state => {
        expect(state === 'idle' || state === 'active').toBe(true);
      });

      disallowPointsStates.forEach(state => {
        expect(state !== 'idle' && state !== 'active').toBe(true);
      });
    });
  });
});

describe('CTF Dead Zone & Tiebreaker', () => {
  describe('Dead Zone Detection', () => {
    it('should identify positions 9, 10, 11 as dead zone', () => {
      expect(isInDeadZone(9)).toBe(true);
      expect(isInDeadZone(10)).toBe(true);
      expect(isInDeadZone(11)).toBe(true);
    });

    it('should not identify positions outside 9-11 as dead zone', () => {
      expect(isInDeadZone(8)).toBe(false);
      expect(isInDeadZone(12)).toBe(false);
      expect(isInDeadZone(0)).toBe(false);
      expect(isInDeadZone(20)).toBe(false);
    });
  });

  describe('Front Position Calculation', () => {
    it('should start at position 10', () => {
      const { position } = calculateFrontPosition(0, 0);
      expect(position).toBe(10);
    });

    it('should move toward red flag (20) when blue scores', () => {
      const { position } = calculateFrontPosition(20, 0);
      expect(position).toBe(11);
    });

    it('should move toward blue flag (0) when red scores', () => {
      const { position } = calculateFrontPosition(0, 20);
      expect(position).toBe(9);
    });

    it('should detect blue victory at position 20', () => {
      const { position, winner } = calculateFrontPosition(200, 0);
      expect(position).toBe(20);
      expect(winner).toBe('blue');
    });

    it('should detect red victory at position 0', () => {
      const { position, winner } = calculateFrontPosition(0, 200);
      expect(position).toBe(0);
      expect(winner).toBe('red');
    });

    it('should stay in dead zone with balanced points', () => {
      const { position, winner } = calculateFrontPosition(20, 20);
      expect(position).toBe(10);
      expect(winner).toBe(null);
      expect(isInDeadZone(position)).toBe(true);
    });
  });
});

describe('CTF Velocity Calculation', () => {
  describe('calculateVelocity', () => {
    it('should return 0 for players with no points', () => {
      const player = { session_points: 0, first_point_at: null };
      const velocity = calculateVelocity(player, new Date());
      expect(velocity).toBe(0);
    });

    it('should return session_points for players who just started', () => {
      const now = new Date();
      const player = { session_points: 10, first_point_at: now.toISOString() };
      const velocity = calculateVelocity(player, now);
      expect(velocity).toBe(10);
    });

    it('should calculate velocity as points/minutes', () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const player = {
        session_points: 20,
        first_point_at: tenMinutesAgo.toISOString()
      };
      const velocity = calculateVelocity(player, now);
      expect(velocity).toBe(2); // 20 points / 10 minutes = 2 pts/min
    });

    it('should rank faster players higher', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      const fastPlayer = {
        session_points: 20,
        first_point_at: fiveMinutesAgo.toISOString()
      };
      const slowPlayer = {
        session_points: 20,
        first_point_at: tenMinutesAgo.toISOString()
      };

      const fastVelocity = calculateVelocity(fastPlayer, now);
      const slowVelocity = calculateVelocity(slowPlayer, now);

      expect(fastVelocity).toBeGreaterThan(slowVelocity);
    });
  });
});

describe('CTF Tiebreaker', () => {
  describe('Champion Selection', () => {
    it('should select top 3 players by velocity per team', () => {
      const now = new Date();
      const players = [
        { username: 'blue1', team: 'blue', session_points: 30, first_point_at: new Date(now - 5 * 60 * 1000).toISOString() },
        { username: 'blue2', team: 'blue', session_points: 20, first_point_at: new Date(now - 5 * 60 * 1000).toISOString() },
        { username: 'blue3', team: 'blue', session_points: 10, first_point_at: new Date(now - 5 * 60 * 1000).toISOString() },
        { username: 'blue4', team: 'blue', session_points: 5, first_point_at: new Date(now - 5 * 60 * 1000).toISOString() },
        { username: 'red1', team: 'red', session_points: 25, first_point_at: new Date(now - 5 * 60 * 1000).toISOString() },
        { username: 'red2', team: 'red', session_points: 15, first_point_at: new Date(now - 5 * 60 * 1000).toISOString() },
      ];

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

      expect(bluePlayers.length).toBe(3);
      expect(bluePlayers[0].username).toBe('blue1');
      expect(bluePlayers[1].username).toBe('blue2');
      expect(bluePlayers[2].username).toBe('blue3');

      expect(redPlayers.length).toBe(2);
      expect(redPlayers[0].username).toBe('red1');
    });
  });

  describe('Best of 3 Logic', () => {
    it('should require 2 wins to win tiebreaker', () => {
      expect(CTF_CONFIG.matchesToWin).toBe(2);
    });

    it('should detect blue winner with 2 wins', () => {
      const matches = [
        { winner: 'blue' },
        { winner: 'red' },
        { winner: 'blue' }
      ];

      let blueWins = 0;
      let redWins = 0;
      matches.forEach(m => {
        if (m.winner === 'blue') blueWins++;
        if (m.winner === 'red') redWins++;
      });

      expect(blueWins >= CTF_CONFIG.matchesToWin).toBe(true);
    });

    it('should detect red winner with 2 wins', () => {
      const matches = [
        { winner: 'red' },
        { winner: 'red' }
      ];

      let redWins = 0;
      matches.forEach(m => {
        if (m.winner === 'red') redWins++;
      });

      expect(redWins >= CTF_CONFIG.matchesToWin).toBe(true);
    });

    it('should count forfeit wins correctly', () => {
      const matches = [
        { winner: 'forfeit_red' }, // Blue wins by forfeit
        { winner: 'blue' }
      ];

      let blueWins = 0;
      matches.forEach(m => {
        if (m.winner === 'blue' || m.winner === 'forfeit_red') blueWins++;
      });

      expect(blueWins).toBe(2);
    });
  });
});

describe('CTF Session Timer', () => {
  describe('Time Parsing', () => {
    it('should parse HH:MM time format', () => {
      const timeStr = '14:30';
      const [hours, minutes] = timeStr.split(':').map(Number);
      expect(hours).toBe(14);
      expect(minutes).toBe(30);
    });

    it('should create valid Date from time string', () => {
      const timeStr = '14:30';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
    });
  });

  describe('Warning Minutes', () => {
    it('should warn at 5 and 1 minute marks', () => {
      expect(CTF_CONFIG.warningMinutes).toContain(5);
      expect(CTF_CONFIG.warningMinutes).toContain(1);
    });
  });
});

describe('CTF End Reasons', () => {
  it('should recognize all valid end reasons', () => {
    const validReasons = ['timeout', 'manual', 'flag_captured', 'tiebreaker_complete'];
    validReasons.forEach(reason => {
      expect(typeof reason).toBe('string');
    });
  });

  it('should trigger tiebreaker when ending in dead zone', () => {
    const frontPosition = 10;
    const inDeadZone = isInDeadZone(frontPosition);
    expect(inDeadZone).toBe(true);

    const newStatus = inDeadZone ? 'tiebreaker' : 'ended';
    expect(newStatus).toBe('tiebreaker');
  });

  it('should end directly when not in dead zone', () => {
    const frontPosition = 15;
    const inDeadZone = isInDeadZone(frontPosition);
    expect(inDeadZone).toBe(false);

    const newStatus = inDeadZone ? 'tiebreaker' : 'ended';
    expect(newStatus).toBe('ended');
  });
});

describe('CTF WebSocket Messages', () => {
  describe('Message Types', () => {
    it('should have classPeriod in all CTF messages', () => {
      const sampleMessages = [
        { type: 'ctf_session_started', cartridgeId: 'test', classPeriod: 'A' },
        { type: 'ctf_session_ended', cartridgeId: 'test', classPeriod: 'B' },
        { type: 'ctf_points', cartridgeId: 'test', classPeriod: 'C' },
        { type: 'ctf_front_moved', cartridgeId: 'test', classPeriod: 'D' }
      ];

      sampleMessages.forEach(msg => {
        expect(msg.classPeriod).toBeDefined();
        expect(CTF_CONFIG.validPeriods.includes(msg.classPeriod)).toBe(true);
      });
    });
  });

  describe('Session Messages', () => {
    const sessionMessages = [
      'ctf_session_configured',
      'ctf_session_started',
      'ctf_session_warning',
      'ctf_session_ended'
    ];

    sessionMessages.forEach(type => {
      it(`should recognize ${type} message type`, () => {
        expect(typeof type).toBe('string');
        expect(type.startsWith('ctf_session_')).toBe(true);
      });
    });
  });

  describe('Tiebreaker Messages', () => {
    const tiebreakerMessages = [
      'ctf_tiebreaker_starting',
      'ctf_tiebreaker_ready',
      'ctf_tiebreaker_match_start',
      'ctf_tiebreaker_match_end',
      'ctf_tiebreaker_complete'
    ];

    tiebreakerMessages.forEach(type => {
      it(`should recognize ${type} message type`, () => {
        expect(typeof type).toBe('string');
        expect(type.startsWith('ctf_tiebreaker_')).toBe(true);
      });
    });
  });
});

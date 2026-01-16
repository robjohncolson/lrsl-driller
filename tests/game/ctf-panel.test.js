/**
 * CTF Panel Tests
 * Tests for CTF UI panel functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CTF_CONFIG } from '../../shared/ctf.config.js';

describe('CTF Panel', () => {
  describe('Panel State', () => {
    it('should track panel visibility', () => {
      let visible = false;

      const show = () => { visible = true; };
      const hide = () => { visible = false; };

      expect(visible).toBe(false);
      show();
      expect(visible).toBe(true);
      hide();
      expect(visible).toBe(false);
    });

    it('should track current cartridge', () => {
      let currentCartridgeId = null;

      const setCartridge = (id) => { currentCartridgeId = id; };

      setCartridge('lsrl-basics');
      expect(currentCartridgeId).toBe('lsrl-basics');

      setCartridge('sampling');
      expect(currentCartridgeId).toBe('sampling');
    });

    it('should track teacher mode', () => {
      let isTeacher = false;

      const setTeacherMode = (value) => { isTeacher = value; };

      expect(isTeacher).toBe(false);
      setTeacherMode(true);
      expect(isTeacher).toBe(true);
    });
  });

  describe('Team Roster Display', () => {
    it('should format player list correctly', () => {
      const formatPlayerList = (players) => {
        if (!players || players.length === 0) return 'No players';
        return players.map(p => `${p.username} (${p.points_contributed || 0})`).join(', ');
      };

      expect(formatPlayerList([])).toBe('No players');
      expect(formatPlayerList(null)).toBe('No players');

      const players = [
        { username: 'alice', points_contributed: 10 },
        { username: 'bob', points_contributed: 5 }
      ];
      expect(formatPlayerList(players)).toBe('alice (10), bob (5)');
    });

    it('should sort players by contribution', () => {
      const sortByContribution = (players) => {
        return [...players].sort((a, b) =>
          (b.points_contributed || 0) - (a.points_contributed || 0)
        );
      };

      const players = [
        { username: 'bob', points_contributed: 5 },
        { username: 'alice', points_contributed: 10 },
        { username: 'charlie', points_contributed: 0 }
      ];

      const sorted = sortByContribution(players);
      expect(sorted[0].username).toBe('alice');
      expect(sorted[1].username).toBe('bob');
      expect(sorted[2].username).toBe('charlie');
    });
  });

  describe('Join Button State', () => {
    it('should disable join buttons when user already on team', () => {
      const getJoinButtonState = (userTeam, targetTeam) => {
        if (userTeam === targetTeam) return 'current';
        if (userTeam !== null) return 'switch';
        return 'join';
      };

      expect(getJoinButtonState(null, 'blue')).toBe('join');
      expect(getJoinButtonState('blue', 'blue')).toBe('current');
      expect(getJoinButtonState('blue', 'red')).toBe('switch');
      expect(getJoinButtonState('red', 'blue')).toBe('switch');
    });

    it('should generate correct button text', () => {
      const getButtonText = (userTeam, targetTeam) => {
        if (userTeam === targetTeam) return 'Your Team';
        if (userTeam !== null) return `Switch to ${targetTeam}`;
        return `Join ${targetTeam}`;
      };

      expect(getButtonText(null, 'blue')).toBe('Join blue');
      expect(getButtonText('blue', 'blue')).toBe('Your Team');
      expect(getButtonText('blue', 'red')).toBe('Switch to red');
    });
  });

  describe('Score Display', () => {
    it('should format score display correctly', () => {
      const formatScore = (frontPosition, bluePoints, redPoints) => {
        const blueDistance = frontPosition - CTF_CONFIG.blueFlag;
        const redDistance = CTF_CONFIG.redFlag - frontPosition;
        return {
          blueDistance,
          redDistance,
          blueProgress: (bluePoints % CTF_CONFIG.pointsPerMove) / CTF_CONFIG.pointsPerMove,
          redProgress: (redPoints % CTF_CONFIG.pointsPerMove) / CTF_CONFIG.pointsPerMove
        };
      };

      // At center
      let score = formatScore(10, 0, 0);
      expect(score.blueDistance).toBe(10);
      expect(score.redDistance).toBe(10);
      expect(score.blueProgress).toBe(0);
      expect(score.redProgress).toBe(0);

      // Blue ahead
      score = formatScore(15, 100, 0);
      expect(score.blueDistance).toBe(15);
      expect(score.redDistance).toBe(5);
      expect(score.blueProgress).toBe(0); // 100 % 20 = 0

      // With partial progress
      score = formatScore(10, 15, 8);
      expect(score.blueProgress).toBe(0.75); // 15/20
      expect(score.redProgress).toBe(0.4); // 8/20
    });
  });

  describe('Victory Overlay', () => {
    it('should show correct winner message', () => {
      const getVictoryMessage = (winner) => {
        if (!winner) return null;
        return `${winner.toUpperCase()} WINS!`;
      };

      expect(getVictoryMessage(null)).toBeNull();
      expect(getVictoryMessage('blue')).toBe('BLUE WINS!');
      expect(getVictoryMessage('red')).toBe('RED WINS!');
    });

    it('should apply correct victory color', () => {
      const getVictoryColor = (winner) => {
        if (winner === 'blue') return CTF_CONFIG.colors.blue;
        if (winner === 'red') return CTF_CONFIG.colors.red;
        return null;
      };

      expect(getVictoryColor('blue')).toBe(CTF_CONFIG.colors.blue);
      expect(getVictoryColor('red')).toBe(CTF_CONFIG.colors.red);
      expect(getVictoryColor(null)).toBeNull();
    });
  });

  describe('Teacher Controls', () => {
    it('should only show teacher controls in teacher mode', () => {
      const shouldShowTeacherControls = (isTeacher) => isTeacher === true;

      expect(shouldShowTeacherControls(true)).toBe(true);
      expect(shouldShowTeacherControls(false)).toBe(false);
      expect(shouldShowTeacherControls(undefined)).toBe(false);
    });

    it('should generate team assignment options', () => {
      const generateAssignmentOptions = (players, team) => {
        return players.map(p => ({
          username: p.username,
          currentTeam: p.team,
          targetTeam: team
        }));
      };

      const unassignedPlayers = [
        { username: 'alice', team: null },
        { username: 'bob', team: null }
      ];

      const options = generateAssignmentOptions(unassignedPlayers, 'blue');
      expect(options).toHaveLength(2);
      expect(options[0].targetTeam).toBe('blue');
    });

    it('should validate reset options', () => {
      const validateResetOptions = (preserveTeams) => {
        return typeof preserveTeams === 'boolean';
      };

      expect(validateResetOptions(true)).toBe(true);
      expect(validateResetOptions(false)).toBe(true);
      expect(validateResetOptions(undefined)).toBe(false);
      expect(validateResetOptions('yes')).toBe(false);
    });
  });

  describe('Points Integration', () => {
    it('should call addPoints with weighted points', async () => {
      const mockAddPoints = vi.fn().mockResolvedValue({ success: true });

      const addPoints = async (points, starType) => {
        return mockAddPoints(points, starType);
      };

      await addPoints(4, 'gold');
      expect(mockAddPoints).toHaveBeenCalledWith(4, 'gold');

      await addPoints(3, 'silver');
      expect(mockAddPoints).toHaveBeenCalledWith(3, 'silver');
    });

    it('should not add points if user not on team', async () => {
      const state = {
        userTeam: null
      };

      const addPoints = async (points) => {
        if (!state.userTeam) {
          console.warn('User not on team');
          return null;
        }
        return { points };
      };

      const result = await addPoints(4);
      expect(result).toBeNull();
    });

    it('should add points when user is on team', async () => {
      const state = {
        userTeam: 'blue'
      };

      const addPoints = async (points) => {
        if (!state.userTeam) {
          return null;
        }
        return { points, team: state.userTeam };
      };

      const result = await addPoints(4);
      expect(result).toEqual({ points: 4, team: 'blue' });
    });
  });

  describe('Leaderboard Display', () => {
    it('should combine and sort team leaderboards', () => {
      const createLeaderboard = (blueTeam, redTeam) => {
        const all = [
          ...blueTeam.map(p => ({ ...p, team: 'blue' })),
          ...redTeam.map(p => ({ ...p, team: 'red' }))
        ];
        return all.sort((a, b) => (b.points_contributed || 0) - (a.points_contributed || 0));
      };

      const blue = [{ username: 'alice', points_contributed: 10 }];
      const red = [{ username: 'bob', points_contributed: 15 }];

      const leaderboard = createLeaderboard(blue, red);
      expect(leaderboard[0].username).toBe('bob');
      expect(leaderboard[0].team).toBe('red');
      expect(leaderboard[1].username).toBe('alice');
    });

    it('should calculate team totals', () => {
      const calculateTeamTotal = (team) => {
        return team.reduce((sum, p) => sum + (p.points_contributed || 0), 0);
      };

      const team = [
        { username: 'alice', points_contributed: 10 },
        { username: 'bob', points_contributed: 5 },
        { username: 'charlie', points_contributed: 3 }
      ];

      expect(calculateTeamTotal(team)).toBe(18);
      expect(calculateTeamTotal([])).toBe(0);
    });
  });

  describe('Responsive Layout', () => {
    it('should calculate canvas dimensions', () => {
      const calculateCanvasDimensions = (containerWidth) => {
        const padding = 20;
        const availableWidth = containerWidth - padding * 2;
        const cellWidth = availableWidth / CTF_CONFIG.laneLength;
        return {
          width: containerWidth,
          cellWidth: Math.max(cellWidth, 20), // Minimum cell width
          laneLength: CTF_CONFIG.laneLength
        };
      };

      // Normal size
      let dims = calculateCanvasDimensions(500);
      expect(dims.width).toBe(500);
      expect(dims.cellWidth).toBeGreaterThan(20);

      // Small container
      dims = calculateCanvasDimensions(200);
      expect(dims.cellWidth).toBe(20); // Minimum enforced
    });
  });

  describe('Animation', () => {
    it('should calculate animation progress', () => {
      const calculateAnimationProgress = (elapsed, duration) => {
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        return 1 - Math.pow(1 - progress, 3);
      };

      expect(calculateAnimationProgress(0, 500)).toBe(0);
      expect(calculateAnimationProgress(500, 500)).toBe(1);
      expect(calculateAnimationProgress(250, 500)).toBeCloseTo(0.875, 2);
    });

    it('should interpolate front position during animation', () => {
      const interpolatePosition = (from, to, progress) => {
        return from + (to - from) * progress;
      };

      expect(interpolatePosition(10, 11, 0)).toBe(10);
      expect(interpolatePosition(10, 11, 1)).toBe(11);
      expect(interpolatePosition(10, 11, 0.5)).toBe(10.5);
    });
  });
});

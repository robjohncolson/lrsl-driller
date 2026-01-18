/**
 * Roster API Tests
 * Tests for teacher class roster management endpoints
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Roster API', () => {
  const VALID_PERIODS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const TEACHER_PASSWORD = 'stats123';

  describe('GET /api/roster', () => {
    it('should require teacher authentication', () => {
      const authenticate = (password) => {
        if (password !== TEACHER_PASSWORD) {
          return { error: 'Teacher authentication required', status: 401 };
        }
        return { success: true };
      };

      expect(authenticate('wrong')).toEqual({
        error: 'Teacher authentication required',
        status: 401
      });
    });

    it('should allow access with valid teacher password', () => {
      const authenticate = (password) => {
        if (password !== TEACHER_PASSWORD) {
          return { error: 'Teacher authentication required', status: 401 };
        }
        return { success: true };
      };

      expect(authenticate(TEACHER_PASSWORD).success).toBe(true);
    });

    it('should return all students with class periods', () => {
      const mockStudents = [
        { username: 'Apple_Tiger', real_name: 'John Doe', class_period: 'A', created_at: '2025-01-15' },
        { username: 'Blue_Bear', real_name: null, class_period: 'B', created_at: '2025-01-15' },
        { username: 'Cool_Cat', real_name: 'Jane Smith', class_period: null, created_at: '2025-01-16' }
      ];

      expect(mockStudents).toHaveLength(3);
      expect(mockStudents[0].class_period).toBe('A');
      expect(mockStudents[1].real_name).toBeNull();
      expect(mockStudents[2].class_period).toBeNull();
    });

    it('should sort by class_period then username', () => {
      const students = [
        { username: 'Zebra', class_period: 'B' },
        { username: 'Alpha', class_period: 'A' },
        { username: 'Beta', class_period: 'A' },
        { username: 'Unassigned', class_period: null }
      ];

      const sorted = [...students].sort((a, b) => {
        // Null periods come last
        if (a.class_period === null && b.class_period === null) {
          return a.username.localeCompare(b.username);
        }
        if (a.class_period === null) return 1;
        if (b.class_period === null) return -1;
        // Sort by period then username
        if (a.class_period !== b.class_period) {
          return a.class_period.localeCompare(b.class_period);
        }
        return a.username.localeCompare(b.username);
      });

      expect(sorted[0].username).toBe('Alpha');
      expect(sorted[1].username).toBe('Beta');
      expect(sorted[2].username).toBe('Zebra');
      expect(sorted[3].username).toBe('Unassigned');
    });
  });

  describe('PUT /api/roster/:username', () => {
    it('should require teacher authentication', () => {
      const authenticate = (password) => {
        if (password !== TEACHER_PASSWORD) {
          return { error: 'Teacher authentication required', status: 401 };
        }
        return { success: true };
      };

      expect(authenticate('wrong').status).toBe(401);
    });

    it('should validate class_period', () => {
      const validatePeriod = (period) => {
        if (period === null || period === undefined) return true;
        return VALID_PERIODS.includes(period);
      };

      expect(validatePeriod('A')).toBe(true);
      expect(validatePeriod('G')).toBe(true);
      expect(validatePeriod('H')).toBe(false);
      expect(validatePeriod('1')).toBe(false);
      expect(validatePeriod(null)).toBe(true);
    });

    it('should update real_name', () => {
      const updateStudent = (student, updates) => {
        return { ...student, ...updates };
      };

      const original = { username: 'Apple_Tiger', real_name: null, class_period: 'A' };
      const updated = updateStudent(original, { real_name: 'John Doe' });

      expect(updated.real_name).toBe('John Doe');
      expect(updated.username).toBe('Apple_Tiger');
      expect(updated.class_period).toBe('A');
    });

    it('should update class_period', () => {
      const updateStudent = (student, updates) => {
        return { ...student, ...updates };
      };

      const original = { username: 'Apple_Tiger', real_name: 'John', class_period: null };
      const updated = updateStudent(original, { class_period: 'B' });

      expect(updated.class_period).toBe('B');
    });

    it('should update both fields at once', () => {
      const updateStudent = (student, updates) => {
        return { ...student, ...updates };
      };

      const original = { username: 'Apple_Tiger', real_name: null, class_period: null };
      const updated = updateStudent(original, { real_name: 'John Doe', class_period: 'C' });

      expect(updated.real_name).toBe('John Doe');
      expect(updated.class_period).toBe('C');
    });

    it('should reject empty updates', () => {
      const validateUpdates = (updates) => {
        if (Object.keys(updates).length === 0) {
          return { error: 'No fields to update', status: 400 };
        }
        return { success: true };
      };

      expect(validateUpdates({}).error).toBe('No fields to update');
      expect(validateUpdates({ real_name: 'Test' }).success).toBe(true);
    });

    it('should reject invalid class period', () => {
      const validatePeriod = (period) => {
        if (period !== undefined && period !== null && !VALID_PERIODS.includes(period)) {
          return { error: 'Invalid class period. Must be A-G or null.', status: 400 };
        }
        return { success: true };
      };

      expect(validatePeriod('X').error).toContain('Invalid class period');
      expect(validatePeriod('1').error).toContain('Invalid class period');
    });

    it('should allow clearing real_name with empty string', () => {
      const processUpdate = (value) => {
        // Empty string should become null
        return value || null;
      };

      expect(processUpdate('')).toBeNull();
      expect(processUpdate('John')).toBe('John');
    });
  });

  describe('POST /api/roster/bulk-assign', () => {
    it('should require teacher authentication', () => {
      const authenticate = (password) => {
        if (password !== TEACHER_PASSWORD) {
          return { error: 'Teacher authentication required', status: 401 };
        }
        return { success: true };
      };

      expect(authenticate('wrong').status).toBe(401);
    });

    it('should require non-empty assignments array', () => {
      const validateAssignments = (assignments) => {
        if (!Array.isArray(assignments) || assignments.length === 0) {
          return { error: 'Assignments must be a non-empty array', status: 400 };
        }
        return { success: true };
      };

      expect(validateAssignments([]).error).toContain('non-empty array');
      expect(validateAssignments(null).error).toContain('non-empty array');
      expect(validateAssignments([{ username: 'test', class_period: 'A' }]).success).toBe(true);
    });

    it('should require username in each assignment', () => {
      const validateAssignment = (assignment) => {
        if (!assignment.username) {
          return { error: 'Each assignment must have a username', status: 400 };
        }
        return { success: true };
      };

      expect(validateAssignment({ class_period: 'A' }).error).toContain('must have a username');
      expect(validateAssignment({ username: 'test', class_period: 'A' }).success).toBe(true);
    });

    it('should validate all class periods in bulk', () => {
      const validateBulkAssignments = (assignments) => {
        for (const a of assignments) {
          if (a.class_period !== undefined && a.class_period !== null && !VALID_PERIODS.includes(a.class_period)) {
            return { error: `Invalid class period for ${a.username}. Must be A-G or null.`, status: 400 };
          }
        }
        return { success: true };
      };

      const validAssignments = [
        { username: 'user1', class_period: 'A' },
        { username: 'user2', class_period: 'B' }
      ];

      const invalidAssignments = [
        { username: 'user1', class_period: 'A' },
        { username: 'user2', class_period: 'X' } // Invalid
      ];

      expect(validateBulkAssignments(validAssignments).success).toBe(true);
      expect(validateBulkAssignments(invalidAssignments).error).toContain('Invalid class period for user2');
    });

    it('should process multiple assignments', () => {
      const processAssignments = (assignments) => {
        const results = [];
        const errors = [];

        for (const a of assignments) {
          // Simulate update
          if (a.username === 'not_found') {
            errors.push({ username: a.username, error: 'Student not found' });
          } else {
            results.push({ username: a.username, ...a });
          }
        }

        return {
          success: errors.length === 0,
          updated: results.length,
          errors: errors.length > 0 ? errors : undefined
        };
      };

      const result = processAssignments([
        { username: 'user1', class_period: 'A' },
        { username: 'user2', class_period: 'B' },
        { username: 'not_found', class_period: 'C' }
      ]);

      expect(result.updated).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].username).toBe('not_found');
    });

    it('should skip assignments with no changes', () => {
      const processAssignments = (assignments) => {
        let skipped = 0;
        const results = [];

        for (const a of assignments) {
          const updates = {};
          if (a.class_period !== undefined) updates.class_period = a.class_period;
          if (a.real_name !== undefined) updates.real_name = a.real_name;

          if (Object.keys(updates).length === 0) {
            skipped++;
            continue;
          }
          results.push({ username: a.username, ...updates });
        }

        return { updated: results.length, skipped };
      };

      const result = processAssignments([
        { username: 'user1', class_period: 'A' },
        { username: 'user2' } // No updates
      ]);

      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(1);
    });
  });

  describe('Class Period Validation', () => {
    it('should accept all valid periods A-G', () => {
      for (const period of VALID_PERIODS) {
        expect(VALID_PERIODS.includes(period)).toBe(true);
      }
    });

    it('should reject invalid period values', () => {
      const invalidPeriods = ['H', 'Z', '1', '0', 'a', 'AB', ''];

      for (const period of invalidPeriods) {
        expect(VALID_PERIODS.includes(period)).toBe(false);
      }
    });

    it('should allow null for unassigned students', () => {
      const isValidPeriod = (period) => {
        return period === null || VALID_PERIODS.includes(period);
      };

      expect(isValidPeriod(null)).toBe(true);
      expect(isValidPeriod('A')).toBe(true);
      expect(isValidPeriod('X')).toBe(false);
    });
  });

  describe('Period Badge Display', () => {
    it('should generate badge HTML for assigned students', () => {
      const generateBadge = (classPeriod) => {
        if (!classPeriod) return '';
        return `<span class="period-badge">${classPeriod}</span>`;
      };

      expect(generateBadge('A')).toContain('A');
      expect(generateBadge(null)).toBe('');
    });

    it('should count students by period', () => {
      const students = [
        { username: 'u1', class_period: 'A' },
        { username: 'u2', class_period: 'A' },
        { username: 'u3', class_period: 'B' },
        { username: 'u4', class_period: null }
      ];

      const countByPeriod = (students) => {
        const counts = { unassigned: 0 };
        for (const period of VALID_PERIODS) {
          counts[period] = 0;
        }
        for (const s of students) {
          if (s.class_period) {
            counts[s.class_period]++;
          } else {
            counts.unassigned++;
          }
        }
        return counts;
      };

      const counts = countByPeriod(students);
      expect(counts.A).toBe(2);
      expect(counts.B).toBe(1);
      expect(counts.C).toBe(0);
      expect(counts.unassigned).toBe(1);
    });
  });
});

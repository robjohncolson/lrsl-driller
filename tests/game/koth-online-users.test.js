/**
 * KotH Online Users Filtering Tests (v4.3.4)
 *
 * Tests that KotH panel properly filters and displays online users
 * matching the CTF panel behavior.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const kothPanelPath = join(process.cwd(), 'platform', 'game', 'koth-panel.js');
const ctfPanelPath = join(process.cwd(), 'platform', 'game', 'ctf-panel.js');
const kothCode = readFileSync(kothPanelPath, 'utf-8');
const ctfCode = readFileSync(ctfPanelPath, 'utf-8');

describe('KotH Online Users Filtering (v4.3.4)', () => {
  describe('KotH Panel _updateTeacherPanel', () => {
    it('should filter by online users when available', () => {
      expect(kothCode).toContain('if (this.onlineUsernames.size > 0)');
      expect(kothCode).toContain('availableUsers = availableUsers.filter(u => this.onlineUsernames.has(u.username))');
    });

    it('should show green dot indicator for online users', () => {
      expect(kothCode).toContain('🟢');
    });

    it('should show period badge for users in different periods', () => {
      expect(kothCode).toContain('const periodNote = u.class_period && u.class_period !== currentPeriod');
      expect(kothCode).toContain('` [${u.class_period}]`');
    });

    it('should update online user count display', () => {
      expect(kothCode).toContain("#online-user-count");
      expect(kothCode).toContain('`(${availableUsers.length} online)`');
    });

    it('should have debug logging', () => {
      expect(kothCode).toContain("[KotH Panel] allUsers:");
    });
  });

  describe('KotH Panel HTML', () => {
    it('should have online-user-count element in HTML', () => {
      expect(kothCode).toContain('id="online-user-count"');
    });

    it('should have user-select element', () => {
      expect(kothCode).toContain('id="user-select"');
    });
  });

  describe('KotH Panel setOnlineUsers method', () => {
    it('should have setOnlineUsers method', () => {
      expect(kothCode).toContain('setOnlineUsers(usernames)');
    });

    it('should store usernames as a Set', () => {
      expect(kothCode).toContain('this.onlineUsernames = new Set(usernames || [])');
    });

    it('should call _updateTeacherPanel when teacher', () => {
      const setOnlineUsersMatch = kothCode.match(
        /setOnlineUsers\(usernames\)\s*\{[\s\S]*?^\s*\}/m
      );
      expect(setOnlineUsersMatch).toBeTruthy();
      expect(setOnlineUsersMatch[0]).toContain('this._updateTeacherPanel()');
    });
  });

  describe('Parity with CTF Panel', () => {
    it('should have same online user filtering logic as CTF', () => {
      // Both should filter by online usernames
      expect(kothCode).toContain('this.onlineUsernames.has(u.username)');
      expect(ctfCode).toContain('this.onlineUsernames.has(u.username)');
    });

    it('should have same green dot indicator as CTF', () => {
      expect(kothCode).toContain('🟢');
      expect(ctfCode).toContain('🟢');
    });

    it('should have same period badge logic as CTF', () => {
      expect(kothCode).toContain('u.class_period !== currentPeriod');
      expect(ctfCode).toContain('u.class_period !== currentPeriod');
    });

    it('should have online-user-count element in both panels', () => {
      expect(kothCode).toContain('id="online-user-count"');
      expect(ctfCode).toContain('id="online-user-count"');
    });
  });

  describe('GameModeManager Integration', () => {
    const gameModeManagerPath = join(process.cwd(), 'platform', 'game', 'game-mode-manager.js');
    const gameModeManagerCode = readFileSync(gameModeManagerPath, 'utf-8');

    it('should store online usernames for mode switching', () => {
      expect(gameModeManagerCode).toContain('this._onlineUsernames = usernames || []');
    });

    it('should pass online users to panel on mode switch', () => {
      expect(gameModeManagerCode).toContain('_passUserDataToPanel');
      expect(gameModeManagerCode).toContain('this.activePanel.setOnlineUsers(this._onlineUsernames)');
    });

    it('should delegate setOnlineUsers to active panel', () => {
      expect(gameModeManagerCode).toContain('setOnlineUsers(usernames)');
      expect(gameModeManagerCode).toContain("this.activePanel.setOnlineUsers(usernames)");
    });
  });
});

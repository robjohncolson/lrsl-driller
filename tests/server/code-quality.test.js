/**
 * Code quality tests for railway-server
 * Ensures server code has proper structure
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SERVER_PATH = path.join(process.cwd(), 'railway-server', 'server.js');
const CTF_CONFIG_PATH = path.join(process.cwd(), 'shared', 'ctf.config.js');

describe('Server Code Quality', () => {
  describe('CTF Configuration', () => {
    it('should have CTF config file', () => {
      expect(fs.existsSync(CTF_CONFIG_PATH)).toBe(true);
    });

    it('should export CTF_CONFIG', () => {
      const configCode = fs.readFileSync(CTF_CONFIG_PATH, 'utf-8');
      expect(configCode).toContain('export const CTF_CONFIG');
    });

    it('should have CommonJS export for server compatibility', () => {
      const configCode = fs.readFileSync(CTF_CONFIG_PATH, 'utf-8');
      expect(configCode).toContain('module.exports');
    });
  });

  describe('Server CTF Endpoints', () => {
    it('should have CTF state endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/:cartridgeId/state');
    });

    it('should have CTF join endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/:cartridgeId/join');
    });

    it('should have CTF points endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/:cartridgeId/points');
    });

    it('should have CTF reset endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/:cartridgeId/reset');
    });

    it('should have CTF leaderboard endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/:cartridgeId/leaderboard');
    });

    it('should have CTF assign-teams endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/:cartridgeId/assign-teams');
    });

    it('should have CTF player removal endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/:cartridgeId/player/:username');
    });

    it('should have CTF config endpoint', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ctf/config');
    });
  });

  describe('Server Structure', () => {
    it('should not have Grid Wars endpoints (removed in v4.0)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain('/api/grid-wars/');
    });

    it('should not have Pong endpoints (removed in v4.0)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain('/api/pong/');
    });

    it('should not import address-utils (removed in v4.0)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain("require('./address-utils.js')");
    });

    it('should not import gridwars.config (removed in v4.0)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain("require('./gridwars.config.js')");
    });

    it('should not import pong.config (removed in v4.0)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain("require('./pong.config.js')");
    });
  });

  describe('WebSocket Broadcasts', () => {
    it('should have CTF WebSocket message broadcasts', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('ctf_front_moved');
      expect(serverCode).toContain('ctf_victory');
      expect(serverCode).toContain('ctf_reset');
      expect(serverCode).toContain('ctf_player_joined');
    });
  });

  describe('Server Infrastructure (v4.0.1 regression prevention)', () => {
    it('should create HTTP server from Express app', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('http.createServer(app)');
    });

    it('should create WebSocket server', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('new WebSocketServer');
    });

    it('should have clients Map for tracking connections', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('const clients = new Map()');
    });

    it('should have broadcast function defined', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('function broadcast(message)');
    });

    it('should import http module', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain("require('http')");
    });

    it('should import WebSocketServer from ws', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain("{ WebSocketServer }");
      expect(serverCode).toContain("require('ws')");
    });

    it('should call server.listen at the end', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('server.listen(PORT');
    });

    it('should have wss.on connection handler', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain("wss.on('connection'");
    });
  });
});

/**
 * Code quality tests for railway-server
 * Ensures server code has proper structure
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SERVER_PATH = path.join(process.cwd(), 'railway-server', 'server.js');

describe('Server Code Quality', () => {
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

    it('should not have CTF endpoints (removed in v4.9)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain('/api/ctf/');
    });

    it('should not have KotH endpoints (removed in v4.9)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain('/api/koth/');
    });

    it('should not have game-mode endpoints (removed in v4.9)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain('/api/game-mode/');
    });

    it('should not have tiebreaker endpoints (removed in v4.9)', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).not.toContain('/api/tiebreaker/');
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

  describe('Ghost Orbits (v4.8)', () => {
    it('should have Ghost Orbits endpoints', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('/api/ghost-orbits/');
    });

    it('should import ArenaManager', () => {
      const serverCode = fs.readFileSync(SERVER_PATH, 'utf-8');
      expect(serverCode).toContain('ArenaManager');
    });
  });
});

/**
 * Pong Duel Configuration (CommonJS for server)
 * Territory resolver minigame for Grid Wars
 *
 * v1.0: Initial implementation
 *
 * SYNC: This file must stay in sync with shared/pong.config.js
 */

const PONG_CONFIG = {
  // === COURT ===
  courtWidth: 600,
  courtHeight: 400,

  // === PADDLES ===
  paddleWidth: 12,
  paddleBaseHeight: 80,
  paddleBonusPerCorrect: 5,
  paddleBonusMax: 20,
  paddleSpeed: 7,
  paddleMargin: 20,
  recentCorrectWindowMinutes: 10,

  // === BALL ===
  ballSize: 14,
  ballSpeedInitial: 5,
  ballSpeedIncrement: 0.3,
  ballSpeedMax: 10,

  // === MATCH ===
  pointsToWin: 3,
  countdownSeconds: 3,
  maxDurationSeconds: 90,

  // === TOKENS ===
  tokenCostPerDuel: 1,
  rentPerToken: 20,
  maxTokens: 5,
  startingTokens: 1,

  // === ECONOMY ===
  loserConsolationPercent: 0.50,

  // === LIMITS ===
  maxDuelsPerPlayer: 2,
  duelCooldownMinutes: 10,
  challengeTimeoutSeconds: 30,

  // === NETWORKING ===
  serverTickRate: 30,
  clientTickRate: 60,
};

module.exports = { PONG_CONFIG };

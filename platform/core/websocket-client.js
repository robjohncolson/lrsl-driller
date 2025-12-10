/**
 * WebSocket Client - Real-time presence and notifications
 */

import { getAvatarForUsername } from './user-system.js';
import { celebration } from './celebration.js';
import { soundEngine } from './sound-engine.js';

export class WebSocketClient {
  constructor(config = {}) {
    this.serverUrl = config.serverUrl || null;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.heartbeatInterval = null;
    this.onlineUsers = [];

    // Callbacks
    this.onPresenceChange = config.onPresenceChange || (() => {});
    this.onStarEarned = config.onStarEarned || (() => {});
    this.onClassTimeStart = config.onClassTimeStart || (() => {});
    this.onClassTimeEnd = config.onClassTimeEnd || (() => {});
    this.onLeaderboardUpdate = config.onLeaderboardUpdate || (() => {});
    this.onConnectionChange = config.onConnectionChange || (() => {});

    this.currentUsername = null;
  }

  get wsUrl() {
    if (!this.serverUrl) return null;
    return this.serverUrl.replace('https://', 'wss://').replace('http://', 'ws://');
  }

  /**
   * Connect to WebSocket server
   */
  connect(username) {
    if (!this.wsUrl) return;
    if (this.ws) return;

    this.currentUsername = username;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Identify ourselves
        if (this.currentUsername) {
          this.identify(this.currentUsername);
        }

        // Start heartbeat
        this.heartbeatInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'heartbeat', username: this.currentUsername });
          }
        }, 30000);

        this.onConnectionChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (err) {
          console.warn('WebSocket message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        this.ws = null;
        clearInterval(this.heartbeatInterval);
        this.onConnectionChange(false);

        // Attempt reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(this.currentUsername), 5000 * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };
    } catch (err) {
      console.warn('WebSocket connection failed:', err);
    }
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Identify user to server
   */
  identify(username) {
    this.currentUsername = username;
    this.send({ type: 'identify', username });
  }

  /**
   * Notify server of star earned
   */
  notifyStarEarned(username, starType, scenarioTopic) {
    this.send({
      type: 'star_earned',
      username,
      star_type: starType,
      scenario_topic: scenarioTopic
    });
  }

  /**
   * Notify server of class time start (teacher only)
   */
  notifyClassTimeStart(goal) {
    this.send({
      type: 'class_time_start',
      goal
    });
  }

  /**
   * Notify server of class time end (teacher only)
   */
  notifyClassTimeEnd() {
    this.send({
      type: 'class_time_end'
    });
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'presence_snapshot':
        this.onlineUsers = message.users || [];
        this.onPresenceChange(this.onlineUsers);
        break;

      case 'user_online':
        if (!this.onlineUsers.includes(message.username)) {
          this.onlineUsers.push(message.username);
        }
        this.onPresenceChange(this.onlineUsers);
        break;

      case 'user_offline':
        this.onlineUsers = this.onlineUsers.filter(u => u !== message.username);
        this.onPresenceChange(this.onlineUsers);
        break;

      case 'star_earned':
        // Don't show notification for own stars
        if (message.username !== this.currentUsername) {
          this.showStarNotification(message.username, message.star_type, message.scenario_topic);
          this.onStarEarned(message);
        }
        break;

      case 'leaderboard_update':
        this.onLeaderboardUpdate();
        break;

      case 'class_time_start':
        this.onClassTimeStart(message.goal);
        break;

      case 'class_time_end':
        this.onClassTimeEnd();
        break;
    }
  }

  /**
   * Show notification when another user earns a star
   */
  showStarNotification(username, starType, scenarioTopic) {
    const starEmoji = {
      gold: '⭐',
      silver: '🥈',
      bronze: '🥉',
      tin: '○'
    };
    const avatar = getAvatarForUsername(username);
    const emoji = starEmoji[starType] || '⭐';

    celebration.showNotification(
      username,
      `earned a ${starType} star on "${scenarioTopic}"`,
      avatar
    );

    soundEngine.init();
    soundEngine.notification();
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    clearInterval(this.heartbeatInterval);
    this.connected = false;
  }

  /**
   * Get online user count
   */
  getOnlineCount() {
    return this.onlineUsers.length;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }
}

// Factory function for creating configured instance
export function createWebSocketClient(config) {
  return new WebSocketClient(config);
}

export default WebSocketClient;

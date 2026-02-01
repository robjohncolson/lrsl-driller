/**
 * Ghost Orbits Local Server - Electron Main Process
 *
 * Runs a local WebSocket server for LAN multiplayer matches.
 * Provides lower latency than cloud-hosted servers.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');

// Import the multiplayer manager from railway-server
const { OrbitsMultiplayerManager, MULTIPLAYER_CONFIG } = require('../railway-server/ghost-orbits-multiplayer-manager.js');

let mainWindow;
let wss;
let httpServer;
let multiplayerManager;
const WS_PORT = 3001;
const HTTP_PORT = 3002;  // Discovery endpoint

// Track connected clients
const clients = new Map();

// Get local IP addresses for LAN play
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          address: iface.address
        });
      }
    }
  }

  return addresses;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload);
    }
  }
}

function startServer() {
  // Create HTTP server for discovery
  httpServer = http.createServer((req, res) => {
    // CORS headers for browser access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/discover' || req.url === '/') {
      const localIPs = getLocalIPs();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        service: 'ghost-orbits-local-server',
        wsPort: WS_PORT,
        httpPort: HTTP_PORT,
        wsUrl: `ws://localhost:${WS_PORT}`,
        lanUrls: localIPs.map(ip => `ws://${ip.address}:${WS_PORT}`),
        localIPs: localIPs,
        clients: clients.size
      }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  httpServer.listen(HTTP_PORT, () => {
    console.log(`[Local Server] Discovery HTTP server on port ${HTTP_PORT}`);
  });

  // Create WebSocket server
  wss = new WebSocketServer({ port: WS_PORT });

  // Create multiplayer manager
  multiplayerManager = new OrbitsMultiplayerManager();

  // Set up global lobby status broadcast
  multiplayerManager.onLobbyStatusChange = (status) => {
    broadcast({
      type: 'orbits_lobby_status',
      payload: status
    });
  };

  wss.on('connection', (ws, req) => {
    const clientIP = req.socket.remoteAddress;
    clients.set(ws, { username: null, lastHeartbeat: Date.now() });

    console.log(`[Local Server] WebSocket client connected from ${clientIP} (${clients.size} total)`);

    // Send to renderer
    if (mainWindow) {
      mainWindow.webContents.send('client-count', clients.size);
      mainWindow.webContents.send('log', `Client connected from ${clientIP}`);
    }

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (err) {
        console.error('[Local Server] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      const clientData = clients.get(ws);
      clients.delete(ws);

      console.log(`[Local Server] Client disconnected (${clients.size} remaining)`);

      if (mainWindow) {
        mainWindow.webContents.send('client-count', clients.size);
        mainWindow.webContents.send('log', 'Client disconnected');
      }

      // Clean up player from any rooms
      if (clientData?.orbitsPlayerId) {
        multiplayerManager.handleDisconnect(clientData.orbitsPlayerId, ws);
      }
    });

    ws.on('error', (err) => {
      console.error('[Local Server] WebSocket error:', err);
    });
  });

  console.log(`[Local Server] WebSocket server running on port ${WS_PORT}`);

  // Send server info to renderer
  const localIPs = getLocalIPs();
  if (mainWindow) {
    mainWindow.webContents.send('server-started', {
      port: WS_PORT,
      httpPort: HTTP_PORT,
      localIPs: localIPs
    });
  }
}

function handleMessage(ws, message) {
  const { type, payload } = message;
  const client = clients.get(ws);

  let result;

  switch (type) {
    case 'identify':
      // Store username for this connection
      client.username = payload?.username || message.username;
      client.lastHeartbeat = Date.now();

      // Send presence snapshot (empty for local server)
      ws.send(JSON.stringify({
        type: 'presence_snapshot',
        users: Array.from(clients.values())
          .filter(c => c.username)
          .map(c => c.username)
      }));
      break;

    case 'orbits_quick_join':
      if (!client?.username) {
        ws.send(JSON.stringify({
          type: 'orbits_error',
          payload: { error: 'Must identify before joining' }
        }));
        break;
      }

      result = multiplayerManager.quickJoin(client.username, payload?.mode || 'arena');

      if (result.success) {
        client.orbitsPlayerId = result.playerId;
        client.orbitsRoomCode = result.roomCode;
        multiplayerManager.setPlayerWs(result.playerId, ws);

        ws.send(JSON.stringify({
          type: 'orbits_quick_joined',
          payload: {
            roomCode: result.roomCode,
            playerId: result.playerId
          }
        }));

        if (mainWindow) {
          mainWindow.webContents.send('log', `${client.username} joined game`);
        }
      } else {
        ws.send(JSON.stringify({
          type: 'orbits_error',
          payload: { error: result.error }
        }));
      }
      break;

    case 'orbits_create_room':
      if (!client?.username) {
        ws.send(JSON.stringify({
          type: 'orbits_error',
          payload: { error: 'Must identify before creating room' }
        }));
        break;
      }

      result = multiplayerManager.createRoom(client.username, payload?.mode || 'arena');

      if (result.success) {
        client.orbitsPlayerId = result.playerId;
        client.orbitsRoomCode = result.roomCode;
        multiplayerManager.setPlayerWs(result.playerId, ws);

        ws.send(JSON.stringify({
          type: 'orbits_room_created',
          payload: {
            roomCode: result.roomCode,
            playerId: result.playerId
          }
        }));

        // Send initial room state
        const room = multiplayerManager.getRoom(result.roomCode);
        if (room) {
          room._broadcastRoomState();
        }

        if (mainWindow) {
          mainWindow.webContents.send('log', `${client.username} created room ${result.roomCode}`);
        }
      } else {
        ws.send(JSON.stringify({
          type: 'orbits_error',
          payload: { error: result.error }
        }));
      }
      break;

    case 'orbits_join_room':
      if (!client?.username) {
        ws.send(JSON.stringify({
          type: 'orbits_error',
          payload: { error: 'Must identify before joining room' }
        }));
        break;
      }

      result = multiplayerManager.joinRoom(payload?.roomCode, client.username);

      if (result.success) {
        client.orbitsPlayerId = result.playerId;
        client.orbitsRoomCode = result.roomCode;
        multiplayerManager.setPlayerWs(result.playerId, ws);

        ws.send(JSON.stringify({
          type: 'orbits_room_joined',
          payload: {
            roomCode: result.roomCode,
            playerId: result.playerId
          }
        }));

        if (mainWindow) {
          mainWindow.webContents.send('log', `${client.username} joined room ${payload?.roomCode}`);
        }
      } else {
        ws.send(JSON.stringify({
          type: 'orbits_error',
          payload: { error: result.error }
        }));
      }
      break;

    case 'orbits_rejoin_room':
      result = multiplayerManager.rejoinRoom(
        payload?.roomCode,
        payload?.playerId,
        payload?.username || client?.username,
        ws
      );

      if (result.success) {
        client.orbitsPlayerId = result.playerId;
        client.orbitsRoomCode = result.roomCode;

        ws.send(JSON.stringify({
          type: 'orbits_room_rejoined',
          payload: result
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'orbits_error',
          payload: { error: result.error }
        }));
      }
      break;

    case 'orbits_add_ai':
      if (client?.orbitsPlayerId) {
        const roomCode = multiplayerManager.playerRooms.get(client.orbitsPlayerId);
        if (roomCode) {
          const room = multiplayerManager.getRoom(roomCode);
          if (room) {
            room.addAIPlayer();
            if (mainWindow) {
              mainWindow.webContents.send('log', 'AI player added');
            }
          }
        }
      }
      break;

    case 'orbits_leave_room':
      if (client?.orbitsPlayerId) {
        multiplayerManager.leaveRoom(client.orbitsPlayerId);
        client.orbitsPlayerId = null;
        client.orbitsRoomCode = null;
      }
      break;

    case 'orbits_set_ready':
      if (client?.orbitsPlayerId) {
        const roomCode = multiplayerManager.playerRooms.get(client.orbitsPlayerId);
        if (roomCode) {
          const room = multiplayerManager.getRoom(roomCode);
          if (room) {
            room.setPlayerReady(client.orbitsPlayerId, payload?.ready ?? true);
          }
        }
      }
      break;

    case 'orbits_input':
      if (client?.orbitsPlayerId) {
        const roomCode = multiplayerManager.playerRooms.get(client.orbitsPlayerId);
        if (roomCode) {
          const room = multiplayerManager.getRoom(roomCode);
          if (room) {
            room.handleInput(client.orbitsPlayerId, payload);
          }
        }
      }
      break;

    case 'orbits_vote_rematch':
      if (client?.orbitsPlayerId) {
        const roomCode = multiplayerManager.playerRooms.get(client.orbitsPlayerId);
        if (roomCode) {
          const room = multiplayerManager.getRoom(roomCode);
          if (room) {
            room.voteRematch(client.orbitsPlayerId, payload?.vote ?? true);
          }
        }
      }
      break;

    case 'heartbeat':
      client.lastHeartbeat = Date.now();
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', payload: { t: Date.now() } }));
      break;

    default:
      console.log(`[Local Server] Unknown message type: ${type}`);
  }
}

// IPC handlers
ipcMain.handle('get-server-info', () => {
  return {
    wsPort: WS_PORT,
    httpPort: HTTP_PORT,
    localIPs: getLocalIPs(),
    running: wss !== null,
    clientCount: clients.size
  };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  startServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Close servers
  if (wss) {
    wss.close();
  }
  if (httpServer) {
    httpServer.close();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

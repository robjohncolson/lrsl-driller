# Ghost Orbits Local Server

A standalone Electron application that runs a local multiplayer server for Ghost Orbits. Provides lower latency than the cloud-hosted Railway server, ideal for classroom/LAN play.

## Quick Start

### Development Mode
```bash
cd local-server
npm install
npm start
```

### Build Portable Executable
```bash
npm run build:win    # Windows portable .exe
npm run build:mac    # macOS .dmg
npm run build:linux  # Linux AppImage
```

Built executables will be in `local-server/dist/`.

## Usage

1. **Start the server** - Run the app on one computer (teacher's machine recommended)
2. **Note the IP address** - The server window shows the local network address (e.g., `192.168.1.100:3001`)
3. **Configure clients** - Students connect to the displayed address instead of the Railway server

### Client Configuration

To connect to the local server, modify the client's server URL. In `ghost-panel.js`, change the server detection:

```javascript
// For local server testing, use:
const serverUrl = 'ws://192.168.1.100:3001';  // Replace with your server's IP

// Original production code:
const serverUrl = (window.location.hostname === 'localhost'
  ? 'ws://localhost:3001'
  : 'wss://lrsl-trainer-production.up.railway.app');
```

Or add a UI toggle to switch between local and cloud servers.

## Features

- **Zero internet dependency** - Works entirely on LAN
- **Lower latency** - Direct connection to local server
- **Visual status panel** - Shows connected players and activity log
- **Same game logic** - Uses identical multiplayer manager as Railway server

## Network Requirements

- All clients must be on the same local network
- Server computer firewall must allow port 3001
- If using school network, ensure WebSocket connections are allowed

## Architecture

```
local-server/
├── main.js       # Electron main process + WebSocket server
├── preload.js    # Secure IPC bridge
├── index.html    # Server status UI
├── package.json  # Dependencies and build config
└── README.md     # This file
```

The server reuses `ghost-orbits-multiplayer-manager.js` from the Railway server to ensure identical game behavior.

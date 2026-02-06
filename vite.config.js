import { defineConfig } from 'vite'
import { resolve } from 'path'
import { cpSync, existsSync } from 'fs'

// Plugin: Local signaling WebSocket for offline/LAN mode
// Provides minimal coordination for P2P asset transfers without Railway
function localSignalingPlugin() {
  let wss = null
  const clients = new Map() // ws → { username, lastHeartbeat }
  const assetLeases = new Map()
  const assetHolders = new Map()
  const LEASE_TIMEOUT_MS = 15000

  function broadcast(message) {
    const payload = JSON.stringify(message)
    for (const [ws] of clients) {
      if (ws.readyState === 1) ws.send(payload)
    }
  }

  function sendToUser(targetUsername, message) {
    const payload = JSON.stringify(message)
    for (const [ws, data] of clients) {
      if (ws.readyState === 1 && data.username === targetUsername) {
        ws.send(payload)
        return true
      }
    }
    return false
  }

  function getOnlineUsers() {
    const users = []
    for (const [, data] of clients) {
      if (data.username) users.push(data.username)
    }
    return [...new Set(users)]
  }

  function handleMessage(ws, message) {
    const client = clients.get(ws)
    switch (message.type) {
      case 'identify':
        clients.set(ws, { username: message.username, lastHeartbeat: Date.now() })
        if (message.username) {
          broadcast({ type: 'user_online', username: message.username })
        }
        ws.send(JSON.stringify({ type: 'presence_snapshot', users: getOnlineUsers() }))
        break

      case 'heartbeat':
        if (client) client.lastHeartbeat = Date.now()
        break

      case 'asset_need': {
        if (!client?.username || !message.fileKey) break
        const holders = assetHolders.get(message.fileKey)
        if (holders && holders.size > 0) {
          const peers = [...holders].filter(u => u !== client.username)
          if (peers.length > 0) {
            ws.send(JSON.stringify({ type: 'asset_available', fileKey: message.fileKey, peers }))
            break
          }
        }
        const lease = assetLeases.get(message.fileKey)
        if (lease && lease.leaseExpiry > Date.now()) {
          lease.waitQueue.push({ ws, username: client.username })
          ws.send(JSON.stringify({ type: 'asset_queued', fileKey: message.fileKey, position: lease.waitQueue.length }))
          break
        }
        assetLeases.set(message.fileKey, { assignee: client.username, leaseExpiry: Date.now() + LEASE_TIMEOUT_MS, waitQueue: [] })
        ws.send(JSON.stringify({ type: 'asset_fetch_assigned', fileKey: message.fileKey }))
        break
      }

      case 'asset_have': {
        if (!client?.username || !message.fileKey) break
        if (!assetHolders.has(message.fileKey)) assetHolders.set(message.fileKey, new Set())
        assetHolders.get(message.fileKey).add(client.username)
        const lease = assetLeases.get(message.fileKey)
        if (lease) {
          const peers = [...(assetHolders.get(message.fileKey) || [])]
          for (const waiter of lease.waitQueue) {
            try { if (waiter.ws.readyState === 1) waiter.ws.send(JSON.stringify({ type: 'asset_available', fileKey: message.fileKey, peers, hash: message.hash })) }
            catch { /* ignore */ }
          }
          assetLeases.delete(message.fileKey)
        }
        break
      }

      case 'asset_query': {
        if (!message.fileKey) break
        const holders = assetHolders.get(message.fileKey)
        ws.send(JSON.stringify({ type: 'asset_holders', fileKey: message.fileKey, peers: holders ? [...holders] : [] }))
        break
      }

      case 'p2p_asset_signal': {
        const { targetUsername, subtype, payload } = message
        if (!targetUsername || !subtype) break
        sendToUser(targetUsername, {
          type: 'p2p_asset_signal',
          subtype,
          fromUsername: client?.username,
          targetUsername,
          payload
        })
        break
      }
    }
  }

  return {
    name: 'local-signaling',
    async configureServer(server) {
      const { WebSocketServer } = await import('ws')
      wss = new WebSocketServer({ noServer: true })

      server.httpServer?.on('upgrade', (request, socket, head) => {
        if (request.url === '/ws-signaling') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
          })
        }
      })

      wss.on('connection', (ws) => {
        clients.set(ws, { username: null, lastHeartbeat: Date.now() })
        console.log('[Local Signaling] Client connected')

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString())
            handleMessage(ws, message)
          } catch (err) {
            console.warn('[Local Signaling] Message parse error:', err)
          }
        })

        ws.on('close', () => {
          const client = clients.get(ws)
          if (client?.username) {
            // Remove from asset holders
            for (const [fileKey, holders] of assetHolders) {
              holders.delete(client.username)
              if (holders.size === 0) assetHolders.delete(fileKey)
            }
            broadcast({ type: 'user_offline', username: client.username })
          }
          clients.delete(ws)
          console.log('[Local Signaling] Client disconnected')
        })
      })

      // Stale connection cleanup
      setInterval(() => {
        const now = Date.now()
        for (const [ws, data] of clients) {
          if (now - data.lastHeartbeat > 300000) {
            ws.terminate()
            clients.delete(ws)
          }
        }
        // Lease expiry
        for (const [fileKey, lease] of assetLeases) {
          if (lease.leaseExpiry <= now) {
            const next = lease.waitQueue.shift()
            if (next && next.ws.readyState === 1) {
              assetLeases.set(fileKey, { assignee: next.username, leaseExpiry: now + LEASE_TIMEOUT_MS, waitQueue: lease.waitQueue })
              next.ws.send(JSON.stringify({ type: 'asset_fetch_assigned', fileKey }))
            } else {
              assetLeases.delete(fileKey)
            }
          }
        }
      }, 60000)

      console.log('[Local Signaling] WebSocket server attached at /ws-signaling')
    }
  }
}

// Plugin to copy runtime assets (cartridges) to dist
function copyRuntimeAssets() {
  return {
    name: 'copy-runtime-assets',
    closeBundle() {
      const assetsToCopy = ['cartridges', 'audio']
      for (const dir of assetsToCopy) {
        if (existsSync(dir)) {
          cpSync(dir, `dist/${dir}`, { recursive: true })
          console.log(`Copied ${dir}/ to dist/${dir}/`)
        }
      }
    }
  }
}

export default defineConfig({
  // Multi-page app setup - each HTML file is an entry point
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        app: 'platform/app.html'
      }
    }
  },
  plugins: [localSignalingPlugin(), copyRuntimeAssets()],
  // Dev server config
  server: {
    open: '/platform/app.html'
  }
})

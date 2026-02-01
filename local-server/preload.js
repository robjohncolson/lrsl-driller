/**
 * Ghost Orbits Local Server - Preload Script
 *
 * Securely exposes IPC channels to the renderer process.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serverAPI', {
  // Get server information
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),

  // Listen for server events
  onServerStarted: (callback) => {
    ipcRenderer.on('server-started', (event, data) => callback(data));
  },

  onClientCount: (callback) => {
    ipcRenderer.on('client-count', (event, count) => callback(count));
  },

  onLog: (callback) => {
    ipcRenderer.on('log', (event, message) => callback(message));
  }
});

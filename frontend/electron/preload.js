// Quantum GST Desktop Bridge Preload
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('quantumDesktop', {
  platform: process.platform,
  version: '1.0.0',
});


const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (content, filename) => ipcRenderer.invoke('save-file', content, filename),
  openFile: () => ipcRenderer.invoke('open-file'),

  // Menu event listeners
  onMenuEvent: (callback) => {
    ipcRenderer.on('menu-new-blog-post', callback);
    ipcRenderer.on('menu-save', callback);
    ipcRenderer.on('menu-export-markdown', callback);
    ipcRenderer.on('menu-export-html', callback);
    ipcRenderer.on('menu-ai-generate', callback);
    ipcRenderer.on('menu-ai-improve', callback);
    ipcRenderer.on('menu-ai-settings', callback);
  },

  // Remove menu event listeners
  removeMenuListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-blog-post');
    ipcRenderer.removeAllListeners('menu-save');
    ipcRenderer.removeAllListeners('menu-export-markdown');
    ipcRenderer.removeAllListeners('menu-export-html');
    ipcRenderer.removeAllListeners('menu-ai-generate');
    ipcRenderer.removeAllListeners('menu-ai-improve');
    ipcRenderer.removeAllListeners('menu-ai-settings');
  },

  // App info
  isElectron: true,
  platform: process.platform
});

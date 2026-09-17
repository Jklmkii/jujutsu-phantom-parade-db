const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  getAppVersion: () =>
    ipcRenderer.invoke('app:getVersion'),

  saveFile: (defaultName, content, filters) =>
    ipcRenderer.invoke('dialog:saveFile', { defaultName, content, filters }),

  openFile: (filters) =>
    ipcRenderer.invoke('dialog:openFile', { filters }),

  checkForUpdates: () =>
    ipcRenderer.invoke('updater:check'),

  installUpdate: () =>
    ipcRenderer.invoke('updater:install'),

  onUpdateStatus: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('updater:status', subscription);
    return () => ipcRenderer.removeListener('updater:status', subscription);
  },
});

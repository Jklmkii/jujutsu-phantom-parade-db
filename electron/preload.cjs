const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  saveFile: (defaultName, content, filters) =>
    ipcRenderer.invoke('dialog:saveFile', { defaultName, content, filters }),

  openFile: (filters) =>
    ipcRenderer.invoke('dialog:openFile', { filters }),
});

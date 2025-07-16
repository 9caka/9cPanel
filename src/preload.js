const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchProject: (payload) => ipcRenderer.send('launch-project', payload),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  saveItems: (payload) => ipcRenderer.send('save-items', payload),
  onSaveSuccess: (callback) => ipcRenderer.on('save-success', callback),
  onSaveError: (callback) => ipcRenderer.on('save-error', callback),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openDialog: (options) => ipcRenderer.invoke('dialog:open', options),
  onSystemStats: (callback) => ipcRenderer.on('system-stats', (event, ...args) => callback(...args)),
  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
  getProjectDetails: (projectPath) => ipcRenderer.invoke('get-project-details', projectPath),
  projectAction: (payload) => ipcRenderer.send('project-action', payload),
  onLaunchSuccess: (callback) => ipcRenderer.on('launch-success', (event, ...args) => callback(...args)),
  gitCommand: (payload) => ipcRenderer.invoke('git:command', payload),
});
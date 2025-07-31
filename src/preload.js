const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Fonctions de fenêtre
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // Fonctions de fichiers et dialogues
  saveItems: (payload) => ipcRenderer.send('save-items', payload),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openDialog: (options) => ipcRenderer.invoke('dialog:open', options),
  
  // Utilitaires
  onSystemStats: (callback) => ipcRenderer.on('system-stats', (event, ...args) => callback(...args)),
  openExternalLink: (url) => ipcRenderer.send('open-external-link', url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Logique "Projets Dev"
  getProjectDetails: (projectPath) => ipcRenderer.invoke('get-project-details', projectPath),
  projectAction: (payload) => ipcRenderer.send('project-action', payload),
  launchProject: (payload) => ipcRenderer.send('launch-project', payload),
  runNpmScript: (payload) => ipcRenderer.send('run-npm-script', payload),
  projectsGetPinned: () => ipcRenderer.invoke('projects:get-pinned'),
  projectsSetPinned: (pinned) => ipcRenderer.invoke('projects:set-pinned', pinned),
  
  // Commandes Git & Docker
  gitCommand: (payload) => ipcRenderer.invoke('git:command', payload),
  dockerCommand: (payload) => ipcRenderer.invoke('docker:command', payload),

  // Base de données, RSS, .env
  dbConnect: (filePath) => ipcRenderer.invoke('db:connect', filePath),
  dbQuery: (payload) => ipcRenderer.invoke('db:query', payload),
  dbClose: (filePath) => ipcRenderer.send('db:close', filePath),
  fetchRss: (url) => ipcRenderer.invoke('fetch-rss', url),
  envGetProjects: () => ipcRenderer.invoke('env:get-projects'),
  envRead: (projectPath) => ipcRenderer.invoke('env:read', projectPath),
  envSave: (payload) => ipcRenderer.invoke('env:save', payload),

  // Détection des jeux
  steamGetOwnedGames: () => ipcRenderer.invoke('steam:get-owned-games'),
  steamGetInstalledApps: () => ipcRenderer.invoke('steam:get-installed-apps'),
  gamesGetEpicGames: () => ipcRenderer.invoke('games:get-epic-games'),
  gamesGetUbisoftGames: () => ipcRenderer.invoke('games:get-ubisoft-games'),
  gamesGetXboxGames: () => ipcRenderer.invoke('games:get-xbox-games'),
  
  // Lancement des jeux
  steamLaunchGame: (appId) => ipcRenderer.send('steam:launch-game', appId),
  epicLaunchGame: (appName) => ipcRenderer.send('epic:launch-game', appName),
  ubisoftLaunchGame: (gameId) => ipcRenderer.send('ubisoft:launch-game', gameId),
  xboxLaunchGame: (appId) => ipcRenderer.send('xbox:launch-game', appId),

  // Détails des jeux
  steamGetGameDetails: (appid) => ipcRenderer.invoke('steam:get-game-details', appid),
  steamGetPlayerAchievements: (appid) => ipcRenderer.invoke('steam:get-player-achievements', appid),
  gamesGetRawgAchievements: (rawgId) => ipcRenderer.invoke('games:get-rawg-achievements', rawgId),
  gamesGetRawgDetails: (rawgId) => ipcRenderer.invoke('games:get-rawg-details', rawgId),
  gamesGetRecentlyPlayed: () => ipcRenderer.invoke('games:get-recently-played'),
  gamesRecordLaunch: (game) => ipcRenderer.invoke('games:record-launch', game),
  
  // Paramètres
  getLaunchOnStartup: () => ipcRenderer.invoke('get-launch-on-startup'),
  setLaunchOnStartup: (shouldLaunch) => ipcRenderer.send('set-launch-on-startup', shouldLaunch),
  
  // Mises à jour
  onUpdateInfo: (callback) => ipcRenderer.on('update-info', (event, ...args) => callback(...args)),
  onUpdateDownloadProgress: (callback) => ipcRenderer.on('update-download-progress', (event, ...args) => callback(...args)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  restartApp: () => ipcRenderer.send('restart-app'),
});
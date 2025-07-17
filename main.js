const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;
const os = require('os-utils');
const sqlite3 = require('sqlite3').verbose();
const si = require('systeminformation');
const Parser = require('rss-parser');
const parser = new Parser();

const openDatabases = new Map();

const execPromise = (command, options) => new Promise((resolve, reject) => {
    const env = { ...process.env };
    if (process.platform === 'win32') {
        const dockerPath = 'C:\\Program Files\\Docker\\Docker\\resources\\bin';
        const gitPath = 'C:\\Program Files\\Git\\cmd';
        env.PATH = `${env.PATH};${dockerPath};${gitPath}`;
    }

    const execOptions = { ...options, env };

    exec(command, execOptions, (err, stdout, stderr) => {
        if (err) {
            console.error(`Erreur pour la commande "${command}": ${stderr}`);
            reject(stderr || err.message);
            return;
        }
        resolve(stdout.trim());
    });
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#111827',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  setInterval(() => {
    Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats()
    ]).then(([cpuData, memData, diskData, netData]) => {
        const mainDisk = diskData.find(d => d.mount === 'C:' || d.mount === '/');
        const totalNet = netData.reduce((acc, iface) => {
            acc.rx_sec += iface.rx_sec;
            acc.tx_sec += iface.tx_sec;
            return acc;
        }, { rx_sec: 0, tx_sec: 0 });

        mainWindow.webContents.send('system-stats', {
            cpu: cpuData.currentLoad,
            mem: memData.active / memData.total * 100,
            disk: mainDisk ? mainDisk.use : 0,
            net: {
                upload: totalNet.tx_sec,
                download: totalNet.rx_sec
            }
        });
    }).catch(error => console.error('Erreur de stats système:', error));
  }, 2000);

  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => { if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
  ipcMain.on('window:close', () => mainWindow.close());
}

app.whenReady().then(() => {
    createWindow();
});
app.on('window-all-closed', () => {
    for (const db of openDatabases.values()) {
        db.close();
    }
    if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('fetch-rss', async (event, feedUrl) => {
    try {
        const feed = await parser.parseURL(feedUrl);
        return { success: true, feed: feed };
    } catch (error) {
        console.error(`Erreur de récupération du flux RSS ${feedUrl}:`, error);
        return { success: false, error: error.message };
    }
});

ipcMain.on('open-external-link', (event, url) => shell.openExternal(url));

ipcMain.handle('dialog:open', async (event, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(options);
  return canceled ? null : filePaths[0];
});

ipcMain.on('project-action', (event, { action, path: projectPath }) => {
    if (!projectPath) return;
    switch (action) {
        case 'open-explorer':
            shell.openPath(projectPath).catch(err => console.error("Failed to open path:", err));
            break;
        case 'open-terminal':
            exec('start cmd', { cwd: projectPath });
            break;
    }
});

ipcMain.on('run-npm-script', (event, { projectPath, script }) => {
    if (!projectPath || !script) return;
    exec(`start cmd /k npm run ${script}`, { cwd: projectPath });
});

ipcMain.handle('git:command', async (event, { command, path: projectPath }) => {
    if (!projectPath) return { success: false, message: 'Chemin du projet non fourni.' };
    try {
        const stdout = await execPromise(`git ${command}`, { cwd: projectPath });
        return { success: true, message: stdout || `Commande "git ${command}" réussie.` };
    } catch (error) {
        return { success: false, message: error.toString() };
    }
});

ipcMain.handle('get-project-details', async (event, projectPath) => {
    const details = { branch: null, dependencies: null, hasChanges: false, scripts: null, github: null };
    if (!projectPath) return details;

    try {
        details.branch = await execPromise('git branch --show-current', { cwd: projectPath }).catch(() => null);
        const gitStatus = await execPromise('git status --porcelain', { cwd: projectPath }).catch(() => '');
        details.hasChanges = gitStatus !== '';
        
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(packageJsonContent);
            const deps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
            details.dependencies = Object.keys(deps).length;
            details.scripts = packageJson.scripts || null;
        } catch (e) {
            details.dependencies = null;
            details.scripts = null;
        }

        if (details.branch) {
            const settingsPath = path.join(__dirname, 'src/data/settings.json');
            const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8').catch(() => '{}'));
            
            if (settings.githubToken) {
                const { Octokit } = await import('@octokit/rest');
                const octokit = new Octokit({ auth: settings.githubToken });
                const remoteUrl = await execPromise('git config --get remote.origin.url', { cwd: projectPath }).catch(() => null);
                
                if (remoteUrl) {
                    const match = remoteUrl.match(/(?:https?:\/\/|git@)github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
                    if (match) {
                        const owner = match[1];
                        const repo = match[2];

                        const [prs, issues] = await Promise.all([
                            octokit.pulls.list({ owner, repo, state: 'open' }),
                            octokit.issues.listForRepo({ owner, repo, state: 'open', pull_request: false })
                        ]);
                        
                        details.github = {
                            prs: prs.data.length,
                            issues: issues.data.length
                        };
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération des détails pour ${projectPath}:`, error);
    }
    return details;
});

ipcMain.handle('docker:command', async (event, { action, id }) => {
  console.log(`[Docker] Received command: ${action}` + (id ? ` for ID: ${id}` : ''));
  
  let command;
  switch (action) {
    case 'list':
      command = 'docker ps -a --format "{{json .}}"';
      break;
    case 'start':
      command = `docker start ${id}`;
      break;
    case 'stop':
      command = `docker stop ${id}`;
      break;
    case 'remove':
      command = `docker rm ${id}`;
      break;
    default:
      return { success: false, error: 'Action Docker inconnue' };
  }

  try {
    const output = await execPromise(command);
    
    if (action === 'list') {
        const containers = output
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => JSON.parse(line));
        return { success: true, data: containers };
    }

    return { success: true, data: output };
  } catch (error) {
    console.error(`[Docker] Erreur pour la commande "${command}":`, error.toString());
    return { success: false, error: error.toString() };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    const data = await fs.readFile(fullPath, 'utf-8');
    if (!filePath.endsWith('.json')) return data;
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const isJson = filePath.endsWith('.json');
      const defaultContent = isJson ? (filePath.includes('settings.json') ? '{}' : '[]') : '';
      await fs.writeFile(path.join(__dirname, filePath), defaultContent, 'utf-8');
      return isJson ? JSON.parse(defaultContent) : defaultContent;
    }
    return null;
  }
});

ipcMain.on('save-items', async (event, { filePath, data }) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Erreur de sauvegarde pour ${filePath}:`, err);
  }
});

ipcMain.on('launch-project', (event, {commands, name}) => {
  commands.forEach(command => {
    exec(command, (error) => { if (error) console.error(`Erreur d'exécution pour "${command}": ${error.message}`); });
  });
});

ipcMain.handle('db:connect', (event, filePath) => {
    return new Promise((resolve, reject) => {
        if (openDatabases.has(filePath)) {
        }
        const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error(err.message);
                return reject({ success: false, error: err.message });
            }
            console.log(`Connecté à la base de données SQLite: ${filePath}`);
            openDatabases.set(filePath, db);
        });

        db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, tables) => {
            if (err) {
                return reject({ success: false, error: err.message });
            }
            resolve({ success: true, tables: tables.map(t => t.name) });
        });
    });
});

ipcMain.handle('db:query', (event, { filePath, query }) => {
    return new Promise((resolve, reject) => {
        const db = openDatabases.get(filePath);
        if (!db) {
            return reject({ success: false, error: "Base de données non connectée." });
        }

        db.all(query, [], (err, rows) => {
            if (err) {
                return reject({ success: false, error: err.message });
            }
            resolve({ success: true, data: rows });
        });
    });
});

ipcMain.on('db:close', (event, filePath) => {
    const db = openDatabases.get(filePath);
    if (db) {
        db.close((err) => {
            if (err) return console.error(err.message);
            openDatabases.delete(filePath);
            console.log(`Connexion à ${filePath} fermée.`);
        });
    }
});
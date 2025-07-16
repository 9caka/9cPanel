const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs').promises;
const os = require('os-utils');

const execPromise = (command, options) => new Promise((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
        if (err) {
            console.error(`Erreur pour la commande "${command}": ${stderr}`);
            reject(stderr);
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
    os.cpuUsage(function(v){
      mainWindow.webContents.send('system-stats', {
        cpu: v * 100,
        mem: (1 - os.freememPercentage()) * 100,
      });
    });
  }, 2000);

  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => { if (mainWindow.isMaximized()) mainWindow.unmaximize(); else mainWindow.maximize(); });
  ipcMain.on('window:close', () => mainWindow.close());
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

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
    const details = { branch: null, dependencies: null, hasChanges: false };
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
        } catch (e) {
            details.dependencies = null;
        }

    } catch (error) {
        console.error(`Erreur lors de la récupération des détails pour ${projectPath}:`, error);
    }
    return details;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const fullPath = path.join(__dirname, filePath);
    const data = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const defaultContent = filePath.includes('settings.json') ? '{}' : '[]';
      await fs.writeFile(path.join(__dirname, filePath), defaultContent, 'utf-8');
      return JSON.parse(defaultContent);
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
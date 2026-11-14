const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow = null;
let serverProcess = null;

// Determine base path (works both in dev and packaged app)
const APP_DIR = path.join(__dirname);
const PORT = 3001;

// Enforce single instance to prevent SQLite database corruption from multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('[Electron] Another instance is already running. Quitting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus existing window if user attempts to launch second instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 820,
      minWidth: 1024,
      minHeight: 600,
      autoHideMenuBar: true,
      title: 'Dairy Farm ERP - Windows Desktop',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      show: false,
    });

    // Show loading screen while backend initializes
    mainWindow.loadFile(path.join(APP_DIR, 'public', 'loading.html'));
    mainWindow.show();

    // Poll backend health check until it responds
    let retries = 0;
    const checkServer = () => {
      const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
        if (res.statusCode === 200) {
          mainWindow.loadURL(`http://localhost:${PORT}`);
        } else {
          retries++;
          if (retries < 60) setTimeout(checkServer, 1000);
        }
      });
      req.on('error', () => {
        retries++;
        if (retries < 60) setTimeout(checkServer, 1000);
      });
      req.end();
    };

    setTimeout(checkServer, 1500);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  function killServerProcess() {
    if (serverProcess && !serverProcess.killed) {
      try {
        if (process.platform === 'win32' && serverProcess.pid) {
          spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t']);
        } else {
          serverProcess.kill();
        }
      } catch (err) {
        console.error('[Electron] Error terminating server process:', err);
      }
    }
  }

  app.on('ready', () => {
    const tsxCli = path.join(APP_DIR, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const serverFile = path.join(APP_DIR, 'server.ts');

    // Start backend server using Electron's built-in Node runtime
    serverProcess = spawn(process.execPath, [tsxCli, serverFile], {
      cwd: APP_DIR,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: 'production',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (d) => console.log('[Server]', d.toString().trim()));
    serverProcess.stderr.on('data', (d) => console.error('[Server Error]', d.toString().trim()));

    serverProcess.on('exit', (code) => {
      console.log(`[Server] Exited with code ${code}`);
    });

    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    killServerProcess();
  });

  app.on('quit', () => {
    killServerProcess();
  });
}

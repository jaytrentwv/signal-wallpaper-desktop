'use strict';

const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

let mainWindow;
let localServer;
let localOrigin;

const APP_ROOT = path.join(__dirname, 'app');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function safeAssetPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const resolved = path.resolve(APP_ROOT, relative);
  const rootWithSep = APP_ROOT.endsWith(path.sep) ? APP_ROOT : APP_ROOT + path.sep;
  if (resolved !== APP_ROOT && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

function startLocalServer() {
  return new Promise((resolve, reject) => {
    localServer = http.createServer((req, res) => {
      const assetPath = safeAssetPath(req.url || '/');
      if (!assetPath) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      fs.stat(assetPath, (statErr, stat) => {
        if (statErr || !stat.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found');
          return;
        }

        const ext = path.extname(assetPath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Resource-Policy': 'same-origin'
        });
        fs.createReadStream(assetPath).pipe(res);
      });
    });

    localServer.once('error', reject);
    localServer.listen(0, '127.0.0.1', () => {
      const address = localServer.address();
      localOrigin = `http://127.0.0.1:${address.port}`;
      resolve(localOrigin);
    });
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open Image…', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('desktop-open-image') },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'SIGNAL/WALLPAPER Website',
          click: () => shell.openExternal('https://pwnhacker.com/majorjoker/live-wallpaper-generator.html')
        },
        {
          label: 'pwnhacker.com',
          click: () => shell.openExternal('https://pwnhacker.com/')
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 980,
    minWidth: 980,
    minHeight: 720,
    backgroundColor: '#0a0b0a',
    title: 'SIGNAL/WALLPAPER',
    icon: process.platform === 'win32' ? path.join(__dirname, 'build', 'icon.ico') : path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: false,
      navigateOnDragDrop: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(localOrigin)) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  await mainWindow.loadURL(`${localOrigin}/index.html`);
}

ipcMain.handle('desktop:save-file', async (_event, payload) => {
  if (!payload || typeof payload.fileName !== 'string' || !payload.data) {
    throw new Error('Invalid save request.');
  }

  const safeName = path.basename(payload.fileName).replace(/[<>:"/\\|?*]/g, '_');
  const ext = path.extname(safeName).toLowerCase();
  const filters = ext === '.mp4'
    ? [{ name: 'MP4 Video', extensions: ['mp4'] }]
    : ext === '.webm'
      ? [{ name: 'WebM Video', extensions: ['webm'] }]
      : [{ name: 'Video', extensions: ['mp4', 'webm'] }];

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Live Wallpaper',
    defaultPath: path.join(app.getPath('videos'), safeName),
    filters
  });

  if (result.canceled || !result.filePath) return { canceled: true };

  const buffer = Buffer.from(payload.data);
  await fs.promises.writeFile(result.filePath, buffer);
  return { canceled: false, filePath: result.filePath };
});

ipcMain.handle('desktop:open-image-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose Source Image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

app.setName('SIGNAL Wallpaper');

app.whenReady().then(async () => {
  await startLocalServer();
  buildMenu();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
}).catch((error) => {
  dialog.showErrorBox('SIGNAL Wallpaper failed to start', error.stack || String(error));
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (localServer) localServer.close();
});

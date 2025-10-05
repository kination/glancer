const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../dist/preload.js'),
    },
  });

  mainWindow.loadURL('http://localhost:5173'); // Vite dev server

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Tray (상단 아이콘)
  tray = new Tray(path.join(__dirname, 'icon-template.png')); // mac용 아이콘
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Exit',
      click: () => app.quit(),
    },
  ]);
  tray.setToolTip('My Electron App');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // macOS에서는 명시적 종료 전까진 앱 유지
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

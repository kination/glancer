const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("node:child_process");
const axios = require('axios');
// const { authorize } = require("./utils/auth.js");
// const { listEmails } = require("./gmail.js");

// process.env.DIST = path.join(__dirname, '../dist'); // This is not needed with Vite plugin

let mainWindow;
let tray = null;

const contextMenu = Menu.buildFromTemplate([
  {
    label: 'Exit',
    click: () => app.quit(),
  },
]);

// child process for python
let pythonProcess = null;

function createPythonProcess() {
  const isDev = !app.isPackaged;

  let scriptPath;
  let processArgs = [];

  if (isDev) {
    console.log("Run dev mode")
    const pythonExecutable = process.platform === 'win32' ? 'python.exe' : 'python';
    scriptPath = path.resolve(__dirname, '..', '..', 'backend', '.venv', 'bin', pythonExecutable);
    processArgs = [path.join(__dirname, '..', '..', 'backend', 'app.py')];
    pythonProcess = spawn(scriptPath, processArgs);
  } else {
    // Use package file generated with pyinstaller
    const executableName = process.platform === 'win32' ? 'backend_server.exe' : 'backend_server';
    scriptPath = path.join(process.resourcesPath, executableName);
    pythonProcess = spawn(scriptPath);
  }

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

// Send chat message to backend
async function handleChatWithLLM(event, prompt) {
  try {
    const response = await axios.post('http://127.0.0.1:5001/api/chat', {
      prompt: prompt,
    });
    return response.data;
  } catch (error) {
    console.error('Error communicating with Python LLM backend:', error);
    return { error: error.message || 'Failed to connect to backend' };
  }
}

// async function fetchAndLogEmails() {
//   const auth = await authorize();
//   const emails = await listEmails(auth);
//   console.table(emails);
// }

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Hide for "ready-to-show" event
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const imagePath = path.join(__dirname, '..', 'assets', 'iconTemplate.png')
  const originalImage = nativeImage.createFromPath(imagePath);

  // Resize the image to a specific width and height
  const resizedImage = originalImage.resize({ width: 16, height: 16 });
  tray = new Tray(resizedImage);

  tray.setToolTip('My Electron App');
  // tray.setTemplateImage(true)
  tray.setContextMenu(contextMenu);
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(async() => {
  app.dock.setIcon(path.join(__dirname, '../../electron', 'assets', 'dock-icon.png')) 
  createPythonProcess(); // run python process
  ipcMain.handle('chat-llm', handleChatWithLLM); // IPC handler
  createWindow();
  // await fetchAndLogEmails();

  app.on('activate', () => {
    // Create window if not exists when click dock image at macOS
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('quit', () => {
  // Shutdown python process when quit
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('window-all-closed', () => {
  // keep application until quit at macOS
  if (process.platform !== 'darwin') app.quit();
});

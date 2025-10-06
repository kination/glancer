import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
// import { authorize } from "./utils/auth.js";
// import { listEmails } from "./gmail.js";
import { spawn } from "node:child_process";
import axios from 'axios';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DIST = path.join(__dirname, '../dist');

let mainWindow;
let tray = null;

const contextMenu = Menu.buildFromTemplate([
  {
    label: 'Exit',
    click: () => app.quit(),
  },
]);

// Python 자식 프로세스를 저장할 변수
let pythonProcess = null;

function createPythonProcess() {
  // PyInstaller로 빌드된 실행 파일을 사용하도록 경로를 설정합니다.
  // electron-forge를 사용한다고 가정하고 extraResource 경로를 사용합니다.
  const isDev = !app.isPackaged; // 개발 모드인지 확인

  let scriptPath;
  let processArgs = [];

  if (isDev) {
    // 개발 모드: 가상환경의 python으로 app.py 실행
    // Windows와 macOS/Linux의 경로 차이를 고려합니다.
    const pythonExecutable = process.platform === 'win32' ? 'python.exe' : 'python';
    scriptPath = path.join(__dirname, '..', 'backend', 'venv', 'bin', pythonExecutable);
    processArgs = [path.join(__dirname, '..', 'backend', 'app.py')];
    pythonProcess = spawn(scriptPath, processArgs);
  } else {
    // 프로덕션 모드: PyInstaller로 빌드된 실행 파일 실행
    const executableName = process.platform === 'win32' ? 'backend_server.exe' : 'backend_server';
    // extraResource로 패키징 시 process.resourcesPath에 위치합니다.
    scriptPath = path.join(process.resourcesPath, 'backend', 'dist', executableName);
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

// LLM에 채팅 메시지를 보내는 IPC 핸들러
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
    show: false, // Ready-to-show 이벤트를 위해 초기에 숨김
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Vite 개발 서버 URL 또는 빌드된 HTML 파일 로드
  if (import.meta.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(import.meta.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Tray (상단 아이콘)
  const imagePath = path.join(__dirname, 'assets', 'iconTemplate.png') // 경로 예시
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
  createPythonProcess(); // Python 프로세스 시작
  ipcMain.handle('chat-llm', handleChatWithLLM); // IPC 핸들러 등록
  createWindow();
  // await fetchAndLogEmails();

  app.on('activate', () => {
    // macOS에서 독 아이콘을 클릭했을 때 창이 없으면 새로 생성
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('quit', () => {
  // 앱 종료 시 Python 프로세스도 함께 종료
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('window-all-closed', () => {
  // macOS에서는 명시적 종료 전까진 앱 유지
  if (process.platform !== 'darwin') app.quit();
});

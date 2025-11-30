import fs from "fs";
import path from "path";
import { app, BrowserWindow, ipcMain } from "electron";
import open from "open";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const TOKEN_PATH = path.join(app.getPath("userData"), "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "../credentials.json");

export async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // 기존 토큰 있으면 사용
  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    return oAuth2Client;
  }

  // 인증 요청
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  await open(authUrl);

  const code = await new Promise((resolve) => {
    const inputWindow = new BrowserWindow({
      width: 400,
      height: 200,
      webPreferences: { nodeIntegration: true },
    });
    inputWindow.loadURL(
      `data:text/html,
        <h3>Paste your Google Auth code:</h3>
        <input id="code" style="width:80%;padding:8px;margin-bottom:8px;" />
        <button onclick="require('electron').ipcRenderer.send('code', document.getElementById('code').value)">Submit</button>`
    );

    ipcMain.once("code", (event, code) => {
      inputWindow.close();
      resolve(code);
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  return oAuth2Client;
}

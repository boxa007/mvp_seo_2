import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import unhandled from 'electron-unhandled';
import { fileURLToPath } from 'url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let scriptProcess = null;

// for handled error
unhandled({
    logger: () => {
        console.error();
    },
    showDialog: true,
    reportButton: (error) => {
        console.log('Report Button Initialized');
    }
});

ipcMain.on("error", (event, content) => {
  unhandled.logError(Error, {
    title: content,
  })
});

ipcMain.on("start-program", (event, content) => {
  // https://docs.google.com/spreadsheets/d/1zqsKpw2XtEKapWSTL9zlQvifjIFKWwVXV2omt5hfnHs/edit?usp=sharing
  // socks5://cirorlpc-rotate:cgb4ex8hg8dl@p.webshare.io:80
  const script = path.format({dir: __dirname, base: 'main.js'});
  scriptProcess = spawn(process.execPath, [script], {
    cwd: __dirname,
    env: {
      API_TOKEN: content.octoApi,
      PROFILE_DEBUG: content.headless,
      LOOP: content.loop,
      PROXIES: content.proxies,
      GOOGLE_SHEET_ID: content.sheetUrl,
      NUM_THREADS: content.threads,
      API_CAPMONSTER: content.capmonsterApi,
      DB_HOST: content.dbHost,
      DB_PORT: content.dbPort,
      DB_USERNAME: content.dbUsername,
      DB_PASSWORD: content.dbPassword,
      DB_DATABASE: content.dbDatabase,
    },
    stdio: 'inherit'
  }).on('error', (error) => {
    console.log(error);
  });
})

ipcMain.on("import-data", (event, content) => {
  const script = path.format({dir: __dirname, base: 'import-data.js'});
  spawn(process.execPath, [script], {
    cwd: __dirname,
    env: {
      API_TOKEN: content.octoApi,
      PROFILE_DEBUG: content.headless,
      LOOP: content.loop,
      PROXIES: content.proxies,
      GOOGLE_SHEET_ID: content.sheetUrl,
      NUM_THREADS: content.threads,
      API_CAPMONSTER: content.capmonsterApi,
      DB_HOST: content.dbHost,
      DB_PORT: content.dbPort,
      DB_USERNAME: content.dbUsername,
      DB_PASSWORD: content.dbPassword,
      DB_DATABASE: content.dbDatabase,
    },
    stdio: 'inherit'
  }).on('error', (error) => {
    console.log(error);
  }).on("close", () => {
    console.log("Finished import");
  });
});

ipcMain.on("stop-programm", (event) => {
  if(scriptProcess) {
    scriptProcess.kill();
    scriptProcess = null;
  }
});

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 750,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'front/preload.mjs'),
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'front/public/index.html'))
}

app.on('ready', createWindow);

const { ipcRenderer } = require("electron");
const fs = require("fs");

/**
 * Helper function for validate input data for start programm.
 */

/**
 * @param {string} sheetUrl
 * @returns {string}
 */
const validateSheetUrl = (sheetUrl) => {
  // example url: https://docs.google.com/spreadsheets/d/1zqsKpw2XtEKapWSTL9zlQvifjIFKWwVXV2omt5hfnHs/edit?usp=sharing
  if (!sheetUrl) {
    throw new Error('Sheet url must be string');
  }
  const pattern = /https:\/\/docs\.google\.com\/spreadsheets\/d\/(.*)\/.*/;
  const matched = sheetUrl.match(pattern);
  if (!matched) {
    throw new Error(`Sheet url '${sheetUrl}' is not valid`);
  }
  return matched[1];
}

/**
 * @param {string} proxyList
 * @returns {object}
 */
const validateProxyList = (proxyList) => {
  // example: socks5://cirorlpc-rotate:cgb4ex8hg8dl@p.webshare.io:80
  if (!proxyList) {
    throw new Error('Proxy list must be string');
  }

  const pattern = /(https?|socks[45]?):\/\/(.*):(.*)@(.*):(\d+)/;
  const rawProxies = proxyList.split(",");
  for (const proxy of rawProxies) {
    const proxyParts = proxy.match(pattern);
    if (!proxyParts) {
      throw new Error(`Proxy '${proxy}' is not valid`);
    }
  }
  return proxyList;
}

/**
 * @param {string} octApi
 * @returns {string}
 */
const validateApiKey = (apiKey, nameKey) => {
  if (!apiKey) {
    throw new Error(`${nameKey} must be string`);
  }
  return apiKey;
}

/**
 * @param {string} threadCount
 * @returns {number}
 */
const validateThreadCount = (threadCount) => {
  const threads = parseInt(threadCount);
  if (isNaN(threads) || threads == 0) {
    throw new Error(`Threads must be non zero or string`);
  }
  return threads;
}

/**
 * @param {string}  dbUri
 * @returns {object}
 */
const validateDBUri = (dbUri) => {
  // example: mysql://username:password@localhost:3306/database
  if (!dbUri) {
    throw new Error("DB uri must be string");
  }

  const pattern = /mysql:\/\/(.*):(.*)@(.*):(\d+)\/(.*)/;
  const uri = dbUri.match(pattern);
  if (!uri) {
    throw new Error(`Uri '${dbUri}' is not valid`);
  }

  return {
    host: uri[3],
    port: parseInt(uri[4]),
    username: uri[1],
    password: uri[2],
    database: uri[5],
  };
}

const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const importDataBtn = document.getElementById("import-data-btn");

startBtn.addEventListener("click", () => {
  const cache = {
    sheetUrl: document.getElementById("sheet-url").value,
    proxies: document.getElementById("proxy-list").value,
    octoApi: document.getElementById("octo-api").value,
    capmonsterApi: document.getElementById("capmonster-api").value,
    threads: document.getElementById("thread-count").value,
    headless: document.getElementById("headless-checkbox").checked,
    loop: document.getElementById("loop-checkbox").checked,
    dbUri: document.getElementById("db-uri").value,
  }
  fs.writeFile('./src/cache/input.json', JSON.stringify(cache), 'utf8', () => {});
  try {
    const dbCredentials = validateDBUri(document.getElementById("db-uri").value);
    const settings = {
      sheetUrl: validateSheetUrl(document.getElementById("sheet-url").value),
      proxies: validateProxyList(document.getElementById("proxy-list").value),
      octoApi: validateApiKey(document.getElementById("octo-api").value, 'Octo Api'),
      capmonsterApi: validateApiKey(document.getElementById("capmonster-api").value, 'Capmonster Api'),
      threads: validateThreadCount(document.getElementById("thread-count").value),
      headless: !document.getElementById("headless-checkbox").checked,
      loop: document.getElementById("loop-checkbox").checked,
      dbHost: dbCredentials.host,
      dbPort: dbCredentials.port,
      dbUsername: dbCredentials.username,
      dbPassword: dbCredentials.password,
      dbDatabase: dbCredentials.database,
    }
    ipcRenderer.send("start-program", settings);
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (e) {
    ipcRenderer.send("error", e.message);
  }
});

stopBtn.addEventListener("click", () => {
  ipcRenderer.send("stop-programm");
  startBtn.disabled = false;
  stopBtn.disabled = true;
});


importDataBtn.addEventListener("click", () => {
  const cache = {
    sheetUrl: document.getElementById("sheet-url").value,
    proxies: document.getElementById("proxy-list").value,
    octoApi: document.getElementById("octo-api").value,
    capmonsterApi: document.getElementById("capmonster-api").value,
    threads: document.getElementById("thread-count").value,
    headless: document.getElementById("headless-checkbox").checked,
    loop: document.getElementById("loop-checkbox").checked,
    dbUri: document.getElementById("db-uri").value,
  }
  fs.writeFile('./src/cache/input.json', JSON.stringify(cache), 'utf8', () => {});
  try {
    const dbCredentials = validateDBUri(document.getElementById("db-uri").value);
    const settings = {
      sheetUrl: validateSheetUrl(document.getElementById("sheet-url").value),
      proxies: validateProxyList(document.getElementById("proxy-list").value),
      octoApi: validateApiKey(document.getElementById("octo-api").value, 'Octo Api'),
      capmonsterApi: validateApiKey(document.getElementById("capmonster-api").value, 'Capmonster Api'),
      threads: validateThreadCount(document.getElementById("thread-count").value),
      headless: !document.getElementById("headless-checkbox").checked,
      loop: document.getElementById("loop-checkbox").checked,
      dbHost: dbCredentials.host,
      dbPort: dbCredentials.port,
      dbUsername: dbCredentials.username,
      dbPassword: dbCredentials.password,
      dbDatabase: dbCredentials.database,
    }
    ipcRenderer.send("import-data", settings);
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (e) {
    ipcRenderer.send("error", e.message);
  }
});

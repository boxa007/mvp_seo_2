import fs from 'node:fs';


document.addEventListener("DOMContentLoaded", () => {
  let cacheData = {};
  const data = fs.readFileSync('./src/cache/input.json', { encoding: 'utf8', flag: 'r' });
  try {
    cacheData = JSON.parse(data);
  } catch {}

  // pass cache sheet url
  const sheetUrlElement = document.getElementById("sheet-url");
  if (cacheData.sheetUrl) {
    sheetUrlElement.value = cacheData.sheetUrl;
  }

  // pass cache proxy list
  const proxyListElement = document.getElementById("proxy-list");
  if (cacheData.proxies) {
    proxyListElement.value = cacheData.proxies;
  }

  // pass cache octo api
  const octoApiElement = document.getElementById("octo-api");
  if (cacheData.octoApi) {
    octoApiElement.value = cacheData.octoApi;
  }

  // pass cache capmonster-api
  const capmonsterApiElement = document.getElementById("capmonster-api");
  if (cacheData.capmonsterApi) {
    capmonsterApiElement.value = cacheData.capmonsterApi;
  }

  // pass cache thread-count
  const threadsElement = document.getElementById("thread-count");
  if (cacheData.threads) {
    threadsElement.value = cacheData.threads;
  }

  // pass cache headless-checkbox
  const headlessElement = document.getElementById("headless-checkbox");
  if (cacheData.headless) {
    headlessElement.checked = cacheData.headless;
  }

  // pass cache loop-checkbox
  const loopElement = document.getElementById("loop-checkbox");
  if (cacheData.loop) {
    loopElement.checked = cacheData.loop;
  }

  // pass cache db-uri
  const dbUri = document.getElementById("db-uri");
  if (cacheData.dbUri) {
    dbUri.value = cacheData.dbUri;
  }
});

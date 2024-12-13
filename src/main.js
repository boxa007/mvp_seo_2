import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from "node:fs";
import { Worker, isMainThread, workerData  } from 'worker_threads';
import {
  createProfile,
  deleteProfile,
  stopProfile,
} from "./browser/browser-api.js";
import { v4 as uuid4 } from 'uuid';
import { 
  getBrowser,
  sleep,
  closePagesWithoutOpenedPage,
  humanizedScrollToElement,
  redirect,
  scrollToBottom,
  randomInt,
  getProxyList,
  shuffle,
  retry,
} from './utils/util.js';
import { hasInternet } from './utils/internet.js';
import { DomainRepository } from './database/repository.js';
import { search } from "./automation/search.js";
import { LOOP, NUM_THREADS, PROXIES } from './utils/common.js';

const __filename = fileURLToPath(import.meta.url);
const proxies = getProxyList(PROXIES);
const repository = new DomainRepository();

/**
 * @param {string | null} profileId 
 */
export const cleanup = async (profileId) => {
  if (profileId) {
    await stopProfile(profileId);
    await deleteProfile(profileId);
  }
};

/**
 * @param {{id: number, keyword: string, site: string, browserType: string}[]} keywords 
 * @param {{type: string, host: string, port: number, login: string, password: string}[]} proxies
 */
async function processKeyword(keywords, proxies) {
  for (const keyword of keywords) {
    const usedProxies = JSON.parse(readFileSync('./cache/usedProxies.json', 'utf8'));
    const profileName = uuid4();
    let proxy = proxies[Math.floor(Math.random() * proxies.length)];
    const usedProxiesBySite = usedProxies[keyword.site] ?? [];
    while (usedProxiesBySite.includes(`${proxy.host}:${proxy.port}`)) {
      proxy = proxies[Math.floor(Math.random() * proxies.length)];
    }
    const createdProfile = await createProfile(profileName, proxy);
    console.log(createdProfile);
    if (!createdProfile.data) {
      console.log(createdProfile.msg);
      await sleep(20 * 1000);
      continue
    }
    usedProxiesBySite.push(`${proxy.host}:${proxy.port}`);
    usedProxies[keyword.site] = usedProxiesBySite;
    console.log(`Selected proxy ${proxy.host}:${proxy.port} for site ${keyword.site}`);
    writeFileSync('./cache/usedProxies.json', JSON.stringify(usedProxies, null, 2));
    console.log(`Created profile name: ${profileName}`);
    const profileId = createdProfile.data.uuid;
      
    const browser = await getBrowser(profileId);
    if (!browser) {
      console.log(`Browser initialization error`);
      await sleep(30 * 1000); // sleep because maybe limit
      await retry(() => cleanup(profileId), 10 * 1000, 3);
      continue
    }

    let page = await browser.newPage();
    
    try {
      await closePagesWithoutOpenedPage(browser, page);
      let url, rank;
      if (keyword.keyword.search(/^https?:\/\//g) !== -1) {
        const googleUrl = new URL(keyword.keyword);
        const targetUrl = decodeURIComponent(googleUrl.searchParams.get('q'));
        try {
          await page.goto(targetUrl, { waitUntil: 'load' });
          await page.waitForNavigation();
        } catch {
          continue
        }
        
        url = targetUrl;
        rank = 0; // because direct request
      } else {
        // get search result by keyword
        const searchResult = await search(page, keyword, repository);
        if (!searchResult) {
          continue;
        }
        
        [url, rank] = searchResult;
        await humanizedScrollToElement(page, `a[href="${url}"]`);
        await sleep(randomInt(5 * 1000, 8 * 1000)); // between 2 and 4 seconds;
        const clickableElement = await page.$(`a[href="${url}"]`);
        await clickableElement.evaluate((b) => b.click());

        if (keyword.browserType === 'google') {
          await page.waitForNavigation({ waitUntil: 'load' });
          await scrollToBottom(page, randomInt(15 * 1000, 30 * 1000)); // between 30 and 60 seconds
          await sleep(randomInt(5 * 1000, 8 * 1000)); // between 2 and 4 seconds;
        } else {
          await sleep(randomInt(2 * 1000, 4 * 1000)); // between 2 and 4 seconds;
          [, page] = await browser.pages();
          await sleep(randomInt(8 * 1000, 12 * 1000)); // between 2 and 4 seconds;
          await scrollToBottom(page, randomInt(15 * 1000, 30 * 1000)); // between 30 and 60 seconds
          await sleep(randomInt(5 * 1000, 8 * 1000)); // between 2 and 4 seconds;
        }
        
      }

      try {
        const countGoto = randomInt(3, 11);
        console.log(`Count of goto: ${countGoto}`);
        for (let i = 0; i < countGoto; i++) {
          page = await redirect(page, browser, keyword.site, false);
          const countTime = randomInt(10 * 1000, 16 * 1000);  // between 10 and 15 seconds
          await scrollToBottom(page, countTime);
          console.log(`Time: ${countTime} milliseconds for iteration ${i+1}`);
          await sleep(randomInt(5 * 1000, 8 * 1000)); // between 2 and 4 seconds;
        }
      } catch (e) {
        console.log(e);
      }
      
      // write update record in google sheets
      await repository.updateDomainById(keyword.id, rank, true, false);
    } catch (e) {
      console.log(`Error when processing keyword: ${keyword.keyword}`);
      console.log(`Stacktrace`, e.stack);
      await repository.updateDomainById(keyword.id, 0, false, true);
    } finally {
      // stop and remove profile
      await retry(() => cleanup(profileId), 10 * 1000, 3);
    }
  }
}

if (isMainThread) {
  (async () => {
    const keywords = await repository.getDomains();
    for (let i = 0; i < NUM_THREADS; i++) {
      const worker = new Worker(__filename, { workerData: keywords });
      worker.on('error', err => {
        console.error(err);
      });
      worker.on('exit', () => {
        console.log('Worker finished');
      });
    }
  })();
} else {
  do {
    const shuffledNKeywords = shuffle(workerData).slice(0, randomInt(10, 16));
    console.log(`Count keywords: ${shuffledNKeywords.length}`);
    try {
      await processKeyword(shuffledNKeywords, proxies);
    } catch (e) {
      console.error(`Hard error: ${e}`);
    }
  } while (LOOP);
}

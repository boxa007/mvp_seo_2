import { Page } from "puppeteer";
import { 
  clickCookieConsentButton,
  googleSearchQuery,
  yandexSearchQuery,
  scrollToBottom,
  sleep,
  randomInt,
} from "../utils/util.js";
import { API_CAPMONSTER } from "../utils/common.js";
import { hasInternet } from '../utils/internet.js';

/**
 * @param {Page} page
 * @param {{id: number, keyword: string, site: string, browserType: string}} keyword
 * @param {DataRepository} repository
 */
export const search = async (page, keyword, repository) => {
  try {
    // set default navigation on 2 minutes
    page.setDefaultNavigationTimeout(2 * 60 * 1000);
    // types into keyword and wait navigation
    if (keyword.browserType === 'google') {
      await page.goto("https://www.google.com/", { timeout: 200000 });
      // set capmonster api key
      await page.evaluate((API_CAPMONSTER) => {
        if (window.CMExtension && !window.CMExtension.clientKey) {
          window.CMExtension.clientKey = API_CAPMONSTER;
        }
      }, API_CAPMONSTER);

      await clickCookieConsentButton(page);
      // types into keyword and wait navigation
      await googleSearchQuery(page, keyword.keyword);
      await page.waitForNavigation({ timeout: 200000 });
    
      // check captcha
      if (page.url().includes("google.com/sorry/index")) {
        // just sleep between 90 - 100 seconds
        await sleep(randomInt(90 * 1000, 100 * 1000));
      }
    
      const isDialogForChangeLocation = await page.evaluate(() => document.querySelector('span#lcMwfd'));
      if (isDialogForChangeLocation) {
        await page.click('g-raised-button[jsaction="click:O6N1Pb"]');
        await sleep(3 * 1000);

        const recheckIsDialogForChangeLocation = await page.evaluate(() => document.querySelector('span#lcMwfd'));
        if (recheckIsDialogForChangeLocation) {
          const clickableElement = await page.$('g-raised-button[@jsaction="click:O6N1Pb"]');
          await clickableElement.evaluate((b) => b.click());
          await sleep(3 * 1000)
        }  
      }

      await scrollToBottom(page, 10 * 1000, true); // scroll 10 second
      // get all links from serp page
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div.g a:not(.fl.iUh30)')).map((a) => a.getAttribute('href'));
      });
      const foundUrlByDomain = links.filter(link => {
        try {
          return (new URL(link)).hostname.includes(keyword.site);
        } catch {
          return false
        }
      });
    
      if (!foundUrlByDomain.length) {
        console.log(`Not found site by keyword: ${keyword.keyword}`)
        await repository.updateDomainById(keyword.id, 0, false, false);
        return;
      }

      const rank = links.indexOf(foundUrlByDomain[0]) + 1;
      console.log(`Found link like ${keyword.site} and position ${rank}`);
      return [foundUrlByDomain[0], rank];
    } else {
      await page.goto("https://yandex.com/", { timeout: 200000 }); // https://www.google.com/
      await yandexSearchQuery(page, keyword.keyword);
      await page.waitForNavigation({ timeout: 200000 });
      await scrollToBottom(page, 10 * 1000, true); // scroll 10 second
      // get all links from serp page
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div a[class*="organic__url"]')).map((a) => a.getAttribute('href'));
      });
      const foundUrlByDomain = links.filter(link => {
        try {
          const site = keyword.site.startsWith("http") ? (new URL(keyword.site)).hostname : keyword.site;
          return (new URL(link)).hostname.includes(site);
        } catch {
          return false
        }
      });
    
      if (!foundUrlByDomain.length) {
        console.log(`Not found site by keyword: ${keyword.keyword}`)
        await repository.updateDomainById(keyword.id, 0, false, false);
        return;
      }

      const rank = links.indexOf(foundUrlByDomain[0]) + 1;
      console.log(`Found link like ${keyword.site} and position ${rank}`);
      return [foundUrlByDomain[0], rank];
    }
  } catch (e) {
    console.error(`Error when processing search: ${e.message}`);
    console.error(e);
    await repository.updateDomainById(keyword.id, 0, false, true);

    if (!e.message.includes("setting in launch/connect calls for a higher timeout if needed")) {
      return;
    }

    while (!(await hasInternet())) {
      console.log('Not internet connection. Sleep 60 seconds...');
      await sleep(60 * 1000);
    }
    return;
  }
}

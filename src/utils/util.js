import { typeInto } from '@forad/puppeteer-humanize';
import { startProfile } from '../browser/browser-api.js';
import puppeteer from 'puppeteer-extra';
import { Browser, Page } from 'puppeteer';

/**
 * @param {number} profileId 
 * @returns Promise<Browser | null> 
 */
export const getBrowser = async (profileId) => {
  try {
    const startedProfile = await retry(() => startProfile(profileId), 45 * 1000, 3);

    return await puppeteer.connect({
      browserWSEndpoint: startedProfile.ws_endpoint,
      defaultViewport: null,
    });
  } catch (e) {
    console.error(`Browser initialization error, check profile with id: '${profileId}'`);
    return null;
  }
}

/**
 * @param {Page} page
 * @param {string} query
 */
export const googleSearchQuery = async (page, query) => {
  try {
    await page.waitForSelector('textarea[name="q"]', { timeout: 60 * 1000 });
    const input = await page.$('textarea[name="q"]');
    let enteredText = '';
    do {
      await typeInto(input, `${query}`);
      enteredText = await page.evaluate(() => document.querySelector('textarea[name="q"]').value);
      if (enteredText !== query) {
        while (enteredText.length != 0) {
          await input.press('Backspace');
          enteredText = await page.evaluate(() => document.querySelector('textarea[name="q"]').value);
          await input.press('ArrowRight');
        }
      }
    } while (enteredText !== query);
    await sleep(randomInt(1000, 2000));
    await page.keyboard.press('Enter');
  } catch (e) {
    throw new Error(`Error during Google search: ${e.message}`);
  }
}

/**
 * @param {Page} page
 * @param {string} query
 */
export const yandexSearchQuery = async (page, query) => {
  try {
    await page.waitForSelector('input[class*="search"]', { timeout: 60 * 1000 });
    const input = await page.$('input[class*="search"]');
    let enteredText = '';
    do {
      await typeInto(input, `${query}`);
      enteredText = await page.evaluate(() => document.querySelector('input[class*="search"]').value);
      if (enteredText !== query) {
        while (enteredText.length != 0) {
          await input.press('Backspace');
          enteredText = await page.evaluate(() => document.querySelector('input[class*="search"]').value);
          await input.press('ArrowRight');
        }
      }
    } while (enteredText !== query);
    await sleep(randomInt(1000, 2000));
    await page.keyboard.press('Enter');
  } catch (e) {
    throw new Error(`Error during Google search: ${e.message}`);
  }
}

/**
 * @param {Page} page
 */
export const clickCookieConsentButton = async(page) => {
  try {
    const cookieButton = await page.waitForSelector('#L2AGLb', {
      timeout: 10000,
    });
    if (cookieButton) {
      await cookieButton.click();
    }
  } catch {}
}

/**
 * @param {Page} page 
 * @param {number | null} time 
 * @param {boolean} withoutRandomScroll
 */
export const scrollToBottom = async (
  page, 
  time = null, // in milliseconds 
  withoutRandomScroll = false,
) => {
  await page.evaluate(
    async (scrollTime, noRandomScroll) => {
      const randomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
      };
      await new Promise((resolve) => {
        let totalHeight = 0;
        const start = Date.now();
        const timer = setInterval(
          () => {
            const scrollStep = randomInt(57, 179);
            const shouldScrollDown = Math.random() < 0.8;
            const distance = !noRandomScroll ? (shouldScrollDown ? scrollStep : -scrollStep) : scrollStep;

            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (scrollTime && Date.now() - start >= scrollTime) {
              clearInterval(timer);
              resolve(null);
            }

            if (noRandomScroll && totalHeight >= scrollHeight - window.innerHeight) {
              clearInterval(timer);
              resolve(null);
            }
          },
          randomInt(400, 800),
        );
      });
    },
    time,
    withoutRandomScroll,
  );
};

/**
 * 
 * @param {Page} page 
 * @param {Browser} browser 
 * @param {string} targetSite 
 * @param {boolean} randomRedirect 
 * @returns Page
 */
export const redirect = async (page, browser, targetSite, randomRedirect = true) => {
  const urls = await page.evaluate(() => {
    const currentUrl = window.location.href;
    const elements = document.querySelectorAll('a, button');
    const urls = new Set();

    for (const element of elements) {
      const url = element.getAttribute('href') || element.getAttribute('data-href') || '';
      if (!url) {
        continue;
      }

      if (url.startsWith('/')) {
        const fullUrl = new URL(url, new URL(currentUrl).origin).href;
        if (currentUrl !== fullUrl) {
          urls.add(fullUrl);
        }
        continue;
      }

      try {
        if (new URL(url).hostname.includes(new URL(currentUrl).hostname)) {
          urls.add(url);
        }
      } catch (e) {
        console.log(`Redirect.error: ${e.message}`);
      }
    }

    const multimediaRegex = /\.(jpg|jpeg|png|gif|bmp|mp4|avi|mkv|mp3|wav|flac)$/i;
    return Array.from(urls).filter((url) => !multimediaRegex.test(url));
  });
  if (!urls.length) {
    await page.goto(targetSite, { waitUntil: 'domcontentloaded' });
    return page;
  }

  const url = urls[Math.floor(Math.random() * urls.length)];
  if (!url) {
    await page.goto(targetSite, { waitUntil: 'domcontentloaded' });
    return page;
  }

  if (!randomRedirect) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return page;
  }

  if (Math.random() > 0.35) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return page;
  } else {
    const newPage = await browser.newPage();
    await newPage.goto(url, { waitUntil: 'domcontentloaded' });
    return newPage;
  }
};

/**
 * @param {number} ms 
 */
export const sleep = async (ms) => {
  return await new Promise((r) => setTimeout(r, ms));
};

/**
 * @param {Page} page 
 * @param {string} selector 
 * @param {Readonly<MouseClickOptions>} options 
 */
export const clickToSelectorByRandomCoordinate = async(page, selector, options = {})  => {
  const box = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  }, selector);

  if (!box.x) {
    console.log(`'getBoundingClientRect' for '${selector}' return 'null', click by ${selector}`);
    const clickableElement = await page.$(selector);
    await clickableElement.evaluate((b) => b.click());
    return;
  }

  const randomX = box.x + Math.random() * box.width;
  const randomY = box.y + Math.random() * box.height;
  
  await page.mouse.move(randomX, randomY);
  await page.mouse.click(randomX, randomY, options);
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} width 
 * @param {number} height 
 * @param {number} percentSide 
 * @returns { x: number; y: number }
 */
export const randomPointInAreaElement = async(x, y, width, height, percentSide = 100) => {
  if (width === 0 || height === 0) {
    throw new Error('Width or height should not be equal to 0.');
  }
  const center = { x: x + width / 2, y: y + height / 2 };
  const newWidth = (percentSide / 100) * width;
  const newHeight = (percentSide / 100) * height;

  const averageNewWidth = Math.random() * (newWidth / 2);
  const averageNewHeight = Math.random() * (newHeight / 2);

  return {
    x: averageNewWidth * (Math.random() > 0.5 ? 1 : -1) + center.x,
    y: averageNewHeight * (Math.random() > 0.5 ? 1 : -1) + center.y,
  };
}

/**
 * @param {Browser} browser 
 * @param {Page} newPage 
 */
export const closePagesWithoutOpenedPage = async (browser, newPage) => {
  await Promise.all(
    (await browser.pages()).map(async (page) => {
      if (page !== newPage) {
        try {
          await page.close();
        } catch {}
      }
    }),
  );
};

/**
 * @param {Page} page 
 * @param {string} selector 
 */
export const humanizedScrollToElement = async(page, selector) => {
  await page.evaluate(async (selector) => {
    const randomInt = (min, max) => {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min);
    };

    const element = document.querySelector(selector);
    if (!element) {
      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, selector);
    };

    const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const middleOfViewport = window.innerHeight / 2;
    const middleOfElement = absoluteElementTop + elementRect.height / 2 - middleOfViewport;

    const smoothScroll = (targetPosition) => {
      let currentPosition = window.pageYOffset;
      const scroll = () => {
        if (currentPosition < targetPosition) {
          currentPosition += Math.min(randomInt(123, 234) / 1000, targetPosition - currentPosition);
          window.scrollTo(0, currentPosition);
        } else if (currentPosition > targetPosition) {
          currentPosition -= Math.min(randomInt(123, 234) / 1000, currentPosition - targetPosition);
          window.scrollTo(0, currentPosition);
        } else {
          clearInterval(scrolling);
          return;
        }
        requestAnimationFrame(scroll);
      };
      const scrolling = setInterval(scroll, randomInt(123, 234) / 1000);
    };

    smoothScroll(middleOfElement);
  }, selector);
}

/**
 * @param {number} min 
 * @param {number} max 
 * @returns 
 */
export const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

/**
 * @param {string} proxyList
 * @returns {object}
 */
export const getProxyList = (proxyList) => {
  // example: socks5://cirorlpc-rotate:cgb4ex8hg8dl@p.webshare.io:80
  if (!proxyList) {
    throw new Error('Proxy list must be string');
  }

  const pattern = /(https?|socks[45]?):\/\/(.*):(.*)@(.*):(\d+)/;
  const rawProxies = proxyList.split(",");
  const proxies = [];
  for (const proxy of rawProxies) {
    const proxyParts = proxy.match(pattern);
    if (!proxyParts) {
      throw new Error(`Proxy '${proxy}' is not valid`);
    }
    proxies.push(
      {
        type: proxyParts[1],
        host: proxyParts[4],
        port: proxyParts[5],
        login: proxyParts[2],
        password: proxyParts[3],
      }
    )
  }
  return proxies;
}

/**
 * @param {Any} array
 * @returns {Any[]}
 */
export const shuffle = (array) => {
  /*
   * Shuffles array elements.
   * @param array - array with string elements.
   * @returns - array with shuffled elements.
   *  */
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

/**
 * @param {Promise<T>} fn - function which need retry when error
 * @param {number} ms - waiting before next retry
 * @param {number} retries - count retries
 * @returns 
 */
export const retry = (fn, ms, retries) => {
  return new Promise((resolve, reject) => {
    fn()
      .then(res => resolve(res))
      .catch(error => {
        if (retries < 1) {
          reject(error)
        } else {
          console.log(`Number of repetitions: ${retries}`)
          setTimeout(() => {
            retry(fn, ms, retries - 1)
              .then(res => resolve(res))
              .catch(reject)
          }, ms)
        }
      })
  })
}

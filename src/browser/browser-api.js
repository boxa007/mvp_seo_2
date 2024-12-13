import requests from "requestretry";
import { API_URL, API_LOCAL_URL, API_TOKEN, PROFILE_DEBUG } from "../utils/common.js";
import { checkProxy } from "../utils/proxy.js";


const logRequestsStats = (res) => {
  const stats = {
    "retry-after": res.headers["retry-after"],
    "x-ratelimit-limit": res.headers["x-ratelimit-limit"],
    "x-ratelimit-limit-hour": res.headers["x-ratelimit-limit-hour"],
    "x-ratelimit-remaining": res.headers["x-ratelimit-remaining"],
    "x-ratelimit-remaining-hour": res.headers["x-ratelimit-remaining-hour"],
    "x-ratelimit-reset": res.headers["x-ratelimit-reset"],
  }
  console.log(stats);
}

/**
  * @param {string} profileName
  * @param {host: string, port: number, login: string, password: string, database: string} proxy
*/
export const createProfile = async (profileName, proxy) => {
  const proxyType = proxy.type.includes('http') ? '-x' : '--socks5-hostname';
  const command = `curl ${proxyType} ${proxy.host}:${proxy.port} -U ${proxy.login}:${proxy.password} -I -m 15 https://api.myip.com`;
  const isWorkingProxy = await checkProxy(command);
  if (!isWorkingProxy) {
    return {
      success: false,
      msg: 'Proxy is not working.',
      data: null,
    };
  }

  return await requests.post(
    `${API_URL}/profiles`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Octo-Api-Token': `${API_TOKEN}`,
      },
      body: JSON.stringify(
        {
          title: `${profileName}`,
          fingerprint: {
            os: "win"
          },
          proxy: proxy,
          extensions: [
            "pabjfbciaedomjjfelfafejkppknjleh@1.11.12"
          ],
        }
      ),
      maxAttempts: 5,
      retryDelay: 5_000,
    },
  ).catch((e) => {
    console.log(e);
    return {
      success: false,
      msg: e.message,
      data: null,
    };
  }).then((res) => {
    logRequestsStats(res);
    return JSON.parse(res.body);
  });
};

/**
 * @param {string} profileId
 */
export const deleteProfile = async (profileId) => {
  return await requests.delete(
    `${API_URL}/profiles`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Octo-Api-Token': `${API_TOKEN}`,
      },
      body: JSON.stringify(
        {
          uuids: [
            profileId,
          ],
          skip_trash_bin: true
        }
      ),
      maxAttempts: 5,
      retryDelay: 5_000,
    },
  ).catch((e) => {
    console.log(e);
    return {
      success: false,
      msg: e.message,
      data: {
          deleted_uuids: [],
          active_uuids: [],
      },
    };
  }).then((res) => {
    logRequestsStats(res);
    return JSON.parse(res.body);
  });
}

/**
 * @param {string} profileId
 */
export const startProfile = async (profileId) => {
  return await requests.post(
    `${API_LOCAL_URL}/profiles/start`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        {
          uuid: profileId,
          headless: !PROFILE_DEBUG,
          debug_port: true,
          flags: [ '--start-maximized' ],
        }
      ),
      maxAttempts: 5,
      retryDelay: 5_000,
    },
  ).catch((e) => {
    console.log(e);
    return {
      error: e.message,
    };
  }).then((res) => {
    logRequestsStats(res);
    return JSON.parse(res.body);
  });
}

/**
 * @param {string} profileId
 */
export const stopProfile = async (profileId) => {
  return await requests.post(
    `${API_LOCAL_URL}/profiles/stop`,
    {
      body: JSON.stringify(
        {
          uuid: profileId,
        }
      ),
      maxAttempts: 5,
      retryDelay: 10_000,
    },
  ).catch((e) => {
    console.log(e);
    return {
      success: false,
      error: e.message,
    };
  }).then((res) => {
    logRequestsStats(res);
    return JSON.parse(res.body);
  });
}

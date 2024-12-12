import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { GOOGLE_SHEET_ID } from './common.js';

import creds from '../config/clickserg-af797086cd73.json' assert { type: "json" };

const jwt = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, jwt);
await doc.loadInfo();

/**
 * @returns {id: number, keyword: string, site: string}[]
 */
export const getKeywords = async () => {
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  
  const rows = await sheet.getRows();
  return rows.map((row, index) => {
    return { 
      id: index, 
      keyword: row.get("keyword"), 
      site: row.get("site") 
    }
  });
}

/**
 * @param {number} recordId
 * @param {number} rank
 * @param {boolean} isWisitWebsite
 * @param {boolean} proxyError
 */
export const updateRecordById = async (recordId, rank, isWisitWebsite, proxyError) => {
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  
  const row = (await sheet.getRows())[recordId];
  if (!row) {
    throw Error(`Not found record by id: ${recordId}`);
  }

  // update rank
  if (rank) {
    row.set("rank", rank);
  }

  if (isWisitWebsite && !proxyError) {
    // increment count of `website visit site`
    const visitCount = row.get("website visit count");
    row.set("website visit count", visitCount ? parseInt(visitCount) + 1: 1);
  }
  
  if (!isWisitWebsite && proxyError) {
    // increment count of `proxy error`
    const proxyErrorCount = row.get("proxy/browser error");
    row.set("proxy/browser error", proxyErrorCount ? parseInt(proxyErrorCount) + 1: 1);
  }

  if (!isWisitWebsite && !proxyError) {
    // increment count of `website not visit count`
    const notVisitCount = row.get("website not visit count");
    row.set("website not visit count", notVisitCount ? parseInt(notVisitCount) + 1: 1);
  }

  // update date
  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const formattedDateTime = month + '/' + day + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
  row.set("date", formattedDateTime);
  // save row
  await row.save();
}

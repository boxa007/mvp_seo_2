import dotenv from 'dotenv';

// load settings from .env file
dotenv.config();

export const API_URL = 'https://app.octobrowser.net/api/v2/automation';
export const API_LOCAL_URL = 'http://127.0.0.1:58888/api';
export const API_TOKEN = process.env.API_TOKEN;
export const PROFILE_DEBUG = process.env.PROFILE_DEBUG === 'true';
export const LOOP = process.env.LOOP === 'true';
export const PROXIES = process.env.PROXIES;
export const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
export const NUM_THREADS = process.env.NUM_THREADS;
export const API_CAPMONSTER = process.env.API_CAPMONSTER;
export const DB_HOST = process.env.DB_HOST;
export const DB_PORT = process.env.DB_PORT;
export const DB_USERNAME = process.env.DB_USERNAME;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_DATABASE = process.env.DB_DATABASE;

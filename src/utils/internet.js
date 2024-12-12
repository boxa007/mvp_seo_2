import dns from 'node:dns';

/**
 * @@returns {Promise<boolean>}
 */
export async function hasInternet() {
 return new Promise((resolve, reject) => {
    dns.resolve('www.google.com', (error) => error ? resolve(false) : resolve(true))
 });
}

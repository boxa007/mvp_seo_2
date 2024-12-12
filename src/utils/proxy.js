import { exec } from 'child_process';

/**
 * @param {string} command
 * @returns {number | null}
 */
export async function checkProxy(command) {
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing cURL command: ${error.message}`);
        resolve(null);
      }
      const statusCodeMatch = stdout.match(/HTTP\/\d\.?\d? (\d+)/);
      if (statusCodeMatch && statusCodeMatch.length > 1) {
        const statusCode = parseInt(statusCodeMatch[1]);
        resolve(statusCode);
      } else {
        console.error('Failed to extract status code from cURL output');
        resolve(null);
      }
    });
  });
};

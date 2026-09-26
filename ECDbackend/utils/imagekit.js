const https = require('https');

/**
 * Uploads a file (base64 data URL, raw base64, or remote URL) to ImageKit.io CDN
 * @param {string} fileData - Base64 string or URL
 * @param {string} fileName - Destination filename
 * @param {string} folder - Target folder on ImageKit (e.g. '/restaurants', '/menu', '/documents')
 * @returns {Promise<string>} ImageKit CDN URL
 */
async function uploadToImageKit(fileData, fileName = `image_${Date.now()}.jpg`, folder = '/restaurants') {
  if (!fileData) return null;
  if (typeof fileData !== 'string') return null;

  // If already an external hosted URL (not base64 data URI), return as is
  if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
    return fileData;
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'private_/hx/a+OvHSDm7BzeueSyvAmZljY=';
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/ECDKART';

  try {
    const postData = new URLSearchParams({
      file: fileData,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: 'true',
    }).toString();

    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64');

    return new Promise((resolve) => {
      const options = {
        hostname: 'upload.imagekit.io',
        port: 443,
        path: '/api/v1/files/upload',
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data && data.url) {
              console.log(`[ImageKit] Upload successful: ${data.url}`);
              resolve(data.url);
            } else {
              console.warn('[ImageKit] Upload response missing url:', data);
              resolve(fileData);
            }
          } catch (err) {
            console.warn('[ImageKit] Failed to parse response:', err.message);
            resolve(fileData);
          }
        });
      });

      req.on('error', (e) => {
        console.warn('[ImageKit] HTTP Request error:', e.message);
        resolve(fileData);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(fileData);
      });

      req.write(postData);
      req.end();
    });
  } catch (err) {
    console.warn('[ImageKit] Unexpected error during upload:', err);
    return fileData;
  }
}

module.exports = { uploadToImageKit };

const ImageKit = require('imagekit');

let imagekit = null;

function getImageKitInstance() {
  if (!imagekit) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || '';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || '';

    if (publicKey && privateKey && urlEndpoint) {
      imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
    }
  }
  return imagekit;
}

/**
 * Uploads a file, buffer, or base64 data URI to ImageKit
 * @param {string|Buffer} fileInput - Base64 string, data URI, file path, or Buffer
 * @param {string} fileName - Destination filename
 * @param {string} folder - Destination folder on ImageKit (default: /ecdkart/riders)
 * @returns {Promise<string|null>} - Returns the secure ImageKit CDN URL or null
 */
async function uploadToImageKit(fileInput, fileName = 'image.jpg', folder = '/ecdkart/riders') {
  if (!fileInput) return null;

  // If already an HTTP/HTTPS URL and not a data URI, return as-is
  if (typeof fileInput === 'string' && /^https?:\/\//i.test(fileInput) && !fileInput.startsWith('data:')) {
    return fileInput;
  }

  const ik = getImageKitInstance();
  if (!ik) {
    console.warn('⚠️ ImageKit credentials missing in environment.');
    return null;
  }

  try {
    let cleanFile = fileInput;
    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const response = await ik.upload({
      file: cleanFile,
      fileName: safeName,
      folder: folder,
      useUniqueFileName: true,
    });

    if (response && response.url) {
      console.log(`✅ ImageKit Upload Success: ${response.url}`);
      return response.url;
    }
  } catch (error) {
    console.error('❌ ImageKit Upload Error:', error.message || error);
  }

  return null;
}

module.exports = {
  getImageKitInstance,
  uploadToImageKit,
};

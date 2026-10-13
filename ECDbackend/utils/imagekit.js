const {
  uploadToImageKit,
  getImageKitInstance,
  getFoodFallbackImageUrl,
  resolveImageInput,
} = require('../services/imageKitService');

/**
 * Uploads a file (base64 data URL, raw base64, remote URL, or local path) to ImageKit.io CDN
 * @param {string|Buffer} fileData - Base64 string, data URI, or remote URL
 * @param {string} fileName - Destination filename
 * @param {string} folder - Target folder on ImageKit (e.g. '/restaurants', '/menu', '/documents')
 * @param {string} dishName - Optional dish name for fallback matching
 * @returns {Promise<string>} ImageKit CDN URL
 */
module.exports = {
  uploadToImageKit,
  getImageKitInstance,
  getFoodFallbackImageUrl,
  resolveImageInput,
};

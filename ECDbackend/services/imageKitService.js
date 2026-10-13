const ImageKit = require('imagekit');

let imagekit = null;

function getImageKitInstance() {
  if (!imagekit) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || 'public_bndzwvE17qu6mX6x96Ak/PhnGY0=';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'private_/hx/a+OvHSDm7BzeueSyvAmZljY=';
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/ECDKART';

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

const FOOD_CATEGORY_FALLBACKS = [
  // Beverages / Shakes / Coolers
  { match: /mojito|lemonade|soda|blue lagoon|cooler/i, url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { match: /tea|chai/i, url: 'https://images.unsplash.com/photo-1576867757603-05b134ebc379?auto=format&fit=crop&w=800&q=80' },
  { match: /coffee|frappe|cappuccino|latte/i, url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80' },
  { match: /shake|smoothie/i, url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80' },
  { match: /lassi/i, url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80' },
  // Italian / Continental
  { match: /pizza/i, url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { match: /pasta|spaghetti/i, url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80' },
  { match: /burger/i, url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80' },
  { match: /sandwich/i, url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80' },
  { match: /fries|tikki/i, url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80' },
  { match: /maggi|noodle|chowmein/i, url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80' },
  // Indian Snacks & Starters
  { match: /pakora|bhaji|bhajiya|fritter/i, url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80' },
  { match: /samosa/i, url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80' },
  { match: /paneer/i, url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80' },
  { match: /biryani|pulao|rice/i, url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
  { match: /roti|naan|paratha/i, url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80' },
  { match: /dal|curry|gravy|chhole|sabji/i, url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80' },
  { match: /sweet|dessert|gulab|halwa|kheer|khir|brownie/i, url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80' },
];

function getFoodFallbackImageUrl(queryText = '') {
  const text = String(queryText || '').toLowerCase();
  for (const item of FOOD_CATEGORY_FALLBACKS) {
    if (item.match.test(text)) {
      return item.url;
    }
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
}

function resolveImageInput(fileInput, dishName = '') {
  if (!fileInput) return null;
  if (typeof fileInput !== 'string') return fileInput;
  const str = fileInput.trim();
  if (!str) return null;

  // If already hosted on ImageKit, keep it directly
  if (str.includes('ik.imagekit.io')) {
    return { isImageKit: true, url: str };
  }

  // Base64 Data URI
  if (str.startsWith('data:image/')) {
    return { isDataUri: true, value: str };
  }

  // HTTP or HTTPS URL
  if (/^https?:\/\//i.test(str)) {
    try {
      const u = new URL(str);

      // Handle Google Image search links and redirects
      if (u.hostname.includes('google.')) {
        const imgUrl = u.searchParams.get('imgurl');
        if (imgUrl && /^https?:\/\//i.test(imgUrl)) {
          return { isUrl: true, value: decodeURIComponent(imgUrl) };
        }
        const urlParam = u.searchParams.get('url');
        if (urlParam && /^https?:\/\//i.test(urlParam)) {
          return { isUrl: true, value: decodeURIComponent(urlParam) };
        }
        // If it's a search result page (e.g. google.com/search?tbm=isch&q=...)
        if (u.pathname.includes('/search')) {
          const q = u.searchParams.get('q') || dishName || '';
          return { isUrl: true, value: getFoodFallbackImageUrl(q) };
        }
      }

      // Handle Bing Image Search links
      if (u.hostname.includes('bing.com') && u.searchParams.get('mediaurl')) {
        return { isUrl: true, value: decodeURIComponent(u.searchParams.get('mediaurl')) };
      }

      return { isUrl: true, value: str };
    } catch (e) {
      return { isUrl: true, value: str };
    }
  }

  return { isRaw: true, value: str };
}

/**
 * Uploads a file, buffer, remote image URL, or base64 data URI to ImageKit CDN
 * @param {string|Buffer} fileInput - Base64 string, data URI, remote URL, file path, or Buffer
 * @param {string} fileName - Destination filename
 * @param {string} folder - Destination folder on ImageKit (default: /menu)
 * @param {string} dishName - Optional dish name for fallback matching
 * @returns {Promise<string|null>} - Returns the secure ImageKit CDN URL
 */
async function uploadToImageKit(fileInput, fileName = 'image.jpg', folder = '/menu', dishName = '') {
  if (!fileInput) return null;

  const resolved = resolveImageInput(fileInput, dishName);
  if (!resolved) return null;

  // If already hosted on ImageKit, return as-is
  if (resolved.isImageKit) {
    return resolved.url;
  }

  const ik = getImageKitInstance();
  if (!ik) {
    console.warn('⚠️ ImageKit credentials missing in environment.');
    return resolved.value || fileInput;
  }

  try {
    let uploadPayload = resolved.value || fileInput;

    // If it's a local file path string, read as Buffer
    if (typeof fileInput === 'string' && !fileInput.startsWith('data:') && !fileInput.startsWith('http') && fileInput.length < 500) {
      const fs = require('fs');
      if (fs.existsSync(fileInput)) {
        uploadPayload = fs.readFileSync(fileInput);
      }
    }

    const cleanFileName = (dishName || fileName || 'image')
      .toString()
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const safeName = `${Date.now()}_${cleanFileName}.jpg`;

    const response = await ik.upload({
      file: uploadPayload,
      fileName: safeName,
      folder: folder || '/menu',
      useUniqueFileName: true,
    });

    if (response && response.url) {
      console.log(`✅ [ImageKit] Upload Success: ${response.url}`);
      return response.url;
    }
  } catch (error) {
    console.error(`❌ [ImageKit] Upload Error (${dishName || fileName}):`, error.message || error);
    // If remote URL upload failed, try reliable food fallback
    if (dishName && resolved.isUrl) {
      try {
        const fallbackUrl = getFoodFallbackImageUrl(dishName);
        const retryResp = await ik.upload({
          file: fallbackUrl,
          fileName: `${Date.now()}_fallback.jpg`,
          folder: folder || '/menu',
          useUniqueFileName: true,
        });
        if (retryResp && retryResp.url) {
          console.log(`✅ [ImageKit] Fallback Upload Success: ${retryResp.url}`);
          return retryResp.url;
        }
      } catch (retryErr) {
        console.warn('⚠️ [ImageKit] Fallback upload also failed:', retryErr.message);
      }
    }
  }

  return (resolved.isUrl ? resolved.value : null) || fileInput;
}

module.exports = {
  getImageKitInstance,
  uploadToImageKit,
  getFoodFallbackImageUrl,
  resolveImageInput,
};

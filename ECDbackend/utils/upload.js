const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { uploadToImageKit } = require('../services/imageKitService');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Check if ImageKit is configured
const hasImageKitConfig = Boolean(
  process.env.IMAGEKIT_PUBLIC_KEY &&
  process.env.IMAGEKIT_PRIVATE_KEY &&
  process.env.IMAGEKIT_URL_ENDPOINT
);

// Check if Cloudinary is configured
const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;

if (hasCloudinaryConfig) {
  // Use Cloudinary storage if configured
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: process.env.CLOUDINARY_FOLDER || 'food-delivery',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    },
  });
  console.log('📦 Using Cloudinary storage');
} else if (hasImageKitConfig) {
  // Use memory storage so we can upload buffer to ImageKit
  storage = multer.memoryStorage();
  console.log('📦 Using ImageKit storage (memory buffer)');
} else {
  // Fallback: disk storage
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, name);
    }
  });
  console.log('📦 Using local disk storage');
}

function fileFilter (req, file, cb) {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.test(ext.replace('.', ''))) return cb(null, true);
  cb(new Error('Invalid file type. Only JPEG, PNG and WEBP allowed.'));
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

/**
 * Get a public URL for an uploaded file.
 * Priority: Cloudinary URL > ImageKit upload > disk path
 */
const getFileUrl = async (file) => {
  if (!file) return null;

  // Already a string URL
  if (typeof file === 'string') {
    if (/^https?:\/\//i.test(file) && !file.startsWith('data:')) return file;
    // base64 / data URI
    if (file.startsWith('data:') || file.length > 500) {
      const ikUrl = await uploadToImageKit(file, 'upload.jpg', '/ecdkart/banners');
      if (ikUrl) return ikUrl;
    }
  }

  // Cloudinary: file.path is a URL
  if (typeof file.path === 'string' && /^https?:\/\//.test(file.path)) return file.path;
  if (typeof file.url === 'string' && /^https?:\/\//.test(file.url)) return file.url;

  // ImageKit: file is in memory (buffer) — upload directly
  if (file.buffer && hasImageKitConfig) {
    try {
      const safeFilename = (file.originalname || file.fieldname || 'upload.jpg')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const ikUrl = await uploadToImageKit(
        file.buffer,          // Buffer — ImageKit SDK accepts Buffer directly
        safeFilename,
        '/ecdkart/banners'
      );
      if (ikUrl) {
        console.log(`✅ Uploaded to ImageKit: ${ikUrl}`);
        return ikUrl;
      }
    } catch (e) {
      console.warn('ImageKit buffer upload failed:', e.message);
    }
  }

  // Disk file — read and upload to ImageKit
  if (file.path && fs.existsSync(file.path) && hasImageKitConfig) {
    try {
      const buffer = fs.readFileSync(file.path);
      const safeFilename = (file.originalname || file.filename || 'upload.jpg')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const ikUrl = await uploadToImageKit(buffer, safeFilename, '/ecdkart/banners');
      if (ikUrl) {
        // Clean up local file after successful upload
        try { fs.unlinkSync(file.path); } catch (_) {}
        console.log(`✅ Uploaded disk file to ImageKit: ${ikUrl}`);
        return ikUrl;
      }
    } catch (e) {
      console.warn('ImageKit disk upload failed:', e.message);
    }
  }

  // Absolute fallback: serve from local disk
  if (file.filename) {
    const baseOrigin = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${baseOrigin}/uploads/${file.filename}`;
  }
  if (file.path) {
    const baseOrigin = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const filename = path.basename(file.path);
    return `${baseOrigin}/uploads/${filename}`;
  }

  return null;
};

async function uploadToS3 (file) {
  return getFileUrl(file);
}

module.exports = { upload, getFileUrl, uploadToS3, uploadToImageKit };

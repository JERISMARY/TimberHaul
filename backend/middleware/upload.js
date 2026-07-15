/* ============================================================
   TimberHaul — Upload Middleware
   
   Strategy:
   - If CLOUDINARY_* env vars are set → upload to Cloudinary CDN
     → URLs saved in MongoDB (Product.images[].url, User.avatar, etc.)
   - If not configured → fall back to local disk (public/uploads/)
   
   MongoDB stores ONLY the URL strings, not binary image data.
   Cloudinary is the actual image host (free tier: 25GB storage, 25GB bandwidth/month).
   ============================================================ */

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { isConfigured } = require('../config/cloudinary');

// ─── Cloudinary Storage ───────────────────────────────────────
let cloudinaryStorage = null;

if (isConfigured) {
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  const { cloudinary } = require('../config/cloudinary');

  cloudinaryStorage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      let folder = 'timberhaul/misc';
      if (file.fieldname === 'productImages') folder = 'timberhaul/products';
      else if (file.fieldname === 'avatar')   folder = 'timberhaul/avatars';
      else if (file.fieldname === 'blogImage') folder = 'timberhaul/blogs';
      else if (file.fieldname === 'categoryImage') folder = 'timberhaul/categories';

      return {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
          // Auto-optimize quality + format
          { quality: 'auto', fetch_format: 'auto' },
          // Resize to max 1200px wide keeping aspect ratio
          { width: 1200, crop: 'limit' }
        ],
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      };
    },
  });

  console.log('✅ Cloudinary storage configured — images will be stored in Cloudinary');
}

// ─── Local Disk Storage (fallback) ───────────────────────────
const uploadDir = process.env.FILE_UPLOAD_PATH || './public/uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'misc';
    if (file.fieldname === 'productImages')  folder = 'products';
    else if (file.fieldname === 'avatar')    folder = 'avatars';
    else if (file.fieldname === 'blogImage') folder = 'blogs';

    const dir = path.join(uploadDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

// ─── File Filter (both storages) ─────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
  }
};

// ─── Export Upload Middleware ─────────────────────────────────
const upload = multer({
  storage:    isConfigured ? cloudinaryStorage : diskStorage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }
});

/**
 * Normalize a single multer file object to a standard { url, publicId } shape
 * regardless of whether Cloudinary or disk storage was used.
 */
const normalizeFile = (file, fieldName, productName = '') => {
  if (isConfigured) {
    // Cloudinary: file.path = secure_url, file.filename = public_id
    return {
      url:      file.path,
      publicId: file.filename,
      alt:      productName || path.basename(file.originalname, path.extname(file.originalname)),
    };
  }
  // Local disk
  const folder = fieldName === 'productImages' ? 'products'
    : fieldName === 'avatar' ? 'avatars'
    : fieldName === 'blogImage' ? 'blogs' : 'misc';
  return {
    url:      `/uploads/${folder}/${file.filename}`,
    publicId: null,
    alt:      productName || path.basename(file.originalname, path.extname(file.originalname)),
  };
};

module.exports = upload;
module.exports.normalizeFile = normalizeFile;
module.exports.isCloudinary   = isConfigured;

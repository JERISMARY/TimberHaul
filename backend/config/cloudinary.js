/* ============================================================
   TimberHaul — Cloudinary Config
   Images are uploaded to Cloudinary CDN.
   URLs are stored in MongoDB (Product.images[].url, User.avatar, etc.)
   ============================================================ */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is properly configured
const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_')
);

if (!isConfigured) {
  console.warn('⚠️  Cloudinary not configured — image uploads will use local disk fallback');
}

/**
 * Upload a single buffer/stream to Cloudinary
 * @param {Buffer} fileBuffer - file buffer
 * @param {Object} options    - cloudinary upload options
 * @returns {Promise<{url, publicId, width, height}>}
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `timberhaul/${options.folder || 'misc'}`,
      transformation: options.transformation || [],
      resource_type: 'image',
      ...options,
    };

    cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve({
        url:       result.secure_url,
        publicId:  result.public_id,
        width:     result.width,
        height:    result.height,
        format:    result.format,
        bytes:     result.bytes,
      });
    }).end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary by publicId
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId || !isConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn('Failed to delete from Cloudinary:', err.message);
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary, isConfigured };

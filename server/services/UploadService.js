import cloudinary from '../config/cloudinary.js';

export const UploadService = {
  /**
   * Upload an image buffer to Cloudinary and return the secure_url.
   */
  async uploadImage(buffer, folder = 'ecocycle/submissions') {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );

      // Multer memoryStorage provides the buffer
      uploadStream.end(buffer);
    });
  },

  /**
   * Upload a base64 encoded image to Cloudinary.
   */
  async uploadBase64(b64String, folder = 'ecocycle/detections') {
    try {
      const dataStr = b64String.startsWith('data:') ? b64String : `data:image/jpeg;base64,${b64String}`;
      const result = await cloudinary.uploader.upload(dataStr, {
        folder,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary base64 upload failed:', err.message);
      return null;
    }
  },
};

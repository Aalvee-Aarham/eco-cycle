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
};

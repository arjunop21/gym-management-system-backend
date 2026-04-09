import cloudinary from '../config/cloudinary.js';

/**
 * POST /api/upload/member-image
 * Uploads a member photo to Cloudinary → member_images/
 * Returns { url: "<public download URL>" }
 */
export const uploadMemberImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    // Attempt to upload image to Cloudinary via stream
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'member_images' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      // Write the buffer to the stream
      stream.end(req.file.buffer);
    });

    res.status(201).json({ url: uploadResult.secure_url });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: error.message || 'Image upload failed.' });
  }
};

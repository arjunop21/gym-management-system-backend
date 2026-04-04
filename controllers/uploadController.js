import { bucket } from '../config/firebase.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/upload/member-image
 * Uploads a member photo to Firebase Storage → member_images/
 * Returns { url: "<public download URL>" }
 */
export const uploadMemberImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    const ext      = path.extname(req.file.originalname) || '.jpg';
    const fileName = `member_images/${uuidv4()}${ext}`;
    const file     = bucket.file(fileName);

    // Stream buffer to Firebase Storage
    await new Promise((resolve, reject) => {
      const stream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
          metadata: { firebaseStorageDownloadTokens: uuidv4() },
        },
        resumable: false,
      });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(req.file.buffer);
    });

    // Make it publicly readable
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    res.status(201).json({ url: publicUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: error.message || 'Image upload failed.' });
  }
};

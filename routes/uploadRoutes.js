import express from 'express';
import { uploadMemberImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// POST /api/upload/member-image
router.post('/member-image', protect, upload.single('photo'), uploadMemberImage);

export default router;

import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB   = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// Store file in memory (buffer) — we stream it straight to Firebase
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

export default upload;

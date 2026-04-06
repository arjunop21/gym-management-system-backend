import express from 'express';
import { getAttendance, markAttendance, deleteAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getAttendance).post(protect, markAttendance);
router.route('/:id').delete(protect, deleteAttendance);

export default router;

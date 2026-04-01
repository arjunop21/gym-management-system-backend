import express from 'express';
import { getStaff, createStaff, updateStaff, deleteStaff, getStaffMembers } from '../controllers/staffController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getStaff).post(protect, createStaff);
router.route('/:id').put(protect, updateStaff).delete(protect, deleteStaff);
router.route('/:id/members').get(protect, getStaffMembers);

export default router;

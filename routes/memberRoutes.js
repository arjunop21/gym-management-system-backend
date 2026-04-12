import express from 'express';
import { getMembers, createMember, updateMember, deleteMember, getExpiringMembers, getExpiredMembers } from '../controllers/memberController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getMembers).post(protect, createMember);
router.route('/expiring-soon').get(protect, getExpiringMembers);
router.route('/expired').get(protect, getExpiredMembers);
router.route('/:id').put(protect, updateMember).delete(protect, deleteMember);

export default router;

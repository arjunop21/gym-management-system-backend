import express from 'express';
import { getDashboardStats, getReports } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/', protect, getReports);

export default router;

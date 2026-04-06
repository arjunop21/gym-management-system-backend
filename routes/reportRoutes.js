import express from 'express';
import { getDashboardStats, getReports, getChartData, getDynamicChartData } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/charts',    protect, getChartData);
router.get('/dynamic',   protect, getDynamicChartData);
router.get('/',          protect, getReports);

export default router;

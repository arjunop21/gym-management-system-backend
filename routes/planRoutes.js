import express from 'express';
import { getPlans, createPlan, updatePlan, deletePlan } from '../controllers/planController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getPlans).post(protect, createPlan);
router.route('/:id').put(protect, updatePlan).delete(protect, deletePlan);

export default router;

import express from 'express';
import { getPayments, createPayment, updatePayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getPayments).post(protect, createPayment);
router.route('/:id').put(protect, updatePayment);

export default router;

import express from 'express';
import { getPayments, createPayment, updatePayment, deletePayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getPayments).post(protect, createPayment);
router.route('/:id').put(protect, updatePayment).delete(protect, deletePayment);

export default router;

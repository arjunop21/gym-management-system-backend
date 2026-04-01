import express from 'express';
import { authAdmin, registerAdmin, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authAdmin);
router.post('/register', registerAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

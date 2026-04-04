import express from 'express';
import { authAdmin, registerAdmin, forgotPassword, resetPassword, changePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', authAdmin);
router.post('/register', registerAdmin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);

export default router;

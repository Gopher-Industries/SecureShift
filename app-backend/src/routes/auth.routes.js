import express from 'express';
import { register, login, verifyOTP } from '../controllers/auth.controller.js';

const router = express.Router();

// Auth API Routes — includes registration, login, and OTP verification
router.post('/register', register); // Create new user account
router.post('/login', login);       // Step 1: validate credentials + send OTP
router.post('/verify-otp', verifyOTP); // Step 2: confirm OTP + return token

export default router;

import express from 'express';
import { register, login, verifyOTP } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Krish Uppal
 *               email:
 *                 type: string
 *                 example: krish@example.com
 *               password:
 *                 type: string
 *                 example: P@ssw0rd!
 *               role:
 *                 type: string
 *                 enum: [guard, employer, admin]
 *                 example: guard
 *               phone:
 *                 type: string
 *                 example: "+61400123456"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: 123 Main Street
 *                   suburb:
 *                     type: string
 *                     example: Melbourne
 *                   state:
 *                     type: string
 *                     example: VIC
 *                   postcode:
 *                     type: string
 *                     example: "3000"
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already registered
 */
router.post('/register', register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login and retrieve a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: krish@example.com
 *               password:
 *                 type: string
 *                 example: P@ssw0rd!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6...
 *                 role:
 *                   type: string
 *                   example: guard
 *                 id:
 *                   type: string
 *                   example: 64d9fa5b5e18f9b9a3d52f77
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token issued
 *       401:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', verifyOTP);

export default router;

// routes/admin.routes.js
import express from 'express';
import { adminLogin, getAllUsers, getAllShifts } from '../controllers/admin.controller.js';
import auth from '../middleware/auth.js';
import { adminOnly } from '../middleware/role.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-specific operations
 */

/**
 * @swagger
 * /api/v1/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token returned on successful admin login
 *       403:
 *         description: Access denied (not an admin)
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', adminLogin);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Placeholder list of users
 *       403:
 *         description: Forbidden
 */
router.get('/users', auth, adminOnly, getAllUsers);

/**
 * @swagger
 * /api/v1/admin/shifts:
 *   get:
 *     summary: Get all shifts (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Placeholder list of shifts
 *       403:
 *         description: Forbidden
 */
router.get('/shifts', auth, adminOnly, getAllShifts);

export default router;

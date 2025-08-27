// routes/admin.routes.js
import express from 'express';
import { adminLogin, getAllUsers, getAllShifts, getAuditLogs, purgeAuditLogs } from '../controllers/admin.controller.js';
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

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Retrieve audit logs (admin only)
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         example: 50
 *         description: Number of logs per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter logs by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter logs by action type
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [guard, employer, admin]
 *         description: Filter logs by role
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of audit logs
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       500:
 *         description: Server error
 */
router.get('/audit-logs', auth, adminOnly, getAuditLogs);

/**
 * @swagger
 * /api/v1/admin/audit-logs/purge:
 *   delete:
 *     summary: Purge audit logs older than a given number of days (Admin only)
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         example: 30
 *         description: Purge logs older than this many days (default: 30)
 *     responses:
 *       200:
 *         description: Purge successful
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden, admin only
 *       500:
 *         description: Server error
 */
router.delete('/audit-logs/purge', auth, adminOnly, purgeAuditLogs);

export default router;

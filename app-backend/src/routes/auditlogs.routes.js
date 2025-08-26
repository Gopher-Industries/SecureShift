import express from 'express';
import { getAuditLogs } from '../controllers/auditlogs.controller.js';
import protect from '../middleware/auth.js';


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: Admin-only audit log routes
 */

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
router.get('/audit-logs', protect, getAuditLogs);


export default router;

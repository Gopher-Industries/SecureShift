// routes/admin.routes.js
import express from 'express';

import { 
    adminLogin, getAllUsers, getAllShifts, getAuditLogs, purgeAuditLogs, 
    getUserById, getAllMessages, deleteUserById, deleteMessageById,
    listPendingLicenses, verifyGuardLicense, rejectGuardLicense,
    getAdminSummary, 
} from '../controllers/admin.controller.js';

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
 *     summary: Get all active (non-deleted) users (Admin only)
 *     description: Returns users where isDeleted != true. Password is excluded.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users (non-deleted)
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
 * /api/v1/admin/audit-logs:
 *   get:
 *     summary: Retrieve audit logs (admin only)
 *     tags: [Admin]
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
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         example: 30
 *         description: "Purge logs older than this many days (default: 30)"
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

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Get a user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden
 */
router.get('/users/:id', auth, adminOnly, getUserById);

/**
 * @swagger
 * /api/v1/admin/messages:
 *   get:
 *     summary: Get all messages (Admin only)
 *     description: By default excludes soft-deleted messages. Use includeDeleted=true to include them.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *         description: Page size
 *       - in: query
 *         name: sender
 *         schema: { type: string }
 *         description: Filter by sender userId
 *       - in: query
 *         name: receiver
 *         schema: { type: string }
 *         description: Filter by receiver userId
 *       - in: query
 *         name: conversationId
 *         schema: { type: string }
 *         description: Filter by conversationId (smallerId_biggerId)
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: ISO date (filters timestamp >= from)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: ISO date (filters timestamp <= to)
 *       - in: query
 *         name: includeDeleted
 *         schema: { type: string, enum: ['true','false'], default: 'false' }
 *         description: Include soft-deleted messages when 'true'
 *     responses:
 *       200:
 *         description: List of messages (with pagination block)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/messages', auth, adminOnly, getAllMessages);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Soft-delete a user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to delete
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for deleting the user
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad request (self-delete or last admin)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', auth, adminOnly, deleteUserById);

/**
 * @swagger
 * /api/v1/admin/messages/{id}:
 *   delete:
 *     summary: Soft-delete a message by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB message _id
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Optional reason for deleting the message
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 */
router.delete('/messages/:id', auth, adminOnly, deleteMessageById);


/**
 * @swagger
 * /api/v1/admin/guards/pending:
 *   get:
 *     summary: List guards with pending license uploads
 *     description: Returns guards whose `license.status` is `pending`.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of guards with pending licenses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       500:
 *         description: Server error
 */
router.get('/guards/pending', auth, adminOnly, listPendingLicenses);


/**
 * @swagger
 * /api/v1/admin/guards/{id}/license/verify:
 *   patch:
 *     summary: Verify a guard's license
 *     description: Sets the guard's license status to **verified** and records reviewer & timestamp.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Guard's user ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: License verified successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Guard not found
 *       500:
 *         description: Server error
 */
router.patch('/guards/:id/license/verify', auth, adminOnly, verifyGuardLicense);

/**
 * @swagger
 * /api/v1/admin/guards/{id}/license/reject:
 *   patch:
 *     summary: Reject a guard's license
 *     description: Sets the guard's license status to **rejected** and can store an optional rejection reason.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Guard's user ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Photo is blurry; please re-upload a clearer image."
 *     responses:
 *       200:
 *         description: License rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Guard not found
 *       500:
 *         description: Server error
 */
router.patch('/guards/:id/license/reject', auth, adminOnly, rejectGuardLicense);



/**
 * @swagger
 * /api/v1/admin/summary:
 *   get:
 *     summary: Real-time summary metrics for the Admin Dashboard
 *     description: >
 *       Returns up-to-date counts for users, shifts, messages, and (optionally) payments.
 *       Payments may be zeroed if the payments model is not yet implemented.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform metrics payload
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers: { type: integer, example: 100 }
 *                 totalGuards: { type: integer, example: 60 }
 *                 totalEmployers: { type: integer, example: 35 }
 *                 totalAdmins: { type: integer, example: 5 }
 *                 shifts:
 *                   type: object
 *                   properties:
 *                     totalShifts:   { type: integer, example: 250 }
 *                     openShifts:    { type: integer, example: 40 }
 *                     assignedShifts:{ type: integer, example: 120 }
 *                     completedShifts:{ type: integer, example: 90 }
 *                     shiftsToday:   { type: integer, example: 10 }
 *                 payments:
 *                   type: object
 *                   description: May return zeros until Payment model is added.
 *                   properties:
 *                     totalPayments:  { type: integer, example: 90 }
 *                     paid:           { type: integer, example: 80 }
 *                     pending:        { type: integer, example: 10 }
 *                     totalAmountPaid:{ type: number,  example: 15200 }
 *                 messages:
 *                   type: object
 *                   properties:
 *                     totalMessages: { type: integer, example: 420 }
 *                     todayMessages: { type: integer, example: 35 }
 *                 activity:
 *                   type: object
 *                   properties:
 *                     newUsersToday:         { type: integer, example: 4 }
 *                     shiftsCreatedToday:    { type: integer, example: 6 }
 *                     paymentsProcessedToday:{ type: integer, example: 3 }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       500:
 *         description: Server error
 */
router.get('/summary', auth, adminOnly, getAdminSummary);

export default router;
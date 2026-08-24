// routes/admin.routes.js
import express from "express";

import {
  adminLogin,
  getAllUsers,
  getAllShifts,
  getAuditLogs,
  purgeAuditLogs,
  getUserById,
  getAllMessages,
  deleteUserById,
  deleteMessageById,
  listPendingDocuments,
  verifyGuardLicense,
  rejectGuardLicense,
  getSmtpSettings,
  updateSmtpSettings,
  testSmtpSettings,
} from "../controllers/admin.controller.js";

import auth from "../middleware/auth.js";
import { adminOnly } from "../middleware/role.js";

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
 *                 example: admin.local@secureshift.test
 *               password:
 *                 type: string
 *                 example: SecureShift1!
 *     responses:
 *       200:
 *         description: JWT token returned on successful admin login
 *       403:
 *         description: Access denied (not an admin)
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", adminLogin);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get active users with search, role filtering and pagination (Admin only)
 *     description: Returns active users where isDeleted != true. Passwords are excluded. Supports search by name or email, optional role filtering and capped pagination.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of users per page, capped at 50
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Case-insensitive search across user name and email
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *           enum: [guard, employer, admin]
 *         description: Filter users by role
 *     responses:
 *       200:
 *         description: Paginated list of active users
 *       400:
 *         description: Invalid pagination or role filter
 *       403:
 *         description: Forbidden
 */
router.get("/users", auth, adminOnly, getAllUsers);

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
router.get("/shifts", auth, adminOnly, getAllShifts);

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
router.get("/audit-logs", auth, adminOnly, getAuditLogs);

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
router.delete("/audit-logs/purge", auth, adminOnly, purgeAuditLogs);

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
router.get("/users/:id", auth, adminOnly, getUserById);

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
router.get("/messages", auth, adminOnly, getAllMessages);

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
router.delete("/users/:id", auth, adminOnly, deleteUserById);

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
router.delete("/messages/:id", auth, adminOnly, deleteMessageById);

/**
 * @swagger
 * /api/v1/admin/guards/pending:
 *   get:
 *    summary: List guards with pending documents uploads
 *    parameters:
 *      - in: query
 *        name: status
 *        schema:
 *          type: string`
 *          enum: [pending, verified, rejected, none, expired, expiring]
 *        description: Filter by document status
 *      - in: query
 *        name: type
 *        schema:
 *          type: string
 *          enum: [license, id_card, passport, firstAid, certificate, rsa, other]
 *          description: Filter by document type
 *    tags: [Admin]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: List of guards with pending documents
 *      401:
 *        description: Unauthorized
 *      403:
 *        description: Forbidden (admin only)
 *      500:
 *        description: Server error
 */
router.get("/guards/pending", auth, adminOnly, listPendingDocuments);

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
router.patch("/guards/:id/license/verify", auth, adminOnly, verifyGuardLicense);

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
router.patch("/guards/:id/license/reject", auth, adminOnly, rejectGuardLicense);

/**
 * @swagger
 * /api/v1/admin/smtp-settings:
 *   get:
 *     summary: Get SMTP settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SMTP settings (password is hidden)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.get("/smtp-settings", auth, adminOnly, getSmtpSettings);

/**
 * @swagger
 * /api/v1/admin/smtp-settings:
 *   put:
 *     summary: Update SMTP settings (Admin only)
 *     description: |
 *       Updates authenticated SMTP provider settings using string configuration values.
 *       `SMTP_USER` and `SMTP_PASS` are required together by this endpoint.
 *       Local Mailpit is configured through the runtime environment rather than this endpoint:
 *       containers use `SMTP_HOST=mailpit`, while a backend running directly on the host uses `SMTP_HOST=localhost`.
 *       Mailpit captures email locally and does not deliver it externally.
 *       This endpoint does not update `EMAIL_ENABLED` or `SMTP_AUTH_REQUIRED`.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - SMTP_HOST
 *               - SMTP_USER
 *               - SMTP_PASS
 *               - SMTP_FROM_EMAIL
 *             properties:
 *               SMTP_HOST:
 *                 type: string
 *               SMTP_PORT:
 *                 type: string
 *               SMTP_SECURE:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 description: String boolean persisted to the backend environment.
 *               SMTP_USER:
 *                 type: string
 *               SMTP_PASS:
 *                 type: string
 *                 format: password
 *               SMTP_FROM_EMAIL:
 *                 type: string
 *                 format: email
 *           examples:
 *             authenticatedProvider:
 *               summary: Authenticated SMTP provider
 *               value:
 *                 SMTP_HOST: smtp.example.com
 *                 SMTP_PORT: "587"
 *                 SMTP_SECURE: "false"
 *                 SMTP_USER: smtp-user
 *                 SMTP_PASS: replace-with-provider-secret
 *                 SMTP_FROM_EMAIL: noreply@example.com
 *     responses:
 *       200:
 *         description: SMTP settings updated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
router.put("/smtp-settings", auth, adminOnly, updateSmtpSettings);

/**
 * @swagger
 * /api/v1/admin/smtp-settings/test:
 *   post:
 *     summary: Test SMTP settings by sending a test email (Admin only)
 *     description: |
 *       Requires an authenticated admin bearer token.
 *       `testEmail` becomes the destination shown in the captured message headers.
 *       With local Mailpit, no message is delivered externally; view the captured test email at http://localhost:8025.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testEmail
 *             properties:
 *               testEmail:
 *                 type: string
 *                 format: email
 *                 example: admin-test@example.test
 *                 description: Destination address shown in the captured test message headers.
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *       400:
 *         description: Missing testEmail
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       500:
 *         description: Test email delivery failed
 */
router.post("/smtp-settings/test", auth, adminOnly, testSmtpSettings);

export default router;

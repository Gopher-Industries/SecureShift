// src/routes/v1/notification.routes.js
import express from 'express';
import { send } from '../../src/controllers/notification.controller.js';
import auth from '../../src/middleware/auth.js';

const router = express.Router();

/**
 * @openapi
 * /api/v1/notifications/send:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Send a push notification to guards
 *     description: Only Admin or Employer can send notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guardIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["64b7c1e1f9c9a2a7f2d12345"]
 *               tokens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["fakeDeviceToken123"]
 *               title:
 *                 type: string
 *                 example: "New Shift Available"
 *               body:
 *                 type: string
 *                 example: "A new night shift has been posted near your area."
 *               data:
 *                 type: object
 *                 example: { shiftId: "12345" }
 *               type:
 *                 type: string
 *                 enum: [SHIFT_NEW, SHIFT_UPDATE, MESSAGE]
 *                 example: SHIFT_NEW
 *     responses:
 *       200:
 *         description: Notification result
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send', auth, send);

export default router;

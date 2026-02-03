import express from 'express';
import { saveFcmToken } from '../controllers/notification.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/notifications/fcm-token:
 *   post:
 *     summary: Save FCM token for push notifications
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: fcm_token_here
 *     responses:
 *       200:
 *         description: Token saved
 *       400:
 *         description: Token missing
 *       500:
 *         description: Server error
 */
router.post('/fcm-token', auth, saveFcmToken);

export default router;

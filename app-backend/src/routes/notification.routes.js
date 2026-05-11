import express from 'express';
import auth from '../middleware/auth.js';
import loadUser from '../middleware/loadUser.js';
import {
  getNotifications,
  createNotification,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteExpiredNotifications,
  getHighPriorityUnread
} from '../controllers/notification.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Enhanced notification management with priority support
 */

/* =========================================================
   STATIC ROUTES
========================================================= */

router.get('/unread-count', auth, loadUser, getUnreadCount);
router.get('/unread/high-priority', auth, loadUser, getHighPriorityUnread);
router.patch('/read-all', auth, loadUser, markAllAsRead);
router.delete('/expired', auth, loadUser, deleteExpiredNotifications);

/* =========================================================
    MAIN ROUTES
========================================================= */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications with priority sorting
 *     parameters:
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH, CRITICAL] }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [SOS, INCIDENT, SHIFT, SYSTEM, DOCUMENT, PAYROLL] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [priority, date], default: priority }
 */
router.get('/', auth, loadUser, getNotifications);
router.post('/', auth, loadUser, createNotification);

/* =========================================================
   PARAM ROUTES
========================================================= */

router.get('/:id', auth, loadUser, getNotificationById);
router.patch('/:id/read', auth, loadUser, markAsRead);

export default router;
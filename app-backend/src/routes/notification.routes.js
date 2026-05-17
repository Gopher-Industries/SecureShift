import express from 'express';
import auth from '../middleware/auth.js';
import loadUser from '../middleware/loadUser.js';
import {
  getNotifications,
  createNotification,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../controllers/notification.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management system
 */

/* =========================================================
   STATIC ROUTES 
========================================================= */

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 */
router.get('/unread-count', auth, loadUser, getUnreadCount);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', auth, loadUser, markAllAsRead);

/* =========================================================
    MAIN ROUTES
========================================================= */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications (paginated)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           example: SHIFT_APPLIED
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *           example: false
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 */
router.get('/', auth, loadUser, getNotifications);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, type, message]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 example: SHIFT_APPLIED
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               data:
 *                 type: object
 */
router.post('/', auth, loadUser, createNotification);

/* =========================================================
   PARAM ROUTES 
========================================================= */

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get single notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', auth, loadUser, getNotificationById);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/read', auth, loadUser, markAsRead);

export default router;
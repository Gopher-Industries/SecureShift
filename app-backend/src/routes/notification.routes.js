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
 *   description: Notification management
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *            schema: 
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  example: 1
 *                type:
 *                  type: string
 *                  example: SHIFT_APPLIED
 *                title:
 *                  type: string
 *                  example: New Shift Application
 *                message:
 *                  type: string
 *                  example: A guard applied
 *                isRead:
 *                  type: bool
 *                  example: false
 *                createdAt:
 *                  type: string
 *                  example: 2026-03-19T10:00:00Z
 *     responses:
 *       200:
 *         description: Successfully get notification.
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.get('/', auth, loadUser, getNotifications);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *          application/json:
 *            schema: 
 *              type: object
 *              properties:
 *                userId:
 *                  type: string
 *                  example: string
 *                type:
 *                  type: string
 *                  example: SHIFT_APPLIED
 *                title:
 *                  type: string
 *                  example: New Shift Application
 *                message:
 *                  type: string
 *                  example: A guard has applied for your shift
 *                data:
 *                  type: object
 *                  properties:
 *                    shiftId:
 *                      type: string
 *                      example: 123
 *                    guardId:
 *                      type: string
 *                      example: 456
 *     responses:
 *       200:
 *         description: Successfully create notification.
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/', auth, loadUser, createNotification);

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

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/read-all', auth, loadUser, markAllAsRead);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
router.get('/unread-count', auth, loadUser, getUnreadCount);

export default router;
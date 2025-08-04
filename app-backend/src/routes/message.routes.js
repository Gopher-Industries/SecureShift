import { Router } from 'express';
import {
  sendMessage,
  getInboxMessages,
  getSentMessages,
  getConversation,
  markMessageAsRead,
  getMessageStats
} from "../controllers/message.controller.js";

//import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

//Todo: Uncomment the line below once authentication middleware is ready
// router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Messaging endpoints between guards and employers
 */

/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: string
 *               content:
 *                 type: string
 *           example:
 *             receiverId: "64ddf8411e72cd4b70586c30"
 *             content: "Hello, I'm interested in the security role."
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 messageId: "64f5261b63d4b9e3d4e3021a"
 *                 sender:
 *                   email: "guard1@example.com"
 *                 receiver:
 *                   email: "employer1@example.com"
 *                 content: "Hello, I'm interested in the security role."
 *                 timestamp: "2025-08-04T11:22:10.000Z"
 *                 isRead: false
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Receiver not found
 *       401:
 *         description: Unauthorized
 */
router.post('/', sendMessage);

/**
 * @swagger
 * /api/v1/messages/inbox:
 *   get:
 *     summary: Get inbox messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inbox retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Inbox messages retrieved successfully"
 *               data:
 *                 messages:
 *                   - _id: "64f5261b63d4b9e3d4e3021a"
 *                     sender:
 *                       email: "guard1@example.com"
 *                     receiver:
 *                       email: "employer1@example.com"
 *                     content: "Hello, I'm interested in the security role."
 *                     timestamp: "2025-08-04T11:22:10.000Z"
 *                     isRead: false
 *                 totalMessages: 1
 *                 unreadCount: 1
 *       401:
 *         description: Unauthorized
 */
router.get('/inbox', getInboxMessages);

/**
 * @swagger
 * /api/v1/messages/sent:
 *   get:
 *     summary: Get sent messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent messages retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Sent messages retrieved successfully"
 *               data:
 *                 messages:
 *                   - _id: "64f5261b63d4b9e3d4e3021a"
 *                     sender:
 *                       email: "guard1@example.com"
 *                     receiver:
 *                       email: "employer1@example.com"
 *                     content: "Hello, I'm interested in the security role."
 *                     timestamp: "2025-08-04T11:22:10.000Z"
 *                     isRead: false
 *                 pagination:
 *                   currentPage: 1
 *                   totalMessages: 1
 *       401:
 *         description: Unauthorized
 */
router.get('/sent', getSentMessages);

/**
 * @swagger
 * /api/v1/messages/conversation/{userId}:
 *   get:
 *     summary: Get conversation with specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Conversation retrieved successfully"
 *               data:
 *                 conversation:
 *                   participant:
 *                     id: "64ddf8411e72cd4b70586c30"
 *                     name: "Jane Smith"
 *                     email: "jane@example.com"
 *                     role: "employer"
 *                   messages:
 *                     - content: "Hello"
 *                       sender:
 *                         email: "guard@example.com"
 *                       receiver:
 *                         email: "jane@example.com"
 *                       timestamp: "2025-08-04T12:00:00.000Z"
 *                       isRead: true
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/conversation/:userId', getConversation);

/**
 * @swagger
 * /api/v1/messages/{messageId}/read:
 *   patch:
 *     summary: Mark a message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: messageId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Message marked as read"
 *               data:
 *                 messageId: "64f5261b63d4b9e3d4e3021a"
 *                 isRead: true
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:messageId/read', markMessageAsRead);

/**
 * @swagger
 * /api/v1/messages/stats:
 *   get:
 *     summary: Get message statistics
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Message statistics retrieved successfully"
 *               data:
 *                 unreadMessages: 3
 *                 sentMessages: 10
 *                 receivedMessages: 15
 *                 totalMessages: 25
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', getMessageStats);

export default router;

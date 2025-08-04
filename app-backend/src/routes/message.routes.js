import { Router } from 'express';
import {
  sendMessage,
  getInboxMessages,
  getSentMessages,
  getConversation,
} from "../controllers/message.controller.js";

import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);


/**
 * @swagger
 * /api/v1/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message from guard to employer or employer to guard
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageRequest'
 *           examples:
 *             guardToEmployer:
 *               summary: Guard sending message to employer
 *               value:
 *                 receiverId: "60d5ecb74b24a42b34d8e8f2"
 *                 content: "Hello, I'm interested in the security position you posted."
 *             employerToGuard:
 *               summary: Employer responding to guard
 *               value:
 *                 receiverId: "60d5ecb74b24a42b34d8e8f1"
 *                 content: "Thank you for your interest. When are you available for an interview?"
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               success: true
 *               message: "Message sent successfully"
 *               data:
 *                 messageId: "60d5ecb74b24a42b34d8e8f3"
 *                 sender:
 *                   _id: "60d5ecb74b24a42b34d8e8f1"
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   role: "guard"
 *                 receiver:
 *                   _id: "60d5ecb74b24a42b34d8e8f2"
 *                   name: "Jane Smith"
 *                   email: "jane@company.com"
 *                   role: "employer"
 *                 content: "Hello, I'm interested in the security position you posted."
 *                 timestamp: "2024-08-01T10:30:00.000Z"
 *                 conversationId: "60d5ecb74b24a42b34d8e8f1_60d5ecb74b24a42b34d8e8f2"
 *       400:
 *         description: Validation error or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation errors"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Unauthorized - Messages only allowed between guards and employers
 *       404:
 *         description: Receiver not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post('/', sendMessage);

/**
 * @swagger
 * /api/v1/messages/inbox:
 *   get:
 *     summary: Get inbox messages
 *     description: Retrieve all messages received by the logged-in user, sorted by timestamp (newest first)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inbox messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageListResponse'
 *             example:
 *               success: true
 *               message: "Inbox messages retrieved successfully"
 *               data:
 *                 messages:
 *                   - _id: "60d5ecb74b24a42b34d8e8f3"
 *                     sender:
 *                       _id: "60d5ecb74b24a42b34d8e8f1"
 *                       name: "John Doe"
 *                       email: "john@example.com"
 *                       role: "guard"
 *                     receiver:
 *                       _id: "60d5ecb74b24a42b34d8e8f2"
 *                       name: "Jane Smith"
 *                       email: "jane@company.com"
 *                       role: "employer"
 *                     content: "Hello, I'm interested in the security position."
 *                     timestamp: "2024-08-01T10:30:00.000Z"
 *                     isRead: false
 *                     conversationId: "60d5ecb74b24a42b34d8e8f1_60d5ecb74b24a42b34d8e8f2"
 *                 pagination:
 *                   currentPage: 1
 *                   totalPages: 5
 *                   totalMessages: 89
 *                   messagesPerPage: 20
 *                   hasNextPage: true
 *                   hasPrevPage: false
 *                 unreadCount: 12
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/inbox', getInboxMessages);

/**
 * @swagger
 * /api/v1/messages/sent:
 *   get:
 *     summary: Get sent messages
 *     description: Retrieve all messages sent by the logged-in user, sorted by timestamp (newest first)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Sent messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MessageListResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         messages:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Message'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *             example:
 *               success: true
 *               message: "Sent messages retrieved successfully"
 *               data:
 *                 messages:
 *                   - _id: "60d5ecb74b24a42b34d8e8f4"
 *                     sender:
 *                       _id: "60d5ecb74b24a42b34d8e8f2"
 *                       name: "Jane Smith"
 *                       email: "jane@company.com"
 *                       role: "employer"
 *                     receiver:
 *                       _id: "60d5ecb74b24a42b34d8e8f1"
 *                       name: "John Doe"
 *                       email: "john@example.com"
 *                       role: "guard"
 *                     content: "Thank you for your interest. When are you available?"
 *                     timestamp: "2024-08-01T11:00:00.000Z"
 *                     isRead: true
 *                     conversationId: "60d5ecb74b24a42b34d8e8f1_60d5ecb74b24a42b34d8e8f2"
 *                 pagination:
 *                   currentPage: 1
 *                   totalPages: 3
 *                   totalMessages: 45
 *                   messagesPerPage: 20
 *                   hasNextPage: true
 *                   hasPrevPage: false
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/sent', getSentMessages);

/**
 * @swagger
 * /api/v1/messages/conversation/{userId}:
 *   get:
 *     summary: Get conversation with specific user
 *     description: Retrieve conversation history between logged-in user and specified user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the other user in the conversation
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of messages to retrieve
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversation:
 *                       type: object
 *                       properties:
 *                         participant:
 *                           $ref: '#/components/schemas/UserBasic'
 *                         messages:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Message'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/conversation/:userId', getConversation);

/**
 * @swagger
 * /api/v1/messages/{messageId}/read:
 *   patch:
 *     summary: Mark message as read
 *     description: Mark a specific message as read (only by the receiver)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message to mark as read
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Message marked as read"
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                     isRead:
 *                       type: boolean
 *                       example: true
 */

export default router;
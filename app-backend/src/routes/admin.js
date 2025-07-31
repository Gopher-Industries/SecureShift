import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import {
  getUsersList,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getUserStats
} from '../controllers/adminController.js';

const router = express.Router();

// Apply authentication and admin role check to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only endpoints for user management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserListResponse:
 *       type: object
 *       properties:
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             pages:
 *               type: integer
 *         filters:
 *           type: object
 *           properties:
 *             role:
 *               type: string
 *             isActive:
 *               type: boolean
 *             search:
 *               type: string
 *     
 *     RoleUpdateRequest:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, admin, moderator]
 *       example:
 *         role: "moderator"
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with pagination and filters
 *     tags: [Admin]
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
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, moderator]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username or email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [username, email, role, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: Unauthorized - Invalid token or not authenticated
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Server error
 */
router.get('/users', getUsersList);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:id', getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleUpdateRequest'
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid role or user ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required or cannot modify self
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/users/:id/role', updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}/toggle-status:
 *   patch:
 *     summary: Toggle user active status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required or cannot modify self
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/users/:id/toggle-status', toggleUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedUser:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required or cannot delete self
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/users/:id', deleteUser);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 activeUsers:
 *                   type: integer
 *                 inactiveUsers:
 *                   type: integer
 *                 usersByRole:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: integer
 *                     admin:
 *                       type: integer
 *                     moderator:
 *                       type: integer
 *                 recentRegistrations:
 *                   type: integer
 *                   description: Users registered in the last 7 days
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       500:
 *         description: Server error
 */
router.get('/stats', getUserStats);

export default router;

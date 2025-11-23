// app-backend/src/routes/user.routes.js
import express from 'express';
import auth from '../middleware/auth.js';
import loadUser from '../middleware/loadUser.js';
import {
  authorizeRoles,
  authorizePermissions,
  requireSameBranchAsTargetUser,
  ROLES,
} from '../middleware/rbac.js';
import {
  getMyProfile,
  updateMyProfile,
  adminGetUserProfile,
  adminUpdateUserProfile,
  getAllGuards,
  listUsers,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved profile.
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: newPassword123
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *     responses:
 *       200:
 *         description: Successfully updated profile.
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router
  .route('/me')
  .get(auth, loadUser, getMyProfile)
  .put(auth, loadUser, updateMyProfile);

/**
 * @swagger
 * /api/v1/users/guards:
 *   get:
 *     summary: Get all guards (Admin + Employee only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all guards.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/guards',
  auth,
  loadUser,
  authorizeRoles(ROLES.ADMIN, ROLES.EMPLOYEE),
  authorizePermissions('user:read'),
  getAllGuards
);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved users.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  auth,
  loadUser,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BRANCH_ADMIN),
  authorizePermissions('user:read', { any: true }),
  listUsers
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Admin – get another user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user.
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   put:
 *     summary: Admin – update another user's profile
 *     tags: [Users]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 example: jane.smith@example.com
 *               password:
 *                 type: string
 *                 example: AdminUpdated123
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: admin
 *     responses:
 *       200:
 *         description: Successfully updated user.
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router
  .route('/:userId')
  .get(
    auth,
    loadUser,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    authorizePermissions('user:read'),
    adminGetUserProfile
  )
  .put(
    auth,
    loadUser,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BRANCH_ADMIN),
    authorizePermissions('user:write'),
    requireSameBranchAsTargetUser({ paramKey: 'userId' }),
    adminUpdateUserProfile
  )
  .patch(
    auth,
    loadUser,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BRANCH_ADMIN),
    authorizePermissions('user:write'),
    requireSameBranchAsTargetUser({ paramKey: 'userId' }),
    updateUser
  )
  .delete(
    auth,
    loadUser,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    authorizePermissions('user:delete'),
    deleteUser
  );

export default router;

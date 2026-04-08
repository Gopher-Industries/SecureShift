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
import userController from '../container/user.container.js';

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
 *       404:
 *         description: User not found
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
 *               phone:
 *                 type: string
 *                 example: "+61400123456"
 *               address:
 *                 type: string
 *                 example: 123 Main Street
 *     responses:
 *       200:
 *         description: Successfully updated profile.
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       422:
 *         description: Validation error
 */
router
  .route('/me')
  .get(auth, loadUser, userController.getMyProfile)
  .put(auth, loadUser, userController.updateMyProfile);

/**
 * @swagger
 * /api/v1/users/push-token:
 *   post:
 *     summary: Register a push notification token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: expo_push_token_here
 *               platform:
 *                 type: string
 *                 example: android
 *               deviceId:
 *                 type: string
 *                 example: device-123
 *     responses:
 *       200:
 *         description: Push token registered successfully.
 *       400:
 *         description: Push token is required.
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/push-token',
  auth,
  loadUser,
  userController.registerPushToken
);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get logged-in employer's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved employer profile.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only employers)
 *       404:
 *         description: Employer not found
 *   put:
 *     summary: Update logged-in employer's profile
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
 *                 example: Krish Uppal
 *               email:
 *                 type: string
 *                 example: krish@example.com
 *               phone:
 *                 type: string
 *                 example: "+61400123456"
 *               address:
 *                 type: string
 *                 example: 123 Main Street
 *     responses:
 *       200:
 *         description: Successfully updated employer profile.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Employer not found
 *       422:
 *         description: Validation error
 */
router
  .route('/profile')
  .get(auth, loadUser, userController.getEmployerProfile)
  .put(auth, loadUser, userController.updateEmployerProfile);

/**
 * @swagger
 * /api/v1/users/favourites:
 *   get:
 *     summary: Get favourite guards
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favourite guards
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only employers allowed
 *       404:
 *         description: Employer not found
 */
router.get(
  '/favourites',
  auth,
  loadUser,
  userController.getFavouriteGuards
);

/**
 * @swagger
 * /api/v1/users/favourites/{guardId}:
 *   post:
 *     summary: Add a guard to favourites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guard ID
 *     responses:
 *       200:
 *         description: Guard added to favourites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only employers allowed
 *       404:
 *         description: Guard or employer not found
 */
router.post(
  '/favourites/:guardId',
  auth,
  loadUser,
  userController.addFavouriteGuard
);

/**
 * @swagger
 * /api/v1/users/favourites/{guardId}:
 *   delete:
 *     summary: Remove a guard from favourites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guard ID
 *     responses:
 *       200:
 *         description: Guard removed from favourites
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only employers allowed
 *       404:
 *         description: Employer not found
 */
router.delete(
  '/favourites/:guardId',
  auth,
  loadUser,
  userController.removeFavouriteGuard
);

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
  userController.getAllGuards
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
  userController.listUsers
);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Admin get another user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Successfully retrieved user.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   put:
 *     summary: Admin update another user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               role:
 *                 type: string
 *                 example: admin
 *               phone:
 *                 type: string
 *                 example: "+61400111222"
 *               address:
 *                 type: string
 *                 example: 25 Collins Street
 *     responses:
 *       200:
 *         description: Successfully updated user.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Admin delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router
  .route('/:userId')
  .get(
    auth,
    loadUser,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    authorizePermissions('user:read'),
    userController.adminGetUserProfile
  )
  .put(
    auth,
    loadUser,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BRANCH_ADMIN),
    authorizePermissions('user:write'),
    requireSameBranchAsTargetUser({ paramKey: 'userId' }),
    userController.adminUpdateUserProfile
  )
  .delete(
    auth,
    loadUser,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
    authorizePermissions('user:delete'),
    userController.deleteUser
  );

export default router;
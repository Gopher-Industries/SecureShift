import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  adminGetUserProfile,
  adminUpdateUserProfile,
  getAllGuards
} from '../controllers/user.controller.js';
import protect from '../middleware/auth.js'; // only default export available

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

// Middleware to restrict access to admin users only
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  next();
};

router
  .route('/me')
  .get(protect, getMyProfile)
  .put(protect, updateMyProfile);

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
// must be above the "/:id" route
router.get('/guards', protect, (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  next();
}, getAllGuards);

router
  .route('/:id')
  .get(protect, authorizeAdmin, adminGetUserProfile)
  .put(protect, authorizeAdmin, adminUpdateUserProfile);


export default router;

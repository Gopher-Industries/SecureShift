import express from 'express';
import {
  getMyProfile,
  updateMyProfile,
  adminGetUserProfile,
  adminUpdateUserProfile
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
 *             $ref: '#/components/schemas/User'
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
 *             $ref: '#/components/schemas/User'
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
  .route('/:id')
  .get(protect, authorizeAdmin, adminGetUserProfile)
  .put(protect, authorizeAdmin, adminUpdateUserProfile);

export default router;

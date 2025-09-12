import express from 'express';
import * as availabilityController from '../controllers/availability.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Availability
 *   description: API to manage user availability
 */

/**
 * @swagger
 * /api/v1/availability:
 *   post:
 *     summary: Create or update user availability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Availability data to create or update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID (Admin only)
 *                 example: "60d0fe4f5311236168a109ca"
 *               days:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Monday", "Wednesday", "Friday"]
 *                 description: List of preferred days
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["09:00-12:00", "14:00-18:00"]
 *                 description: Time slots in HH:MM-HH:MM format
 *             required:
 *               - days
 *               - timeSlots
 *     responses:
 *       200:
 *         description: Availability saved or updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Availability saved.
 *                 availability:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     days:
 *                       type: array
 *                       items:
 *                         type: string
 *                     timeSlots:
 *                       type: array
 *                       items:
 *                         type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       403:
 *         description: Forbidden (access denied)
 */

/**
 * Create or update availability for a user (upsert).
 */
router.post('/', auth, availabilityController.createOrUpdateAvailability);

/**
 * @swagger
 * /api/v1/availability/{userId}:
 *   get:
 *     summary: Get availability for a specific user by userId
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch availability for
 *     responses:
 *       200:
 *         description: Availability found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availability:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     days:
 *                       type: array
 *                       items:
 *                         type: string
 *                     timeSlots:
 *                       type: array
 *                       items:
 *                         type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized (no or invalid token)
 *       403:
 *         description: Forbidden (access denied)
 *       404:
 *         description: Availability not found
 */

/**
 * Get availability for a user by userId.
 */
router.get('/:userId', auth, availabilityController.getAvailability);

/**
 * List all availabilities (admin only)
 */
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  const availabilities = await availabilityController.listAllAvailabilities();
  res.json(availabilities);
});

export default router;

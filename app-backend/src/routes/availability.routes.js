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
 * =========================
 * CREATE / UPDATE AVAILABILITY
 * =========================
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID (Admin only)
 *               days:
 *                 type: array
 *                 items:
 *                   type: string
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - days
 *               - timeSlots
 *     responses:
 *       200:
 *         description: Availability saved successfully
 */
router.post(
  '/',
  auth,
  availabilityController.createOrUpdateAvailability
);

/**
 * =========================
 * GET AVAILABILITY BY USER
 * =========================
 */

/**
 * @swagger
 * /api/v1/availability/{userId}:
 *   get:
 *     summary: Get availability for a user
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     responses:
 *       200:
 *         description: Availability found
 */
router.get(
  '/:userId',
  auth,
  availabilityController.getAvailability
);

/**
 * =========================
 * 🔥 NEW: UPDATE LIVE STATUS
 * =========================
 */

/**
 * @swagger
 * /api/v1/availability/status:
 *   patch:
 *     summary: Update live availability status (AVAILABLE / BUSY / OFF_DUTY)
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BUSY, OFF_DUTY]
 *                 example: AVAILABLE
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Availability not found
 */
router.patch(
  '/status',
  auth,
  availabilityController.updateAvailabilityStatus
);

export default router;
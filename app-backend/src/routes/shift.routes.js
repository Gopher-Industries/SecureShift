import express from 'express';
import * as shiftController from '../controllers/shift.controller.js';
import authenticate from '../middleware/auth.js';
import { allowRoles as authorize } from '../middleware/roles.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift management endpoints
 */

/**
 * @swagger
 * /shifts:
 *   post:
 *     summary: Create a new shift (Employer only)
 *     description: Employers can create a new shift by providing start time, end time, and location.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *               - location
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-08-10T08:00:00Z"
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-08-10T16:00:00Z"
 *               location:
 *                 type: string
 *                 example: "Sydney CBD"
 *               description:
 *                 type: string
 *                 example: "Night shift guard needed"
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', authenticate, authorize(['Employer']), shiftController.createShift);

/**
 * @swagger
 * /shifts/{id}/apply:
 *   post:
 *     summary: Apply for a shift (Guard only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID to apply for
 *     responses:
 *       200:
 *         description: Successfully applied to the shift
 *       400:
 *         description: Could not apply for the shift
 */
router.post('/:id/apply', authenticate, authorize(['Guard']), shiftController.applyForShift);

/**
 * @swagger
 * /shifts/{id}/approve:
 *   post:
 *     summary: Approve a guard for a shift (Employer/Admin only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID to approve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - guardId
 *             properties:
 *               guardId:
 *                 type: string
 *                 example: "64e93db4f0d23e456789abcd"
 *     responses:
 *       200:
 *         description: Guard approved successfully
 *       400:
 *         description: Could not approve shift
 */
router.post('/:id/approve', authenticate, authorize(['Employer', 'Admin']), shiftController.approveShift);

/**
 * @swagger
 * /shifts/{id}/complete:
 *   post:
 *     summary: Mark a shift as completed (Employer/Admin only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID to mark as completed
 *     responses:
 *       200:
 *         description: Shift marked as completed
 *       400:
 *         description: Could not complete shift
 */
router.post('/:id/complete', authenticate, authorize(['Employer', 'Admin']), shiftController.completeShift);

/**
 * @swagger
 * /shifts/my:
 *   get:
 *     summary: Get shifts for the logged-in user
 *     description: Returns all shifts for the authenticated user. Can be filtered by status.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, approved, completed]
 *         description: Optional status filter
 *     responses:
 *       200:
 *         description: List of user shifts
 *       400:
 *         description: Could not fetch shifts
 */
router.get('/my', authenticate, shiftController.getMyShifts);

/**
 * @swagger
 * /shifts/{id}/rate:
 *   post:
 *     summary: Submit a rating for a completed shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               feedback:
 *                 type: string
 *                 example: "The guard was punctual and professional."
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 *       400:
 *         description: Could not submit rating
 */
router.post('/:id/rate', authenticate, authorize(['Guard','Employer']), shiftController.rateShift);

export default router;

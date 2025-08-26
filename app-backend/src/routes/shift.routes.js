import express from 'express';
import protect from '../middleware/auth.js';
import {
  createShift,
  applyForShift,
  approveShift,
  completeShift,
  getMyShifts,
  rateShift,
} from '../controllers/shift.controller.js';

const router = express.Router();

// Inline role guard
const authorizeRole = (...allowed) => (req, res, next) => {
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: End-to-end lifecycle for shifts
 */

/**
 * @swagger
 * /api/v1/shifts:
 *   post:
 *     summary: Create a shift (Employer only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, date, startTime, endTime]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Night Patrol"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-08-25"
 *               startTime:
 *                 type: string
 *                 example: "20:00"
 *               endTime:
 *                 type: string
 *                 example: "23:00"
 *               location:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "10 Dock Rd"
 *                   suburb:
 *                     type: string
 *                     example: "Port Melbourne"
 *                   state:
 *                     type: string
 *                     example: "VIC"
 *                   postcode:
 *                     type: string
 *                     example: "3207"
 *               urgency:
 *                 type: string
 *                 enum: [normal, priority, last-minute]
 *                 example: "normal"
 *               field:
 *                 type: string
 *                 example: "warehouse"
 *     responses:
 *       201:
 *         description: Shift created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', protect, authorizeRole('employer'), createShift);

/**
 * @swagger
 * /api/v1/shifts/{id}/apply:
 *   put:
 *     summary: Apply for a shift (Guard only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Shift ID
 *     responses:
 *       200: { description: Application submitted }
 *       400: { description: Duplicate application or invalid state }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Shift not found }
 */
router.put('/:id/apply', protect, authorizeRole('guard'), applyForShift);

/**
 * @swagger
 * /api/v1/shifts/{id}/approve:
 *   put:
 *     summary: Approve a guard (Employer/Admin)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [guardId]
 *             properties:
 *               guardId:
 *                 type: string
 *                 description: User ID of guard
 *               keepOthers:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200: { description: Guard approved and shift assigned }
 *       400: { description: Guard not in applicants or invalid state }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Shift not found }
 */
router.put('/:id/approve', protect, authorizeRole('employer', 'admin'), approveShift);

/**
 * @swagger
 * /api/v1/shifts/{id}/complete:
 *   put:
 *     summary: Mark shift as completed (Employer/Admin)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Shift ID
 *     responses:
 *       200: { description: Shift marked as completed }
 *       400: { description: Not assigned or already completed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Shift not found }
 */
router.put('/:id/complete', protect, authorizeRole('employer', 'admin'), completeShift);

/**
 * @swagger
 * /api/v1/shifts/myshifts:
 *   get:
 *     summary: Get shifts for the logged-in user
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [past] }
 *         required: false
 *         description: Filter completed shifts
 *     responses:
 *       200: { description: List of shifts }
 *       401: { description: Unauthorized }
 */
router.get('/myshifts', protect, getMyShifts);

/**
 * @swagger
 * /api/v1/shifts/{id}/rate:
 *   patch:
 *     summary: Submit a rating (role-aware)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       200: { description: Rating saved }
 *       400: { description: Invalid state or duplicate rating }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Shift not found }
 */
router.patch('/:id/rate', protect, authorizeRole('guard', 'employer'), rateShift);

export default router;

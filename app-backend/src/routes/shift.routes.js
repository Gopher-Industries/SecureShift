import express from 'express';
import protect from '../middleware/auth.js';
import {
  createShift,
  applyForShift,
  approveShift,
  completeShift,
  getMyShifts,
  rateShift,
  listAvailableShifts, // dynamic by role
} from '../controllers/shift.controller.js';

const router = express.Router();

/**
 * Inline role guards (same pattern as authorizeAdmin in users.route)
 */
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
 *   get:
 *     summary: List shifts (dynamic by role)
 *     description: |
 *       • **Guard** → Available shifts (`open`/`applied`) not created by the guard, date ≥ today.  
 *       • **Employer** → Your shifts with applicants waiting for approval (`status: applied`).  
 *       • **Admin** → All shifts with applicants waiting for approval (`status: applied`).  
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: false
 *         description: Case-insensitive search in title/field
 *       - in: query
 *         name: urgency
 *         schema:
 *           type: string
 *           enum: [normal, priority, last-minute]
 *         required: false
 *         description: Filter by urgency
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         required: false
 *         description: Page number (pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         required: false
 *         description: Page size (pagination)
 *     responses:
 *       200: { description: Paged list of shifts per role rules }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
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
 *                 description: "HH:MM (24h)"
 *               endTime:
 *                 type: string
 *                 example: "23:00"
 *                 description: "HH:MM (24h), must be after startTime (same day)"
 *               location:
 *                 type: object
 *                 properties:
 *                   street:   { type: string, example: "10 Dock Rd" }
 *                   suburb:   { type: string, example: "Port Melbourne" }
 *                   state:    { type: string, example: "VIC" }
 *                   postcode: { type: string, example: "3207", description: "4 digits (AU)" }
 *               urgency:
 *                 type: string
 *                 enum: [normal, priority, last-minute]
 *                 example: "normal"
 *               field:
 *                 type: string
 *                 example: "warehouse"
 *     responses:
 *       201: { description: Shift created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router
  .route('/')
  .get(protect, authorizeRole('guard', 'employer', 'admin'), listAvailableShifts)
  .post(protect, authorizeRole('employer'), createShift);

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
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200: { description: Application submitted }
 *       400: { description: Duplicate application or invalid state }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Shift not found }
 */
router
  .route('/:id/apply')
  .put(protect, authorizeRole('guard'), applyForShift);

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
 *         schema:
 *           type: string
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
 *                 description: "User ID of guard"
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
router
  .route('/:id/approve')
  .put(protect, authorizeRole('employer', 'admin'), approveShift);

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
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200: { description: Shift marked as completed }
 *       400: { description: Not assigned or already completed }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Shift not found }
 */
router
  .route('/:id/complete')
  .put(protect, authorizeRole('employer', 'admin'), completeShift);

/**
 * @swagger
 * /api/v1/shifts/myshifts:
 *   get:
 *     summary: Get shifts for the logged-in user
 *     description: |
 *       Guard → applied/assigned/past  
 *       Employer → created  
 *       Admin → all  
 *       Use `?status=past` to return only completed shifts.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [past]
 *         required: false
 *         description: Filter completed shifts
 *     responses:
 *       200: { description: List of shifts }
 *       401: { description: Unauthorized }
 */
router
  .route('/myshifts')
  .get(protect, getMyShifts);

/**
 * @swagger
 * /api/v1/shifts/{id}/rate:
 *   patch:
 *     summary: Submit a rating (role-aware)
 *     description: |
 *       • Guard: Only the **assignedGuard** can rate. Updates **guardRating** (one time, tracked by `ratedByGuard`).  
 *       • Employer: Only the **creator (employer)** can rate. Updates **employerRating** (one time, tracked by `ratedByEmployer`).  
 *       • Ratings are allowed **only after** the shift status is `completed`.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       200:
 *         description: Rating saved (guardRating or employerRating based on role)
 *       400:
 *         description: Invalid state (not completed) or duplicate rating
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (only assigned guard or employer/creator may rate)
 *       404:
 *         description: Shift not found
 */
router
  .route('/:id/rate')
  .patch(protect, authorizeRole('guard', 'employer'), rateShift);

export default router;

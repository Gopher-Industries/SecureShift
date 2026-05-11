import express from 'express';
import auth from '../middleware/auth.js';
import { getTimesheetById, listTimesheets } from '../controllers/timesheet.controller.js';

const router = express.Router();

const authorizeRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorised' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }

  next();
};

/**
 * @swagger
 * tags:
 *   name: Timesheets
 *   description: Read-only generated timesheet records
 */

/**
 * @swagger
 * /api/v1/timesheets:
 *   get:
 *     summary: List generated timesheets
 *     description: |
 *       Returns generated timesheets scoped by role.
 *       - Admin: all timesheets
 *       - Employer: timesheets for shifts they created
 *       - Guard: their own timesheets
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter from this shift date, in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter to this shift date, in YYYY-MM-DD format
 *       - in: query
 *         name: guardId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by guard. Guards remain restricted to their own authorised records.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [generated, pending_review]
 *         required: false
 *         description: Filter by timesheet status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         required: false
 *     responses:
 *       200:
 *         description: Timesheets retrieved successfully
 *       401:
 *         description: Unauthorised
 *       403:
 *         description: Forbidden
 */
router.get('/', auth, authorizeRole('admin', 'employer', 'guard'), listTimesheets);

/**
 * @swagger
 * /api/v1/timesheets/{id}:
 *   get:
 *     summary: Get a generated timesheet by id
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Timesheet ID
 *     responses:
 *       200:
 *         description: Timesheet retrieved successfully
 *       400:
 *         description: Invalid timesheet id
 *       401:
 *         description: Unauthorised
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Timesheet not found
 */
router.get('/:id', auth, authorizeRole('admin', 'employer', 'guard'), getTimesheetById);

export default router;

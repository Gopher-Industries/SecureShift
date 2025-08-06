import express from 'express';
import {
  createShift,
  applyForShift,
  approveShift,
  completeShift,
  getMyShifts,
  rateShift,
} from '../controllers/shift.controller.js';

import authMiddleware from '../middleware/auth.js';
// Optional: role-based access middleware
// import { authorizeRoles } from '../middleware/roles.js';

const router = express.Router();

/**
 * @route   POST /api/shifts
 * @desc    Create a new shift (Employer only)
 */
router.post('/', authMiddleware, /* authorizeRoles('employer'), */ createShift);

/**
 * @route   POST /api/shifts/:id/apply
 * @desc    Apply for a shift (Guard only)
 */
router.post('/:id/apply', authMiddleware, /* authorizeRoles('guard'), */ applyForShift);

/**
 * @route   POST /api/shifts/:id/approve
 * @desc    Approve a guard for a shift (Employer/Admin only)
 */
router.post('/:id/approve', authMiddleware, /* authorizeRoles('employer', 'admin'), */ approveShift);

/**
 * @route   POST /api/shifts/:id/complete
 * @desc    Mark a shift as completed (Employer/Admin only)
 */
router.post('/:id/complete', authMiddleware, /* authorizeRoles('employer', 'admin'), */ completeShift);

/**
 * @route   GET /api/shifts
 * @desc    Get shifts for the current user, optionally filtered by status
 */
router.get('/', authMiddleware, getMyShifts);

/**
 * @route   POST /api/shifts/:id/rate
 * @desc    Submit a rating for a completed shift (Guard/Employer only)
 */
router.post('/:id/rate', authMiddleware, /* authorizeRoles('guard', 'employer'), */ rateShift);

export default router;

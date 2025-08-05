import * as shiftService from '../services/shift.service.js';

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift management endpoints
 */

/**
 * Create a new shift (Employer only)
 */
export async function createShift(req, res) {
  const user = req.user;
  const shiftData = req.body;

  // Basic input validation can be expanded here if needed

  const result = await shiftService.createShift(user, shiftData);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(201).json({ success: true, shift: result.data });
}

/**
 * Apply for a shift (Guard only)
 */
export async function applyForShift(req, res) {
  const user = req.user;
  const shiftId = req.params.id;

  const result = await shiftService.applyForShift(user, shiftId);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(200).json({ success: true, shift: result.data });
}

/**
 * Approve a guard for a shift (Employer/Admin only)
 */
export async function approveShift(req, res) {
  const user = req.user;
  const shiftId = req.params.id;
  const { guardId } = req.body;

  if (!guardId) {
    return res.status(400).json({ success: false, message: 'guardId is required' });
  }

  const result = await shiftService.approveShift(user, shiftId, guardId);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(200).json({ success: true, shift: result.data });
}

/**
 * Mark a shift as completed (Employer/Admin only)
 */
export async function completeShift(req, res) {
  const user = req.user;
  const shiftId = req.params.id;

  const result = await shiftService.completeShift(user, shiftId);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(200).json({ success: true, shift: result.data });
}

/**
 * Get shifts based on user role and optional status filter
 */
export async function getMyShifts(req, res) {
  const user = req.user;
  const statusFilter = req.query.status;

  const result = await shiftService.getMyShifts(user, statusFilter);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(200).json({ success: true, shifts: result.data });
}

/**
 * Submit rating for a completed shift (Guard/Employer only)
 */
export async function rateShift(req, res) {
  const user = req.user;
  const shiftId = req.params.id;
  const ratingData = req.body;

  const result = await shiftService.rateShift(user, shiftId, ratingData);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(200).json({ success: true, shift: result.data });
}

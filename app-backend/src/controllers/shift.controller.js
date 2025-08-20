import * as shiftService from '../services/shift.services.js';

/**
 * Create a new shift
 * @route POST /shifts
 * @access Employer
 */
export async function createShift(req, res) {
  const user = req.user;
  const shiftData = req.body;

  const result = await shiftService.createShift(user, shiftData);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.error });
  }
  return res.status(201).json({ success: true, shift: result.data });
}

/**
 * Apply for a shift
 * @route POST /shifts/{id}/apply
 * @access Guard
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
 * Approve a guard for a shift
 * @route POST /shifts/{id}/approve
 * @access Employer/Admin
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
 * Mark a shift as completed
 * @route POST /shifts/{id}/complete
 * @access Employer/Admin
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
 * Get all shifts for the current user
 * @route GET /shifts/my
 * @queryParam {string} [status] - Optional filter by status (pending, approved, completed)
 * @access Guard/Employer/Admin
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
 * Rate a completed shift
 * @route POST /shifts/{id}/rate
 * @access Guard/Employer
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

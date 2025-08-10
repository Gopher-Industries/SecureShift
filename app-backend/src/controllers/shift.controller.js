import * as shiftService from '../services/shift.services.js';

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
 *     tags:
 *       - Shifts
 *     summary: Create a new shift (Employer only)
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Invalid input or error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
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
 * @swagger
 * /shifts/{id}/apply:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Apply for a shift (Guard only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the shift to apply for
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully applied to the shift
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Bad request (e.g. shift not found, already applied)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
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
 * @swagger
 * /shifts/{id}/approve:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Approve a guard for a shift (Employer/Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the shift to approve
 *         required: true
 *         schema:
 *           type: string
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
 *                 example: "64d1234567890abcdef12345"
 *     responses:
 *       200:
 *         description: Guard approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Bad request or not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
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
 * @swagger
 * /shifts/{id}/complete:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Mark a shift as completed (Employer/Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the shift to complete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shift marked as completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Bad request or not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
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
 * @swagger
 * /shifts/my:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get shifts based on user role and optional status filter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Optional status filter (e.g. past)
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of shifts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 shifts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Error fetching shifts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
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
 * @swagger
 * /shifts/{id}/rate:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Submit rating for a completed shift (Guard/Employer only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID of the shift to rate
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guardRating:
 *                 type: number
 *                 example: 4
 *               employerRating:
 *                 type: number
 *                 example: 5
 *     responses:
 *       200:
 *         description: Shift rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Bad request or rating error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
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

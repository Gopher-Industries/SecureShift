import express from 'express';
import protect from '../middleware/auth.js';
import {
    createShiftRequest,
    getShiftRequests,
    getShiftRequestById,
    updateShiftRequest,
    cancelShiftRequest,
} from '../controllers/shiftRequest.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ShiftRequests
 *   description: Shift swap and leave request management
 */

/**
 * @swagger
 * /api/v1/shifts/requests:
 *   post:
 *     summary: Create a shift request (SWAP or LEAVE)
 *     tags: [ShiftRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, originalShiftId, reason]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SWAP, LEAVE]
 *               targetGuardId:
 *                 type: string
 *                 description: Required for SWAP
 *               originalShiftId:
 *                 type: string
 *               replacementShiftId:
 *                 type: string
 *                 description: Optional for SWAP
 *               leaveStartDate:
 *                 type: string
 *                 format: date
 *                 description: Required for LEAVE
 *               leaveEndDate:
 *                 type: string
 *                 format: date
 *                 description: Required for LEAVE
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created successfully
 *       403:
 *         description: Only guards can create requests
 *       400:
 *         description: Validation error
 */
router.post('/requests', protect, createShiftRequest);

/**
 * @swagger
 * /api/v1/shifts/requests:
 *   get:
 *     summary: Get shift requests (role-based)
 *     tags: [ShiftRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SWAP, LEAVE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of shift requests
 */
router.get('/requests', protect, getShiftRequests);

/**
 * @swagger
 * /api/v1/shifts/requests/{id}:
 *   get:
 *     summary: Get a shift request by ID
 *     tags: [ShiftRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shift request details
 *       404:
 *         description: Request not found
 */
router.get('/requests/:id', protect, getShiftRequestById);

/**
 * @swagger
 * /api/v1/shifts/requests/{id}:
 *   patch:
 *     summary: Update shift request (approve/reject or target response)
 *     tags: [ShiftRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *                 description: For employer/admin
 *               rejectionReason:
 *                 type: string
 *               targetResponse:
 *                 type: string
 *                 enum: [ACCEPTED, DECLINED]
 *                 description: For target guard in SWAP requests
 *     responses:
 *       200:
 *         description: Request updated
 */
router.patch('/requests/:id', protect, updateShiftRequest);

/**
 * @swagger
 * /api/v1/shifts/requests/{id}:
 *   delete:
 *     summary: Cancel a pending request (guard only)
 *     tags: [ShiftRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request cancelled
 *       400:
 *         description: Cannot cancel approved/rejected request
 */
router.delete('/requests/:id', protect, cancelShiftRequest);

export default router;
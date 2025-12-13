import express from "express";
import { checkIn, checkOut } from "../controllers/shiftattendance.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// check-in
/**
 * @swagger
 * /api/v1/attendance/checkin/{shiftId}:
 *   post:
 *     summary: Guard check-in for a shift
 *     tags: [Shift Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         description: ID of the shift to check in to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -37.8496
 *               longitude:
 *                 type: number
 *                 example: 145.1140
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Not within shift area
 *       500:
 *         description: Server error
 */

router.post("/checkin/:shiftId", auth, checkIn);

// check-out
/**
 * @swagger
 * /api/v1/attendance/checkout/{shiftId}:
 *   post:
 *     summary: Guard check-out for a shift
 *     tags: [Shift Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         description: ID of the shift to check out from
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -37.8500
 *               longitude:
 *                 type: number
 *                 example: 145.1150
 *     responses:
 *       200:
 *         description: Check-out successful
 *       404:
 *         description: No check-in record found
 *       500:
 *         description: Server error
 */
router.post("/checkout/:shiftId", auth, checkOut);

export default router;

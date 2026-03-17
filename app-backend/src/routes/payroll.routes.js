import express from "express";
import auth from "../middleware/auth.js";
import { getPayrollSummary } from "../controllers/payroll.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/payroll:
 *   get:
 *     summary: Retrieve payroll summary for guards and employees
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the payroll period
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the payroll period
 *       - in: query
 *         name: periodType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Aggregation type for payroll summaries
 *       - in: query
 *         name: guardId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional filter for a specific guard
 *       - in: query
 *         name: site
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional filter for a specific site
 *       - in: query
 *         name: department
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional filter for a specific department
 *     responses:
 *       200:
 *         description: Payroll summary retrieved successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorised
 *       500:
 *         description: Server error
 */
router.get("/", auth, getPayrollSummary);

export default router;
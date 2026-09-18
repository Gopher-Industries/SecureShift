import express from "express";
import { getWorkforceAnalytics } from "../controllers/analytics.controller.js";
import auth from "../middleware/auth.js";
import { employerOnly } from "../middleware/rbac.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/analytics/workforce:
 *   get:
 *     summary: Get workforce analytics for the authenticated employer
 *     tags:
 *       - Analytics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional reporting period start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Optional reporting period end date
 *     responses:
 *       200:
 *         description: Employer workforce analytics returned successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Employer role required
 */
router.get("/workforce", auth, employerOnly, getWorkforceAnalytics);

export default router;

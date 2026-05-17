import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics for the logged-in employer
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 20
 *                     assigned:
 *                       type: integer
 *                       example: 5
 *                     completed:
 *                       type: integer
 *                       example: 10
 *                     cancelled:
 *                       type: integer
 *                       example: 2
 *                 recentShifts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Night Security Shift"
 *                       status:
 *                         type: string
 *                         example: "completed"
 *                       date:
 *                         type: string
 *                         format: date
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 reviews:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                       example: 4.2
 *                     totalRated:
 *                       type: integer
 *                       example: 12
 *       401:
 *         description: Unauthorized – invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/stats", auth, getDashboardStats);

export default router;

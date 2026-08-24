// src/routes/verification.routes.js
import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  startVerification,
  getStatus,
  recheckVerification,
} from "../controllers/verification.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Verification
 *     description: Guard licence verification (NSW + manual fallback)
 */

/**
 * @swagger
 * /api/v1/verification/start:
 *   post:
 *     summary: Start licence verification for a guard
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [guardId, jurisdiction, licenceNumber]
 *             properties:
 *               guardId:
 *                 type: string
 *               jurisdiction:
 *                 type: string
 *                 example: "NSW"
 *               licenceNumber:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: NSW verification attempted and result saved
 *       201:
 *         description: Manual verification created
 *       400:
 *         description: Required verification fields are missing
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/start", auth, startVerification);

/**
 * @swagger
 * /api/v1/verification/status/{guardId}:
 *   get:
 *     summary: Get the latest verification status for a guard
 *     description: Accessible by the guard themselves or an admin.
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guard ID
 *     responses:
 *       200:
 *         description: Latest verification status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: No verification found for this guard
 *       500:
 *         description: Internal server error
 */
router.get("/status/:guardId", auth, getStatus);

/**
 * @swagger
 * /api/v1/verification/recheck/{guardId}:
 *   post:
 *     summary: Recheck a guard licence verification
 *     description: Accessible by the guard themselves or an admin.
 *     tags: [Verification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guard ID
 *     responses:
 *       200:
 *         description: Verification recheck completed or manual verification moved to in_review
 *       400:
 *         description: Manual verification ID not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: No verification snapshot found
 *       500:
 *         description: Internal server error
 */
router.post("/recheck/:guardId", auth, recheckVerification);

/**
 * Admin-only: (later) you may add endpoints for admins to list manual verifications:
 * router.get('/manual', auth, adminOnly, listManual);
 * router.patch('/manual/:id', auth, adminOnly, completeManual);
 */

export default router;

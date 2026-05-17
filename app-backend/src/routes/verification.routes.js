// src/routes/verification.routes.js
import { Router } from 'express';
import auth from '../middleware/auth.js';
import { adminOnly } from '../middleware/role.js';
import {
  startVerification,
  getStatus,
  recheckVerification
} from '../controllers/verification.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *  - name: Verification
 *    description: Guard licence verification (NSW + manual fallback)
 */

/**
 * @swagger
 * /api/v1/verification/start:
 *   post:
 *     summary: Start licence verification for a guard
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [guardId, jurisdiction, licenceNumber]
 *             properties:
 *               guardId: { type: string }
 *               jurisdiction: { type: string, example: "NSW" }
 *               licenceNumber: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               dob: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Verification started
 */
router.post('/start', auth, startVerification);

/**
 * GET current status snapshot for a guard
 */
router.get('/status/:guardId', auth, getStatus);

/**
 * Force a recheck
 */
router.post('/recheck/:guardId', auth, recheckVerification);

/**
 * Admin-only: (later) you may add endpoints for admins to list manual verifications:
 * router.get('/manual', auth, adminOnly, listManual);
 * router.patch('/manual/:id', auth, adminOnly, completeManual);
 */

export default router;

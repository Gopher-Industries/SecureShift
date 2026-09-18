import express from "express";
import {
  triggerSOS,
  getSOSHistory,
  updateSOSStatus,
} from "../controllers/emergency.controller.js";
import { registerSOSInteractionRoutes } from "./sos.route-set.js";

// ✅ correct auth import
import auth from "../middleware/auth.js";

// ✅ correct role import (your file)
import { allowRoles } from "../middleware/rbac.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Emergency
 *   description: SOS Emergency Management APIs
 */

/**
 * @swagger
 * /api/v1/emergency/sos:
 *   post:
 *     summary: Trigger SOS alert
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     description: Guard triggers an emergency SOS alert with location details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -37.8136
 *               longitude:
 *                 type: number
 *                 example: 144.9631
 *               message:
 *                 type: string
 *                 example: "Emergency at site"
 *     responses:
 *       201:
 *         description: SOS triggered successfully
 */
router.post("/sos", auth, allowRoles("guard"), triggerSOS);

/**
 * @swagger
 * /api/v1/emergency/sos:
 *   get:
 *     summary: Get SOS history
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     description: Admin or employer can view SOS logs with optional filtering and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of SOS records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ESCALATED, RESOLVED, CANCELLED]
 *         description: Filter SOS records by status
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter records created on or after this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter records created on or before this date
 *     responses:
 *       200:
 *         description: SOS history fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of records returned on the current page
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 sos:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 */
router.get("/sos", auth, allowRoles("admin", "employer"), getSOSHistory);

registerSOSInteractionRoutes(router, "/sos");

/**
 * @swagger
 * /api/v1/emergency/sos/{id}:
 *   put:
 *     summary: Update SOS status
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     description: Admin/Employer transitions SOS status
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
 *                 enum: [ACTIVE, ESCALATED, RESOLVED, CANCELLED]
 *     responses:
 *       200:
 *         description: SOS updated
 */
router.put("/sos/:id", auth, allowRoles("admin", "employer"), updateSOSStatus);

export default router;

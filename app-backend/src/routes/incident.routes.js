import express from "express";
import {
  createIncident,
  updateIncident,
  getIncident,
  getIncidents,
  deleteIncident,
  uploadAttachment,
  getAttachment,
} from "../controllers/incident.controller.js";

import auth from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { upload } from "../config/multer.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Incident reporting and management
 */

router.use(auth);

/**
 * @swagger
 * /api/v1/incidents:
 *   post:
 *     summary: Create a new incident
 *     description: |
 *       Create a new incident report for a shift.
 *       Typically used by guards for shifts assigned to them.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftId
 *               - severity
 *               - description
 *             properties:
 *               shiftId:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 example: -37.8136
 *               longitude:
 *                 type: number
 *                 example: 144.9631
 *     responses:
 *       201:
 *         description: Incident created successfully
 *
 *   get:
 *     summary: List incidents
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shiftId
 *         schema:
 *           type: string
 *       - in: query
 *         name: guardId
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUBMITTED, IN_REVIEW, RESOLVED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */

router.post("/", authorizePermissions("incident:create"), createIncident);
router.get("/", authorizePermissions("incident:view"), getIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Retrieve a single incident
 *     tags: [Incidents]
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
 *         description: Incident retrieved successfully
 *
 *   patch:
 *     summary: Update an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [SUBMITTED, IN_REVIEW, RESOLVED]
 *                 example: IN_REVIEW
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *
 *   delete:
 *     summary: Soft-delete an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Incident deleted successfully
 */

router.patch("/:id", authorizePermissions("incident:update"), updateIncident);
router.get("/:id", authorizePermissions("incident:view"), getIncident);
router.delete("/:id", authorizePermissions("incident:delete"), deleteIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/attachments:
 *   post:
 *     summary: Upload an incident attachment
 *     description: |
 *       Upload a supported file (images, videos, audio, or PDFs) and attach it to an existing incident.
 *     tags: [Incidents]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Supported files: images, videos, audio, and PDFs.
 */

router.post(
  "/:id/attachments",
  authorizePermissions("incident:update"),
  upload.single("file"),
  uploadAttachment
);

/**
 * @swagger
 * /api/v1/incidents/{id}/attachments/{attachmentId}:
 *   get:
 *     summary: Retrieve/download an incident attachment
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 */

router.get(
  "/:id/attachments/:attachmentId",
  authorizePermissions("incident:view"),
  getAttachment
);

export default router;
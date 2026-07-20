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
 *       Supports optional GPS metadata through latitude and longitude.
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
 *                 example: "69f97b98bcb1382842655170"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: high
 *               description:
 *                 type: string
 *                 example: "Unauthorized access detected near the loading dock."
 *               latitude:
 *                 type: number
 *                 example: -37.8136
 *               longitude:
 *                 type: number
 *                 example: 144.9631
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       400:
 *         description: Missing or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or guard not assigned to shift
 *       404:
 *         description: Shift not found
 *
 *   get:
 *     summary: List incidents
 *     description: |
 *       Retrieve incidents with optional filters for shift, guard, severity,
 *       structured status lifecycle, and recorded date range.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shiftId
 *         schema:
 *           type: string
 *         description: Filter by shift ID
 *       - in: query
 *         name: guardId
 *         schema:
 *           type: string
 *         description: Filter by guard ID
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SUBMITTED, IN_REVIEW, RESOLVED]
 *         description: Filter by incident lifecycle status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Return incidents recorded on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Return incidents recorded on or before this date
 *     responses:
 *       200:
 *         description: Incidents retrieved successfully
 *       400:
 *         description: Invalid filter value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.post("/", authorizePermissions("incident:create"), createIncident);
router.get("/", authorizePermissions("incident:view"), getIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Retrieve a single incident
 *     description: |
 *       Return full incident details including shift, reporter, severity,
 *       status, recorded timestamp, GPS location, and attachments.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or outside authorized ownership/scope
 *       404:
 *         description: Incident not found
 *
 *   patch:
 *     summary: Update an incident
 *     description: |
 *       Update incident details with role-based restrictions.
 *
 *       Status follows the structured lifecycle:
 *       SUBMITTED → IN_REVIEW → RESOLVED.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
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
 *                 example: medium
 *                 description: Admin only
 *               description:
 *                 type: string
 *                 example: "Updated incident details after review."
 *               status:
 *                 type: string
 *                 enum: [SUBMITTED, IN_REVIEW, RESOLVED]
 *                 example: IN_REVIEW
 *                 description: Employer and admin only
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *       400:
 *         description: Invalid status value or invalid lifecycle transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or outside authorized ownership/scope
 *       404:
 *         description: Incident not found
 *
 *   delete:
 *     summary: Soft-delete an incident
 *     description: |
 *       Soft-delete an incident without permanently removing it from the database.
 *       This preserves audit history.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident not found
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
 *       Upload a supported file and attach it to an existing incident.
 *
 *       Supported files: images, videos, audio, and PDFs.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Images, videos, audio, and PDF files are supported.
 *     responses:
 *       200:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or outside authorized ownership/scope
 *       404:
 *         description: Incident not found
 */

router.post(
  "/:id/attachments",
  authorizePermissions("incident:update"),
  upload.single("file"),
  uploadAttachment,
);

/**
 * @swagger
 * /api/v1/incidents/{id}/attachments/{attachmentId}:
 *   get:
 *     summary: Retrieve/download an incident attachment
 *     description: Download or view a file attached to an incident.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident ID
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: Attachment returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden or outside authorized ownership/scope
 *       404:
 *         description: Incident or attachment not found
 */

router.get(
  "/:id/attachments/:attachmentId",
  authorizePermissions("incident:view"),
  getAttachment,
);

export default router;

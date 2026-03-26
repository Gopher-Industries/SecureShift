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
 *                 example: "65f1c6a3b5e18f9b9a3d52f77"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: "high"
 *               description:
 *                 type: string
 *                 example: "Unauthorized entry detected near the loading dock."
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       400:
 *         description: Missing or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shift not found
 *
 *   get:
 *     summary: List incidents
 *     description: |
 *       Retrieve incidents with optional filters:
 *       - shiftId
 *       - guardId
 *       - severity
 *       - status
 *       - startDate
 *       - endDate
 *
 *       Returned data is still subject to role-based filtering in the controller.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shiftId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by shift ID
 *       - in: query
 *         name: guardId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by guard ID
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         required: false
 *         description: Filter by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in-progress, resolved]
 *         required: false
 *         description: Filter by incident status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Return incidents created on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Return incidents created on or before this date
 *     responses:
 *       200:
 *         description: Incidents retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Create
router.post("/", authorizePermissions("incident:create"), createIncident);
router.get("/", authorizePermissions("incident:view"), getIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Retrieve a single incident
 *     description: |
 *       Return full incident details including reporter, shift, severity,
 *       status, timestamps, and attachments.
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
 *         description: Forbidden
 *       404:
 *         description: Incident not found
 *
 *   patch:
 *     summary: Update an incident
 *     description: |
 *       Update incident details such as severity, description, or status.
 *       Access is controlled by permissions and role-aware controller checks.
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
 *                 example: "medium"
 *               description:
 *                 type: string
 *                 example: "Updated after site supervisor review."
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, resolved]
 *                 example: "in-progress"
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident not found
 *
 *   delete:
 *     summary: Soft-delete an incident
 *     description: |
 *       Admin-only endpoint that soft-deletes an incident while preserving audit logs.
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
 *      Upload a supported file (such as an image or PDF) and attach it to an existing incident.
 *       Access to this endpoint requires incident update permission.
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
 *     responses:
 *       200:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident not found
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
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident or attachment not found
 */

router.get(
  "/:id/attachments/:attachmentId",
  authorizePermissions("incident:view"),
  getAttachment
);
export default router;
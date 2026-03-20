import express from 'express';
import {
  exportIncident,
  getIncidentById,
  getIncidents,
  markIncident,
  submitIncident,
  updateIncident,
} from '../controllers/incident.controller.js';
import auth from '../middleware/auth.js';
import { allRoles, employerOrAdmin, guardOnly } from '../middleware/role.js';
import { incidentAttachmentUpload } from "../config/multer.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Incident Report operations
 */

/**
 * @swagger
 * /api/v1/incidents:
 *   post:
 *     summary: Submit a new incident report (Guard only)
 *     description: Guard submits a new incident report. Supports uploading up to 5 attachments (images or PDFs).
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - shiftId
 *             properties:
 *               title:
 *                 type: string
 *                 description: Brief title of the incident
 *                 example: "Warehouse unauthorized access"
 *               description:
 *                 type: string
 *                 description: Detailed description of the incident
 *               shiftId:
 *                 type: string
 *                 description: Associated shift ID
 *               location:
 *                 type: string
 *                 description: Specific location where the incident occurred (optional)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Attachment files, max 5 files, 5MB limit per file
 *     responses:
 *       201:
 *         description: Incident report submitted successfully
 *       400:
 *         description: Bad request or file validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Guard access only)
 */
router.post('/', auth, guardOnly, incidentAttachmentUpload.array('attachments', 5), submitIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   put:
 *     summary: Update an incident report (All roles)
 *     description: |
 *       Update an existing incident report.
 *       Guards can only update the description and add attachments;
 *       Employers/Admins can update the status, severity, employer comments, description, and add attachments.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the incident report to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Updated detailed description
 *               status:
 *                 type: string
 *                 enum: [pending, resolved]
 *                 description: Incident status (employer/admin only)
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Incident severity (employer/admin only)
 *               employerComment:
 *                 type: string
 *                 description: Employer/Admin comment (employer/admin only)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New attachment files to add
 *     responses:
 *       200:
 *         description: Incident report updated successfully
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident not found
 */
router.put('/:id', auth, allRoles, incidentAttachmentUpload.array('attachments', 5), updateIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Get specific incident report details
 *     description: Employers/Admins can view any incident. Guards can only view their own incidents.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident Report ID
 *     responses:
 *       200:
 *         description: Successfully retrieved incident details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident not found
 */
router.get('/:id', auth, allRoles, getIncidentById);

/**
 * @swagger
 * /api/v1/incidents:
 *   get:
 *     summary: Get incident report list
 *     description: |
 *       Supports filtering via Query parameters.
 *       Employers/Admins can filter by any parameter.
 *       Guards can only see their own incidents.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: guardId
 *         schema:
 *           type: string
 *         description: Filter by specific Guard ID (employer/admin only)
 *       - in: query
 *         name: shiftId
 *         schema:
 *           type: string
 *         description: Filter by specific shift ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, resolved]
 *         description: Filter by incident status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by incident severity
 *     responses:
 *       200:
 *         description: Successfully retrieved incident list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', auth, allRoles, getIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}/status:
 *   patch:
 *     summary: Update incident status (Employer/Admin only)
 *     description: Mark the incident as resolved or pending
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, resolved]
 *                 example: resolved
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident not found
 */
router.patch('/:id/status', auth, employerOrAdmin, markIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/export:
 *   get:
 *     summary: Export incident report as PDF
 *     description: |
 *       Export incident report as PDF.
 *       Employers/Admins can export any incident.
 *       Guards can only export their own incidents.
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Incident Report ID
 *     responses:
 *       200:
 *         description: Successfully exported PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Incident not found
 */
router.get('/:id/export', auth, allRoles, exportIncident);

export default router;
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
import {allRoles, employerOrAdmin, guardOnly} from '../middleware/role.js';
import {incidentAttachmentUpload} from "../config/multer.js";

const router = express.Router();


router.post('/', auth, guardOnly, incidentAttachmentUpload.array('attachments', 5), submitIncident)
router.put('/', auth, allRoles, incidentAttachmentUpload.array('attachments', 5), updateIncident)
router.get('/:id', auth, employerOrAdmin, getIncidentById)
router.get('/', auth, employerOrAdmin, getIncidents)
router.patch('/:id/status', auth, employerOrAdmin, markIncident)
router.get('/:id/export', auth, employerOrAdmin, exportIncident)


/**
 * @swagger
 * tags:
 * name: Incidents
 * description: Incident Report operations
 */

/**
 * @swagger
 * /api/v1/incidents:
 * post:
 * summary: Submit a new incident report (Guard only)
 * description: Guard submits a new incident report. Supports uploading up to 5 attachments (images or PDFs).
 * tags: [Incidents]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * required:
 * - title
 * - description
 * - shiftId
 * properties:
 * title:
 * type: string
 * description: Brief title of the incident
 * example: "Warehouse unauthorized access"
 * description:
 * type: string
 * description: Detailed description of the incident
 * shiftId:
 * type: string
 * description: Associated shift ID
 * location:
 * type: string
 * description: Specific location where the incident occurred (optional)
 * severity:
 * type: string
 * enum: [low, medium, high, critical]
 * description: Severity level
 * attachments:
 * type: array
 * items:
 * type: string
 * format: binary
 * description: Attachment files, max 5 files, 5MB limit per file
 * responses:
 * 201:
 * description: Incident report submitted successfully
 * 400:
 * description: Bad request or file validation failed
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden (Guard access only)
 */
router.post('/', auth, guardOnly, incidentAttachmentUpload.array('attachments', 5), submitIncident);

/**
 * @swagger
 * /api/v1/incidents:
 * put:
 * summary: Update an incident report (All roles)
 * description: |
 * Update an existing incident report.
 * **Note:** Because the route path is `/` instead of `/:id`, please ensure the corresponding incident `id` is passed in the request body (FormData).
 * Guards can only update the description and attachments; Employers/Admins can update the status, severity, and employer comments.
 * tags: [Incidents]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * required:
 * - id
 * properties:
 * id:
 * type: string
 * description: ID of the incident report to update
 * description:
 * type: string
 * description: Updated detailed description
 * status:
 * type: string
 * enum: [pending, resolved]
 * severity:
 * type: string
 * enum: [low, medium, high, critical]
 * employerComment:
 * type: string
 * description: Employer/Admin comment
 * attachments:
 * type: array
 * items:
 * type: string
 * format: binary
 * description: Newly uploaded attachment files
 * responses:
 * 200:
 * description: Incident report updated successfully
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden
 * 404:
 * description: Incident not found
 */
router.put('/', auth, allRoles, incidentAttachmentUpload.array('attachments', 5), updateIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 * get:
 * summary: Get specific incident report details (Employer / Admin)
 * tags: [Incidents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: Incident Report ID
 * responses:
 * 200:
 * description: Successfully retrieved incident details
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden
 * 404:
 * description: Incident not found
 */
router.get('/:id', auth, employerOrAdmin, getIncidentById);

/**
 * @swagger
 * /api/v1/incidents:
 * get:
 * summary: Get incident report list (Employer / Admin)
 * description: Supports conditional filtering via Query parameters
 * tags: [Incidents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: guardId
 * schema:
 * type: string
 * description: Filter by specific Guard ID
 * - in: query
 * name: shiftId
 * schema:
 * type: string
 * description: Filter by specific shift ID
 * - in: query
 * name: status
 * schema:
 * type: string
 * enum: [pending, resolved]
 * description: Filter by incident status
 * - in: query
 * name: severity
 * schema:
 * type: string
 * enum: [low, medium, high, critical]
 * description: Filter by incident severity
 * responses:
 * 200:
 * description: Successfully retrieved incident list
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden
 */
router.get('/', auth, employerOrAdmin, getIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}/status:
 * patch:
 * summary: Update incident status (Employer / Admin)
 * description: Mark the incident as resolved or pending
 * tags: [Incidents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: Incident Report ID
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - status
 * properties:
 * status:
 * type: string
 * enum: [pending, resolved]
 * example: resolved
 * responses:
 * 200:
 * description: Status updated successfully
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden
 * 404:
 * description: Incident not found
 */
router.patch('/:id/status', auth, employerOrAdmin, markIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/export:
 * get:
 * summary: Export incident report as PDF (Employer / Admin)
 * tags: [Incidents]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: Incident Report ID
 * responses:
 * 200:
 * description: Successfully exported PDF file stream
 * content:
 * application/pdf:
 * schema:
 * type: string
 * format: binary
 * 401:
 * description: Unauthorized
 * 403:
 * description: Forbidden
 * 404:
 * description: Incident not found
 */
router.get('/:id/export', auth, employerOrAdmin, exportIncident);


export default router;
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

export default router;
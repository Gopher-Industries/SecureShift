import express from 'express';
import protect from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import {
  createShiftRequest,
  getShiftRequestById,
  getShiftRequests,
  updateShiftRequest,
} from '../controllers/shiftrequest.controller.js';

const router = express.Router();

router
  .route('/request')
  .post(protect, authorizeRoles('guard'), createShiftRequest);

router
  .route('/requests')
  .get(protect, authorizeRoles('guard', 'employer', 'admin'), getShiftRequests);

router
  .route('/request/:id')
  .get(protect, authorizeRoles('guard', 'employer', 'admin'), getShiftRequestById)
  .patch(protect, authorizeRoles('employer', 'admin'), updateShiftRequest);

export default router;

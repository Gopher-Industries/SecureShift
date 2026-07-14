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
  .route('/')
  .post(protect, authorizeRoles('guard'), createShiftRequest)
  .get(protect, authorizeRoles('guard', 'employer', 'admin'), getShiftRequests);

router
  .route('/:id')
  .get(protect, authorizeRoles('guard', 'employer', 'admin'), getShiftRequestById)
  .patch(protect, authorizeRoles('employer', 'admin'), updateShiftRequest);

export default router;

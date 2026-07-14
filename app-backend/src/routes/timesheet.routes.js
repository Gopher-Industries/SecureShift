import express from 'express';
import auth from '../middleware/auth.js';
import {
  generateTimesheetsForRange,
  getTimesheetById,
  listTimesheets,
} from '../controllers/timesheet.controller.js';

const router = express.Router();

const authorizeRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }

  next();
};

router.post('/generate', auth, authorizeRole('admin', 'employer', 'guard'), generateTimesheetsForRange);
router.get('/', auth, authorizeRole('admin', 'employer', 'guard'), listTimesheets);
router.get('/:id', auth, authorizeRole('admin', 'employer', 'guard'), getTimesheetById);

export default router;

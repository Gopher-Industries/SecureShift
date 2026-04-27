import express from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import shiftRoutes from './shift.routes.js';
import messageRoutes from './message.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import availabilityRoutes from './availability.routes.js';
import rbacRoutes from './rbac.routes.js';
import shiftAttendanceRoutes from './shiftattendance.routes.js';
import incidentRoutes from "./incident.routes.js";
import branchRoutes from './branch.routes.js';
import notificationRoutes from './notification.routes.js'

import payrollRoutes from './payroll.routes.js';
import documentRoutes from './document.routes.js';
import incidentReportRoutes from "./incidentreport.routes.js";

const router = express.Router();
router.use('/documents', documentRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/shifts', shiftRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);
router.use('/availability', availabilityRoutes);
router.use('/users', userRoutes);
router.use('/rbac', rbacRoutes);
router.use('/branch', branchRoutes);
router.use('/attendance', shiftAttendanceRoutes);
router.use("/incidents", incidentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payroll', payrollRoutes);
router.use('/incidentreports', incidentReportRoutes);

export default router;
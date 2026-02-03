import express from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import shiftRoutes from './shift.routes.js';
import messageRoutes from './message.routes.js';
import userRoutes from './user.routes.js'; 
import adminRoutes from './admin.routes.js';
import availabilityRoutes from './availability.routes.js'; 
import rbacRoutes from './rbac.routes.js';
import shiftattenddanceRoutes from './shiftattendance.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import notificationRoutes from './notification.routes.js'


const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/shifts', shiftRoutes);
router.use('/messages', messageRoutes);
router.use('/admin', adminRoutes);
router.use('/availability', availabilityRoutes); 
router.use('/users', userRoutes);  
router.use('/rbac', rbacRoutes);
router.use('/attendance', shiftattenddanceRoutes)
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;
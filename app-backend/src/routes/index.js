import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes   from './auth.routes.js';
import shiftRoutes  from './shift.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth',   authRoutes);
router.use('/shifts', shiftRoutes);

export default router;

import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes   from './auth.js';
import shiftRoutes  from './shift.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth',   authRoutes);
router.use('/shifts', shiftRoutes);

export default router;

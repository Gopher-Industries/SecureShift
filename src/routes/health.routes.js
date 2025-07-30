import { Router } from 'express';
const router = Router();

/**
 * Health check endpoint
 * GET /api/v1/health
 */
router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;

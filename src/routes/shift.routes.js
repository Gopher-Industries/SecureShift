import { Router } from 'express';
const router = Router();

/**
 * Shift routes placeholder
 * e.g. GET /api/v1/shifts
 */
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Shift route placeholder' });
});

export default router;

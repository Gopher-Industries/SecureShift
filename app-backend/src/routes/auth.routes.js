import { Router } from 'express';
const router = Router();

/**
 * Auth routes placeholder
 * e.g. POST /api/v1/auth/login
 */
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Auth route placeholder' });
});

export default router;

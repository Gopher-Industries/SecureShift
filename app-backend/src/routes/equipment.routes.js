import express from 'express';
import * as equipmentController from '../controllers/equipment.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Equipment
 *   description: API to manage equipment assigned to guards
 */

/**
 * @swagger
 * /api/v1/equipment:
 *   post:
 *     summary: Create a new equipment item
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', auth, equipmentController.createEquipment);

/**
 * @swagger
 * /api/v1/equipment/{id}/assign:
 *   patch:
 *     summary: Assign equipment to a guard/user
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/assign', auth, equipmentController.assignEquipment);

/**
 * @swagger
 * /api/v1/equipment/{id}/report:
 *   patch:
 *     summary: Report equipment as ACTIVE, DAMAGED, or LOST
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/report', auth, equipmentController.reportEquipment);

/**
 * @swagger
 * /api/v1/equipment/guard/{guardId}:
 *   get:
 *     summary: Get all equipment assigned to a specific guard
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/guard/:guardId',
  auth,
  equipmentController.getEquipmentByGuard
);

export default router;
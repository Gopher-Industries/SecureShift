import express from "express";
import * as equipmentController from "../controllers/equipment.controller.js";
import auth from "../middleware/auth.js";

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
 *     description: Create a new equipment record such as radios, uniforms, IDs, or other guard assets.
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Security Radio"
 *                 description: Name of the equipment
 *               assignedTo:
 *                 type: string
 *                 example: "681b6d9e7f3d8f4b9c123456"
 *                 description: User ID of the guard the equipment is assigned to
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DAMAGED, LOST]
 *                 example: "ACTIVE"
 *                 description: Current equipment status
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Equipment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth, equipmentController.createEquipment);

/**
 * @swagger
 * /api/v1/equipment/{id}/assign:
 *   patch:
 *     summary: Assign equipment to a guard/user
 *     description: Assign an equipment item to a specific guard.
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *         example: "681b8d6d7f3d8f4b9c987111"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 example: "681b6d9e7f3d8f4b9c123456"
 *                 description: User ID of the guard receiving the equipment
 *             required:
 *               - assignedTo
 *     responses:
 *       200:
 *         description: Equipment assigned successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Equipment not found
 */
router.patch("/:id/assign", auth, equipmentController.assignEquipment);

/**
 * @swagger
 * /api/v1/equipment/{id}/report:
 *   patch:
 *     summary: Update equipment status
 *     description: Report equipment as ACTIVE, DAMAGED, or LOST.
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Equipment ID
 *         example: "681b8d6d7f3d8f4b9c987111"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DAMAGED, LOST]
 *                 example: "DAMAGED"
 *                 description: Updated equipment status
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Equipment status updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Equipment not found
 */
router.patch("/:id/report", auth, equipmentController.reportEquipment);

/**
 * @swagger
 * /api/v1/equipment/guard/{guardId}:
 *   get:
 *     summary: Get all equipment assigned to a guard
 *     description: Retrieve a list of all equipment currently assigned to a specific guard.
 *     tags: [Equipment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: guardId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID of the guard
 *         example: "681b6d9e7f3d8f4b9c123456"
 *     responses:
 *       200:
 *         description: List of equipment assigned to the guard
 *       400:
 *         description: Invalid guard ID
 *       401:
 *         description: Unauthorized
 */
router.get("/guard/:guardId", auth, equipmentController.getEquipmentByGuard);

export default router;

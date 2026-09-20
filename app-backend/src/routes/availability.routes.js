import express from "express";
import * as availabilityController from "../controllers/availability.controller.js";
import * as availabilitySlotController from "../controllers/availabilitySlot.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Availability
 *   description: API to manage user availability
 */

/**
 * =========================================================================
 * CALENDAR AVAILABILITY SLOTS (Ticket #20)
 * =========================================================================
 * Per-date slots owned by the authenticated guard. Registered BEFORE the
 * "/:userId" route below so "/slots/..." is never captured as a userId param.
 * Within the group, the literal "/slots/my-slots" and "/slots/clear-all"
 * paths MUST come before the "/slots/:id" param route.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AvailabilitySlot:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         guardId:
 *           type: string
 *         date:
 *           type: string
 *           example: "2025-12-25"
 *         fromTime:
 *           type: string
 *           example: "09:00"
 *         toTime:
 *           type: string
 *           example: "17:00"
 *         recurring:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *             pattern:
 *               type: string
 *               enum: [weekly, daily]
 *             endDate:
 *               type: string
 *               example: "2026-01-31"
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/availability/slots:
 *   post:
 *     summary: Create an availability slot for the authenticated guard
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, fromTime, toTime]
 *             properties:
 *               date:
 *                 type: string
 *                 example: "2025-12-25"
 *               fromTime:
 *                 type: string
 *                 example: "09:00"
 *               toTime:
 *                 type: string
 *                 example: "17:00"
 *               recurring:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   pattern:
 *                     type: string
 *                     enum: [weekly, daily]
 *                   endDate:
 *                     type: string
 *     responses:
 *       201:
 *         description: Slot created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 availability:
 *                   $ref: "#/components/schemas/AvailabilitySlot"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post("/slots", auth, availabilitySlotController.createSlot);

/**
 * @swagger
 * /api/v1/availability/slots/my-slots:
 *   get:
 *     summary: List the authenticated guard's availability slots
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Optional ISO date (YYYY-MM-DD) lower bound
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Optional ISO date (YYYY-MM-DD) upper bound
 *     responses:
 *       200:
 *         description: List of slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 availability:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/AvailabilitySlot"
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 */
router.get("/slots/my-slots", auth, availabilitySlotController.getMySlots);

/**
 * @swagger
 * /api/v1/availability/slots/clear-all:
 *   delete:
 *     summary: Delete all of the authenticated guard's availability slots
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slots cleared
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/slots/clear-all",
  auth,
  availabilitySlotController.clearAllSlots,
);

/**
 * @swagger
 * /api/v1/availability/slots/{id}:
 *   delete:
 *     summary: Delete one of the authenticated guard's availability slots
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Slot not found or not owned by the guard
 */
router.delete("/slots/:id", auth, availabilitySlotController.deleteSlot);

/**
 * =========================
 * CREATE / UPDATE AVAILABILITY
 * =========================
 */

/**
 * @swagger
 * /api/v1/availability:
 *   post:
 *     summary: Create or update user availability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 description: User ID (Admin only)
 *               days:
 *                 type: array
 *                 items:
 *                   type: string
 *               timeSlots:
 *                 type: array
 *                 items:
 *                   type: string
 *             required:
 *               - days
 *               - timeSlots
 *     responses:
 *       200:
 *         description: Availability saved successfully
 */
router.post("/", auth, availabilityController.createOrUpdateAvailability);

/**
 * =========================
 * GET AVAILABILITY BY USER
 * =========================
 */

/**
 * @swagger
 * /api/v1/availability/{userId}:
 *   get:
 *     summary: Get availability for a user
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     responses:
 *       200:
 *         description: Availability found
 */
router.get("/:userId", auth, availabilityController.getAvailability);

/**
 * =========================
 * 🔥 NEW: UPDATE LIVE STATUS
 * =========================
 */

/**
 * @swagger
 * /api/v1/availability/status:
 *   patch:
 *     summary: Update live availability status (AVAILABLE / BUSY / OFF_DUTY)
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, BUSY, OFF_DUTY]
 *                 example: AVAILABLE
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Availability not found
 */
router.patch("/status", auth, availabilityController.updateAvailabilityStatus);

export default router;

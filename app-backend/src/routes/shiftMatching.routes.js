import express from "express";
import auth from "../middleware/auth.js";
import {
  getShiftMatches,
  createOrUpdateGuardPreference,
  getMyGuardPreference,
  inviteGuardToShift,
  getMyShiftInvitations,
  respondToShiftInvitation,
} from "../controllers/shiftMatching.controller.js";

const router = express.Router();

const employerOrAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!["employer", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Only employers or admins can access shift matches",
    });
  }

  next();
};

const guardOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "guard") {
    return res.status(403).json({
      message: "Only guards can access this endpoint",
    });
  }

  next();
};

/**
 * @swagger
 * tags:
 *   name: Shift Matching
 *   description: Guard recommendation, preference, invitation, and urgent shift matching system
 */

/**
 * @swagger
 * /api/v1/shift-matches/preferences/me:
 *   get:
 *     summary: Get logged-in guard's matching preferences
 *     tags: [Shift Matching]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guard preferences returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only guards can view preferences
 *
 *   post:
 *     summary: Create or update logged-in guard's matching preferences
 *     description: |
 *       Stores guard preferences used by the shift matching system.
 *
 *       These preferences can include preferred shift types, fields, suburbs,
 *       minimum pay rate, and urgent shift availability.
 *     tags: [Shift Matching]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredShiftTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [Day, Night]
 *                 example: ["Day"]
 *               preferredFields:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["warehouse", "patrol"]
 *               preferredSuburbs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Fitzroy", "Melbourne"]
 *               minimumPayRate:
 *                 type: number
 *                 example: 30
 *               acceptsUrgentShifts:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Guard preferences saved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only guards can set preferences
 */
router
  .route("/preferences/me")
  .get(auth, guardOnly, getMyGuardPreference)
  .post(auth, guardOnly, createOrUpdateGuardPreference);

/**
 * @swagger
 * /api/v1/shift-matches/invitations/me:
 *   get:
 *     summary: Get shift invitations for logged-in user
 *     description: |
 *       Guards see invitations sent to them.
 *       Employers see invitations they have sent.
 *       Admins can view all invitations.
 *     tags: [Shift Matching]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitations returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to view invitations
 */
router.get("/invitations/me", auth, getMyShiftInvitations);

/**
 * @swagger
 * /api/v1/shift-matches/invitations/{invitationId}/respond:
 *   patch:
 *     summary: Respond to a shift invitation
 *     description: |
 *       Allows a guard to accept or decline a pending shift invitation.
 *     tags: [Shift Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift invitation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, DECLINED]
 *                 example: ACCEPTED
 *     responses:
 *       200:
 *         description: Invitation response saved successfully
 *       400:
 *         description: Invalid status or invitation already handled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only invited guard can respond
 *       404:
 *         description: Invitation not found
 */
router.patch(
  "/invitations/:invitationId/respond",
  auth,
  guardOnly,
  respondToShiftInvitation
);

/**
 * @swagger
 * /api/v1/shift-matches/{shiftId}/invite/{guardId}:
 *   post:
 *     summary: Invite a matched guard to a shift
 *     description: |
 *       Allows an employer/admin to invite a guard to a shift.
 *       This does not automatically assign the guard.
 *       The guard must accept or decline the invitation.
 *     tags: [Shift Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *       - in: path
 *         name: guardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Guard ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "You are a strong match for this shift. Please review and respond."
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: Invalid shift or guard ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not allowed to invite for this shift
 *       404:
 *         description: Shift or guard not found
 *       409:
 *         description: Invitation already exists
 */
router.post(
  "/:shiftId/invite/:guardId",
  auth,
  employerOrAdminOnly,
  inviteGuardToShift
);

/**
 * @swagger
 * /api/v1/shift-matches/{shiftId}:
 *   get:
 *     summary: Get recommended guards for a shift
 *     description: |
 *       Returns ranked guard suggestions for an existing shift.
 *       This endpoint is read-only and does not assign guards or modify the shift.
 *
 *       Matching considers:
 *       - Guard availability
 *       - Live availability status
 *       - Shift time conflicts
 *       - Verified licence
 *       - Guard rating
 *       - Employer favourites
 *       - Same suburb match
 *     tags: [Shift Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID to generate matches for
 *     responses:
 *       200:
 *         description: Ranked guard matches returned successfully
 *       400:
 *         description: Invalid shift ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shift not found
 */
router.get("/:shiftId", auth, employerOrAdminOnly, getShiftMatches);

export default router;
import express from "express";
import auth from "../middleware/auth.js";
import { getShiftMatches } from "../controllers/shiftMatching.controller.js";

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

/**
 * @swagger
 * tags:
 *   name: Shift Matching
 *   description: Guard recommendation system for shifts
 */

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
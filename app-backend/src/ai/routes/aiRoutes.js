import express from "express";
import { chat } from "../controllers/aiController.js";
import protect from "../../middleware/auth.js";
import { allowRoles } from "../../middleware/role.js";
import aiRateLimiter from "../../middleware/aiRateLimiter.js";

const router = express.Router();

/**
 * POST /api/v1/ai/chat
 *
 * SecureShift AI Assistant
 * Requires:
 * - Valid JWT authentication
 * - Employer or Admin role
 */
router.post(
  "/chat",
  protect,
   allowRoles("employer", "admin"),
    aiRateLimiter,
  chat
);

export default router;
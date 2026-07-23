import express from "express";
import auth from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import {
  generateTimesheetsForRange,
  getTimesheetById,
  listTimesheets,
} from "../controllers/timesheet.controller.js";

const router = express.Router();

router.post(
  "/generate",
  auth,
  authorizeRoles("admin", "employer", "guard"),
  generateTimesheetsForRange,
);
router.get(
  "/",
  auth,
  authorizeRoles("admin", "employer", "guard"),
  listTimesheets,
);
router.get(
  "/:id",
  auth,
  authorizeRoles("admin", "employer", "guard"),
  getTimesheetById,
);

export default router;

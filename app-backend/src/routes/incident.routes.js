import express from "express";
import {
  createIncident,
  updateIncident,
  getIncident,
  getIncidents,
  deleteIncident,
  uploadAttachment,
  getAttachment,
} from "../controllers/incident.controller.js";

import auth from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.use(auth);

// Create
router.post("/", authorizePermissions("incident:create"), createIncident);
router.patch("/:id", authorizePermissions("incident:update"), updateIncident);
router.get("/:id", authorizePermissions("incident:view"), getIncident);
router.get("/", authorizePermissions("incident:view"), getIncidents);
router.delete("/:id", authorizePermissions("incident:delete"), deleteIncident);
router.post(
  "/:id/attachments",
  authorizePermissions("incident:update"),
  upload.single("file"),
  uploadAttachment
);
router.get(
  "/:id/attachments/:attachmentId",
  authorizePermissions("incident:view"),
  getAttachment
);
export default router;
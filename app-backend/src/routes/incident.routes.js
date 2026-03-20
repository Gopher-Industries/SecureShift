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

import { auth } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import upload from "../config/multer.js";

const router = express.Router();

router.use(auth);

// Create
router.post("/", authorizeRoles("incident:create"), createIncident);

// Update
router.patch("/:id", authorizeRoles("incident:update"), updateIncident);

// Get one
router.get("/:id", authorizeRoles("incident:view"), getIncident);

// List
router.get("/", authorizeRoles("incident:view"), getIncidents);

// Delete (admin)
router.delete("/:id", authorizeRoles("incident:delete"), deleteIncident);

// Upload attachment
router.post(
  "/:id/attachments",
  authorizeRoles("incident:update"),
  upload.single("file"),
  uploadAttachment
);

// Get attachment
router.get(
  "/:id/attachments/:attachmentId",
  authorizeRoles("incident:view"),
  getAttachment
);

export default router;
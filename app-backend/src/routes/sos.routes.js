import express from "express";

import { triggerSOS } from "../controllers/emergency.controller.js";
import auth from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";
import { registerSOSInteractionRoutes } from "./sos.route-set.js";

const router = express.Router();

router.post("/trigger", auth, allowRoles("guard"), triggerSOS);
registerSOSInteractionRoutes(router);

export default router;

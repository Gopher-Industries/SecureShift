import {
  addSOSNote,
  cancelSOS,
  getActiveSOS,
  getSOSStatus,
  updateSOSLocation,
} from "../controllers/emergency.controller.js";
import auth from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

export const registerSOSInteractionRoutes = (router, basePath = "") => {
  router.get(
    `${basePath}/active`,
    auth,
    allowRoles("guard", "admin", "employer"),
    getActiveSOS,
  );
  router.get(
    `${basePath}/:id`,
    auth,
    allowRoles("guard", "admin", "employer"),
    getSOSStatus,
  );
  router.post(
    `${basePath}/:id/location`,
    auth,
    allowRoles("guard"),
    updateSOSLocation,
  );
  router.post(`${basePath}/:id/note`, auth, allowRoles("guard"), addSOSNote);
  router.post(`${basePath}/:id/cancel`, auth, allowRoles("guard"), cancelSOS);
};

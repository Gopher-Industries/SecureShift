// routes/emergency.routes.js
import express from "express";
import {
  triggerSOS,
  getSOSHistory,
  updateSOSStatus,
} from "../controllers/emergency.controller.js";

import auth from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Emergency
 *   description: SOS / Panic Button Management APIs
 */

/**
 * @swagger
 * /api/v1/emergency/sos:
 *   post:
 *     summary: Trigger SOS / Panic Button
 *     tags: [Emergency]
 *     description: Security Guard triggers real-time emergency SOS with live location 
 *                  (Auth temporarily disabled for Capstone testing)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: -37.8136
 *               longitude:
 *                 type: number
 *                 example: 144.9631
 *               message:
 *                 type: string
 *                 example: "Suspicious activity at main gate"
 *     responses:
 *       201:
 *         description: SOS triggered successfully
 *       400:
 *         description: Missing latitude/longitude
 *       429:
 *         description: Rate limit (spam prevention)
 */
router.post("/sos", auth, allowRoles("guard"), triggerSOS);   // Added for Panic/SoS notification

/**
 * @swagger
 * /api/v1/emergency/sos:
 *   get:
 *     summary: Get all SOS history
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     description: Admin and Employer can view SOS logs
 *     responses:
 *       200:
 *         description: SOS history retrieved successfully
 */
router.get(
  "/sos",
  auth,
  allowRoles("admin", "employer"),
  getSOSHistory
);

/**
 * @swagger
 * /api/v1/emergency/sos/{id}:
 *   put:
 *     summary: Update SOS status
 *     tags: [Emergency]
 *     security:
 *       - bearerAuth: []
 *     description: Admin or Employer updates SOS status (e.g. resolved)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["ACTIVE", "RESOLVED"]
 *     responses:
 *       200:
 *         description: SOS status updated
 *       404:
 *         description: SOS not found
 */
router.put(
  "/sos/:id",
  auth,
  allowRoles("admin", "employer"),
  updateSOSStatus
);

export default router;
// // routes/emergency.routes.js
// import express from "express";
// import {
//   triggerSOS,
//   getSOSHistory,
//   updateSOSStatus,
// } from "../controllers/emergency.controller.js";

// import auth from "../middleware/auth.js";
// import { allowRoles } from "../middleware/role.js";

// const router = express.Router();

// /**
//  * @swagger
//  * tags:
//  *   name: Emergency
//  *   description: SOS / Panic Button Management APIs
//  */

// /**
//  * @swagger
//  * /api/v1/emergency/sos:
//  *   post:
//  *     summary: Trigger SOS / Panic Button
//  *     tags: [Emergency]
//  *     security:
//  *       - bearerAuth: []
//  *     description: Security Guard triggers real-time emergency SOS with live location
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - latitude
//  *               - longitude
//  *             properties:
//  *               latitude:
//  *                 type: number
//  *                 example: -37.8136
//  *               longitude:
//  *                 type: number
//  *                 example: 144.9631
//  *               message:
//  *                 type: string
//  *                 example: "Suspicious activity at main gate"
//  *     responses:
//  *       201:
//  *         description: SOS triggered successfully
//  *       400:
//  *         description: Missing latitude/longitude
//  *       429:
//  *         description: Rate limit (spam prevention)
//  */
// router.post(
//   "/sos",
//   auth,
//   allowRoles("guard"),
//   triggerSOS
// );

// /**
//  * @swagger
//  * /api/v1/emergency/sos:
//  *   get:
//  *     summary: Get all SOS history
//  *     tags: [Emergency]
//  *     security:
//  *       - bearerAuth: []
//  *     description: Admin and Employer can view SOS logs
//  *     responses:
//  *       200:
//  *         description: SOS history retrieved successfully
//  */
// router.get(
//   "/sos",
//   auth,
//   allowRoles("admin", "employer"),
//   getSOSHistory
// );

// /**
//  * @swagger
//  * /api/v1/emergency/sos/{id}:
//  *   put:
//  *     summary: Update SOS status
//  *     tags: [Emergency]
//  *     security:
//  *       - bearerAuth: []
//  *     description: Admin or Employer updates SOS status (e.g. resolved)
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               status:
//  *                 type: string
//  *                 enum: ["ACTIVE", "RESOLVED"]
//  *     responses:
//  *       200:
//  *         description: SOS status updated
//  *       404:
//  *         description: SOS not found
//  */
// router.put(
//   "/sos/:id",
//   auth,
//   allowRoles("admin", "employer"),
//   updateSOSStatus
// );

// export default router;
// // import express from "express";
// // import {
// //   triggerSOS,
// //   getSOSHistory,
// //   updateSOSStatus,
// // } from "../controllers/emergency.controller.js";

// // // ✅ correct auth import
// // import auth from "../middleware/auth.js";

// // // ✅ correct role import (your file)
// // import { allowRoles } from "../middleware/role.js";

// // const router = express.Router();

// // /**
// //  * @swagger
// //  * tags:
// //  *   name: Emergency
// //  *   description: SOS Emergency Management APIs
// //  */

// // /**
// //  * @swagger
// //  * /api/v1/emergency/sos:
// //  *   post:
// //  *     summary: Trigger SOS alert
// //  *     tags: [Emergency]
// //  *     security:
// //  *       - bearerAuth: []
// //  *     description: Guard triggers an emergency SOS alert with location details
// //  *     requestBody:
// //  *       required: true
// //  *       content:
// //  *         application/json:
// //  *           schema:
// //  *             type: object
// //  *             required:
// //  *               - latitude
// //  *               - longitude
// //  *             properties:
// //  *               latitude:
// //  *                 type: number
// //  *                 example: -37.8136
// //  *               longitude:
// //  *                 type: number
// //  *                 example: 144.9631
// //  *               message:
// //  *                 type: string
// //  *                 example: "Emergency at site"
// //  *     responses:
// //  *       201:
// //  *         description: SOS triggered successfully
// //  */
// // router.post(
// //   "/sos",
// //   auth,
// //   allowRoles("guard"),
// //   triggerSOS
// // );

// // /**
// //  * @swagger
// //  * /api/v1/emergency/sos:
// //  *   get:
// //  *     summary: Get SOS history
// //  *     tags: [Emergency]
// //  *     security:
// //  *       - bearerAuth: []
// //  *     description: Admin or employer can view SOS logs
// //  *     responses:
// //  *       200:
// //  *         description: SOS history fetched
// //  */
// // router.get(
// //   "/sos",
// //   auth,
// //   allowRoles("admin", "employer"),
// //   getSOSHistory
// // );

// // /**
// //  * @swagger
// //  * /api/v1/emergency/sos/{id}:
// //  *   put:
// //  *     summary: Update SOS status
// //  *     tags: [Emergency]
// //  *     security:
// //  *       - bearerAuth: []
// //  *     description: Admin/Employer resolves SOS
// //  *     parameters:
// //  *       - in: path
// //  *         name: id
// //  *         required: true
// //  *         schema:
// //  *           type: string
// //  *     requestBody:
// //  *       required: true
// //  *       content:
// //  *         application/json:
// //  *           schema:
// //  *             type: object
// //  *             properties:
// //  *               status:
// //  *                 type: string
// //  *                 enum: [ACTIVE, RESOLVED]
// //  *     responses:
// //  *       200:
// //  *         description: SOS updated
// //  */
// // router.put(
// //   "/sos/:id",
// //   auth,
// //   allowRoles("admin", "employer"),
// //   updateSOSStatus
// // );

// // export default router;
// import express from "express";
// import {
//   triggerSOS,
//   getSOSHistory,
//   updateSOSStatus,
// } from "../controllers/emergency.controller.js";

// // ✅ correct auth import
// import auth from "../middleware/auth.js";

// // ✅ correct role import (your file)
// import { allowRoles } from "../middleware/role.js";

// const router = express.Router();

// /**
//  * @swagger
//  * tags:
//  *   name: Emergency
//  *   description: SOS Emergency Management APIs
//  */

// /**
//  * @swagger
//  * /api/v1/emergency/sos:
//  *   post:
//  *     summary: Trigger SOS alert
//  *     tags: [Emergency]
//  *     security:
//  *       - bearerAuth: []
//  *     description: Guard triggers an emergency SOS alert with location details
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - latitude
//  *               - longitude
//  *             properties:
//  *               latitude:
//  *                 type: number
//  *                 example: -37.8136
//  *               longitude:
//  *                 type: number
//  *                 example: 144.9631
//  *               message:
//  *                 type: string
//  *                 example: "Emergency at site"
//  *     responses:
//  *       201:
//  *         description: SOS triggered successfully
//  */
// router.post(
//   "/sos",
//   auth,
//   allowRoles("guard"),
//   triggerSOS
// );

// /**
//  * @swagger
//  * /api/v1/emergency/sos:
//  *   get:
//  *     summary: Get SOS history
//  *     tags: [Emergency]
//  *     security:
//  *       - bearerAuth: []
//  *     description: Admin or employer can view SOS logs
//  *     responses:
//  *       200:
//  *         description: SOS history fetched
//  */
// router.get(
//   "/sos",
//   auth,
//   allowRoles("admin", "employer"),
//   getSOSHistory
// );

// /**
//  * @swagger
//  * /api/v1/emergency/sos/{id}:
//  *   put:
//  *     summary: Update SOS status
//  *     tags: [Emergency]
//  *     security:
//  *       - bearerAuth: []
//  *     description: Admin/Employer resolves SOS
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               status:
//  *                 type: string
//  *                 enum: [ACTIVE, RESOLVED]
//  *     responses:
//  *       200:
//  *         description: SOS updated
//  */
// router.put(
//   "/sos/:id",
//   auth,
//   allowRoles("admin", "employer"),
//   updateSOSStatus
// );

// export default router;

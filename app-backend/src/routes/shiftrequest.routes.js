import express from "express";
import protect from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import {
  createShiftRequest,
  getShiftRequestById,
  getShiftRequests,
  getSwapOptions,
  updateShiftRequest,
} from "../controllers/shiftrequest.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shift Requests
 *   description: Guard shift swap and leave requests.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ShiftRequest:
 *       type: object
 *       required: [type, status, requestingGuardId, originalShiftId, reason]
 *       properties:
 *         _id:
 *           type: string
 *           example: 66c8d11f4f4e7d3b8c2a1001
 *         type:
 *           type: string
 *           enum: [SWAP, LEAVE]
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         requestingGuardId:
 *           description: The guard who submitted the request. Set from the authenticated user and is never supplied in the create body.
 *           oneOf:
 *             - type: string
 *               example: 66c8d11f4f4e7d3b8c2a1002
 *             - $ref: "#/components/schemas/ShiftRequestGuard"
 *         targetGuardId:
 *           nullable: true
 *           description: Required for SWAP requests.
 *           oneOf:
 *             - type: string
 *               example: 66c8d11f4f4e7d3b8c2a1003
 *             - $ref: "#/components/schemas/ShiftRequestTargetGuard"
 *         originalShiftId:
 *           oneOf:
 *             - type: string
 *               example: 66c8d11f4f4e7d3b8c2a1004
 *             - $ref: "#/components/schemas/ShiftRequestShift"
 *         replacementShiftId:
 *           nullable: true
 *           description: Optional shift currently assigned to the target guard for a SWAP request.
 *           oneOf:
 *             - type: string
 *               example: 66c8d11f4f4e7d3b8c2a1005
 *             - $ref: "#/components/schemas/ShiftRequestReplacementShift"
 *         leaveStartDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         leaveEndDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         reason:
 *           type: string
 *           minLength: 3
 *           maxLength: 1000
 *         rejectionReason:
 *           type: string
 *           nullable: true
 *           maxLength: 500
 *         reviewedBy:
 *           nullable: true
 *           oneOf:
 *             - type: string
 *             - $ref: "#/components/schemas/ShiftRequestTargetGuard"
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isActionable:
 *           type: boolean
 *           description: True only while status is PENDING.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ShiftRequestGuard:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *     ShiftRequestTargetGuard:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *     ShiftRequestShift:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *         location:
 *           type: string
 *         urgency:
 *           type: string
 *         status:
 *           type: string
 *         createdBy:
 *           type: string
 *         siteId:
 *           type: string
 *     ShiftRequestReplacementShift:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *     CreateShiftRequest:
 *       type: object
 *       required: [type, originalShiftId, reason]
 *       properties:
 *         type:
 *           type: string
 *           enum: [SWAP, LEAVE]
 *         originalShiftId:
 *           type: string
 *           description: A future shift assigned to the authenticated guard.
 *         targetGuardId:
 *           type: string
 *           description: Required when type is SWAP, must identify an active guard other than the requester.
 *         replacementShiftId:
 *           type: string
 *           description: Optional future shift assigned to targetGuardId valid only for SWAP.
 *         leaveStartDate:
 *           type: string
 *           format: date
 *           description: Required when type is LEAVE and must not be in the past.
 *         leaveEndDate:
 *           type: string
 *           format: date
 *           description: Required when type is LEAVE and must be on or after leaveStartDate.
 *         reason:
 *           type: string
 *           minLength: 3
 *           maxLength: 1000
 *     ReviewShiftRequest:
 *       type: object
 *       required: [status]
 *       properties:
 *         status:
 *           type: string
 *           enum: [APPROVED, REJECTED]
 *         rejectionReason:
 *           type: string
 *           maxLength: 500
 *           description: Used only when status is REJECTED. If omitted, the stored value is "No reason provided".
 *     ShiftRequestResponse:
 *       type: object
 *       required: [success, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: "#/components/schemas/ShiftRequest"
 *         message:
 *           type: string
 *     ShiftRequestListResponse:
 *       type: object
 *       required: [success, page, limit, total, pages, items]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 1
 *         pages:
 *           type: integer
 *           example: 1
 *         items:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/ShiftRequest"
 *     ErrorResponse:
 *       type: object
 *       required: [message]
 *       properties:
 *         message:
 *           type: string
 *           example: Shift request not found
 */

/**
 * @swagger
 * /api/v1/shift-requests:
 *   post:
 *     summary: Create a shift swap or leave request
 *     description: Guard only. The authenticated guard becomes requestingGuardId. The original shift must be assigned to that guard and must not be in the past.
 *     tags: [Shift Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateShiftRequest"
 *           examples:
 *             swap:
 *               summary: Swap request with an optional reciprocal shift
 *               value:
 *                 type: SWAP
 *                 originalShiftId: 66c8d11f4f4e7d3b8c2a1004
 *                 targetGuardId: 66c8d11f4f4e7d3b8c2a1003
 *                 replacementShiftId: 66c8d11f4f4e7d3b8c2a1005
 *                 reason: Family commitment on the scheduled date
 *             leave:
 *               summary: Leave request
 *               value:
 *                 type: LEAVE
 *                 originalShiftId: 66c8d11f4f4e7d3b8c2a1004
 *                 leaveStartDate: "2026-09-10"
 *                 leaveEndDate: "2026-09-12"
 *                 reason: Approved annual leave
 *     responses:
 *       201:
 *         description: Shift request created with PENDING status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ShiftRequestResponse"
 *             example:
 *               success: true
 *               data:
 *                 _id: 66c8d11f4f4e7d3b8c2a1001
 *                 type: LEAVE
 *                 status: PENDING
 *                 requestingGuardId: 66c8d11f4f4e7d3b8c2a1002
 *                 originalShiftId: 66c8d11f4f4e7d3b8c2a1004
 *                 leaveStartDate: "2026-09-10T00:00:00.000Z"
 *                 leaveEndDate: "2026-09-12T00:00:00.000Z"
 *                 reason: Approved annual leave
 *                 isActionable: true
 *               message: Shift request created
 *       400:
 *         description: Invalid payload, invalid ID, past shift, or a pending request already exists for the original shift. Duplicate pending requests return 400, not 409.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Missing, invalid, expired, deleted, or unavailable authenticated user token.
 *       403:
 *         description: Authenticated user is not a guard or is not allowed to request the specified shift.
 *       404:
 *         description: Original shift, target guard, or replacement shift was not found.
 */

/**
 * @swagger
 * /api/v1/shift-requests:
 *   get:
 *     summary: List shift requests in the caller's scope
 *     description: Guard sees own requests, employer sees requests for shifts they created or shifts at their active branches and admin sees all requests.
 *     tags: [Shift Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SWAP, LEAVE]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Values that cannot be parsed are treated as 1.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Values are clamped to 1 through 50 and unparseable values use 20.
 *     responses:
 *       200:
 *         description: Paginated, scope-filtered shift requests.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ShiftRequestListResponse"
 *       400:
 *         description: Invalid status or type filter.
 *       401:
 *         description: Missing, invalid, expired, deleted, or unavailable authenticated user token.
 *       403:
 *         description: Authenticated role is not guard, employer, or admin.
 */

/**
 * @swagger
 * /api/v1/shift-requests/{id}:
 *   get:
 *     summary: Get one shift request in the caller's scope
 *     description: Guard may read only their own request, employer may read only a request for a shift they created or a shift at their active branch and admin may read any request.
 *     tags: [Shift Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{24}$"
 *         description: Shift request MongoDB ObjectId.
 *     responses:
 *       200:
 *         description: Shift request found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ShiftRequestResponse"
 *       400:
 *         description: id is not a valid MongoDB ObjectId.
 *       401:
 *         description: Missing, invalid, expired, deleted, or unavailable authenticated user token.
 *       403:
 *         description: The caller does not have access to this request's scope.
 *       404:
 *         description: Shift request was not found.
 *   patch:
 *     summary: Approve or reject a pending shift request
 *     description: Employer or admin only. This records the review decision, reviewer, and review time. It does not reassign shifts or change rosters, availability, notifications, or target-guard state.
 *     tags: [Shift Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{24}$"
 *         description: Shift request MongoDB ObjectId.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ReviewShiftRequest"
 *           examples:
 *             approve:
 *               value:
 *                 status: APPROVED
 *             reject:
 *               value:
 *                 status: REJECTED
 *                 rejectionReason: Unable to cover this shift at the requested time
 *     responses:
 *       200:
 *         description: Decision recorded on the shift request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ShiftRequestResponse"
 *             example:
 *               success: true
 *               data:
 *                 _id: 66c8d11f4f4e7d3b8c2a1001
 *                 type: SWAP
 *                 status: APPROVED
 *                 requestingGuardId: 66c8d11f4f4e7d3b8c2a1002
 *                 targetGuardId: 66c8d11f4f4e7d3b8c2a1003
 *                 originalShiftId: 66c8d11f4f4e7d3b8c2a1004
 *                 replacementShiftId: 66c8d11f4f4e7d3b8c2a1005
 *                 reason: Family commitment on the scheduled date
 *                 reviewedBy: 66c8d11f4f4e7d3b8c2a1006
 *                 reviewedAt: "2026-08-09T10:00:00.000Z"
 *                 isActionable: false
 *               message: Shift request approved
 *       400:
 *         description: Invalid id or status, or the request is no longer PENDING. A duplicate or invalid transition is returned as 400, not 409.
 *       401:
 *         description: Missing, invalid, expired, deleted, or unavailable authenticated user token.
 *       403:
 *         description: Authenticated user is not an employer or admin, or an employer is outside the shift's scope.
 *       404:
 *         description: Shift request was not found.
 */

router
  .route("/")
  .post(protect, authorizeRoles("guard"), createShiftRequest)
  .get(protect, authorizeRoles("guard", "employer", "admin"), getShiftRequests);

router
  .route("/:id")
  .get(
    protect,
    authorizeRoles("guard", "employer", "admin"),
    getShiftRequestById,
  )
  .patch(protect, authorizeRoles("employer", "admin"), updateShiftRequest);

/**
 * @swagger
 * /api/v1/shift-requests/swap-options/{id}:
 *   get:
 *     summary: List shifts that can be swapped with specified shift
 *     description: Guard may request a list of potential options to swap their shift with. Used to get targetGuardID and targetShiftID for swap request creation.
 *     tags: [Shift Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-fA-F0-9]{24}$"
 *         description: Shift MongoDB ObjectId.
 *     responses:
 *       200:
 *         description: Shift swap options found.
 *       400:
 *         description: id is not a valid MongoDB ObjectId.
 *       401:
 *         description: Missing, invalid, expired, deleted, or unavailable authenticated user token.
 *       403:
 *         description: The caller does not have access to this request's scope.
 *       404:
 *         description: Shift was not found.
 */
router
  .route("/swap-options/:id")
  .get(protect, authorizeRoles("guard"), getSwapOptions);

export default router;

import express from 'express';
import auth from '../middleware/auth.js';
import loadUser from '../middleware/loadUser.js';
import {
  authorizeRoles,
  authorizePermissions,
  ROLES,
} from '../middleware/rbac.js';
import {
  createShift,
  applyForShift,
  approveShift,
  completeShift,
  getMyShifts,
  rateShift,
  listAvailableShifts,
  getShiftHistory,
  listOpenShiftsForGuard,
} from '../controllers/shift.controller.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: End-to-end lifecycle for shifts
 */

/**
 * @swagger
 * /api/v1/shifts:
 *   get:
 *     summary: List shifts (dynamic by role)
 *     description: |
 *       • **Guard** → Available shifts (`open`/`applied`) not created by the guard, date ≥ today.  
 *       • **Employer** → Your shifts with applicants waiting for approval (`status: applied`).  
 *       • **Admin** → All shifts with applicants waiting for approval (`status: applied`).  
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: false
 *         description: Case-insensitive search in title/field
 *       - in: query
 *         name: urgency
 *         schema:
 *           type: string
 *           enum: [normal, priority, last-minute]
 *         required: false
 *         description: Filter by urgency
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         required: false
 *         description: Page number (pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         required: false
 *         description: Page size (pagination)
 *     responses:
 *       200: { description: Paged list of shifts per role rules }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *   post:
 *     summary: Create a shift (Employer only)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, date, startTime, endTime]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Night Patrol"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-08-25"
 *               startTime:
 *                 type: string
 *                 example: "20:00"
 *               endTime:
 *                 type: string
 *                 example: "23:00"
 *               location:
 *                 type: object
 *                 properties:
 *                   street:   { type: string, example: "10 Dock Rd" }
 *                   suburb:   { type: string, example: "Port Melbourne" }
 *                   state:    { type: string, example: "VIC" }
 *                   postcode: { type: string, example: "3207" }
 *               urgency:
 *                 type: string
 *                 enum: [normal, priority, last-minute]
 *                 example: "normal"
 *               field:
 *                 type: string
 *                 example: "warehouse"
 *               payRate:
 *                 type: number
 *                 example: 30
 */
router
  .route('/')
  .get(
    auth,
    loadUser,
    authorizeRoles(
      ROLES.GUARD,
      ROLES.EMPLOYER,
      ROLES.BRANCH_ADMIN,
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN
    ),
    authorizePermissions(['shift:read'], { any: true }),
    listAvailableShifts
  )
  .post(
    auth,
    loadUser,
    authorizeRoles(
      ROLES.EMPLOYER,
      ROLES.BRANCH_ADMIN,
      ROLES.ADMIN,
      ROLES.SUPER_ADMIN
    ),
    authorizePermissions(['shift:write'], { any: true }),
    createShift
  );

/**
 * @swagger
 * /api/v1/shifts/{id}/apply:
 *   put:
 *     summary: Apply for a shift (Guard only)
 *     tags: [Shifts]
 */
router
  .route('/:id/apply')
  .put(
    auth,
    loadUser,
    authorizeRoles(ROLES.GUARD),
    authorizePermissions(['shift:apply']),
    applyForShift
  );

/**
 * @swagger
 * /api/v1/shifts/{id}/approve:
 *   put:
 *     summary: Approve a guard (Employer/Admin)
 *     tags: [Shifts]
 */
router
  .route('/:id/approve')
  .put(
    auth,
    loadUser,
    authorizeRoles(ROLES.EMPLOYER, ROLES.BRANCH_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN),
    authorizePermissions(['shift:approve']),
    approveShift
  );

/**
 * @swagger
 * /api/v1/shifts/{id}/assign:
 *   patch:
 *     summary: Assign a guard (Admin-level roles)
 *     tags: [Shifts]
 */
router
  .route('/:id/assign')
  .patch(
    auth,
    loadUser,
    authorizeRoles(ROLES.BRANCH_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN),
    authorizePermissions(['shift:assign']),
    assignGuard
  );

/**
 * @swagger
 * /api/v1/shifts/{id}/complete:
 *   put:
 *     summary: Mark shift as completed (Employer/Admin)
 *     tags: [Shifts]
 */
router
  .route('/:id/complete')
  .put(
    auth,
    loadUser,
    authorizeRoles(ROLES.EMPLOYER, ROLES.BRANCH_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN),
    authorizePermissions(['shift:complete']),
    completeShift
  );

/**
 * @swagger
 * /api/v1/shifts/myshifts:
 *   get:
 *     summary: Get shifts for the logged-in user
 *     tags: [Shifts]
 */
router
  .route('/myshifts')
  .get(auth, loadUser, getMyShifts);

/**
 * @swagger
 * /api/v1/shifts/{id}/rate:
 *   patch:
 *     summary: Submit a rating (role-aware)
 *     tags: [Shifts]
 */
router
  .route('/:id/rate')
  .patch(
    auth,
    loadUser,
    authorizeRoles(ROLES.GUARD, ROLES.EMPLOYER),
    authorizePermissions(['shift:rate']),
    rateShift
  );

/**
 * @swagger
 * /api/v1/shifts/history:
 *   get:
 *     summary: Get shift history (Guard/Employer only)
 *     tags: [Shifts]
 */
/**
 * @swagger
 * /api/v1/shifts/available:
 *   get:
 *     summary: List open shifts for guards (filter by date/location)
 *     description: >
 *       Guard-only endpoint. Returns **open** shifts not created by the guard.  
 *       If `date` is omitted, returns only today/future shifts.  
 *       Results are sorted by date ascending.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date, example: "2025-09-07" }
 *         required: false
 *         description: Filter to a specific calendar day (YYYY-MM-DD)
 *       - in: query
 *         name: location
 *         schema: { type: string, example: "Port Melbourne" }
 *         required: false
 *         description: Case-insensitive match against street/suburb/state/postcode
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *     responses:
 *       200: { description: Paged list of open shifts for guards }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
router
  .route('/available')
  .get(protect, authorizeRole('guard'), listOpenShiftsForGuard);


export default router;

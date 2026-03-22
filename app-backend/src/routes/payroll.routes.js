/**
 * @file routes/payroll.routes.js
 * @description Payroll API routes for SecureShift.
 *
 * Base path: /api/v1/payroll
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ METHOD  PATH                          ROLES ALLOWED                      │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ GET     /                             admin, branch_admin, employer,     │
 * │                                        super_admin, guard (own only)     │
 * │ POST    /approve                      admin, branch_admin, super_admin   │
 * │ POST    /process                      admin, super_admin                 │
 * │ GET     /export                       admin, branch_admin, super_admin,  │
 * │                                        employer, guard (own only)        │
 * │ POST    /attendance                   admin, branch_admin, guard (self)  │
 * │ GET     /attendance/:shiftId          admin, branch_admin, employer,     │
 * │                                        guard (own only)                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 */

import { Router } from 'express';
import auth from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { auditMiddleware } from '../middleware/logger.js';
import {
  getPayroll,
  approvePayroll,
  processPayroll,
  exportPayroll,
  recordAttendance,
  getAttendanceForShift,
} from '../controllers/payroll.controller.js';

const router = Router();

// All payroll routes require a valid JWT
router.use(auth);

// Attach audit logging helper to every request
router.use(auditMiddleware);

// ─── GET /api/v1/payroll ──────────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/payroll:
 *   get:
 *     summary: Retrieve and generate payroll summaries
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2025-06-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2025-06-30"
 *       - in: query
 *         name: periodType
 *         required: true
 *         schema: { type: string, enum: [daily, weekly, monthly] }
 *       - in: query
 *         name: guardId
 *         schema: { type: string }
 *         description: Filter by a specific guard (optional; guards are automatically scoped to self)
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *         description: Filter by branch/department (optional)
 *     responses:
 *       200:
 *         description: Payroll summary with per-guard breakdown
 *       400:
 *         description: Validation error
 */
router.get(
  '/',
  authorizeRoles('super_admin', 'admin', 'branch_admin', 'employer', 'guard'),
  getPayroll
);

// ─── POST /api/v1/payroll/approve ────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/payroll/approve:
 *   post:
 *     summary: Approve one or more PENDING payroll records
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payrollIds]
 *             properties:
 *               payrollIds:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["665f1a2b3c4d5e6f7a8b9c0d"]
 *     responses:
 *       200:
 *         description: Records approved
 *       400:
 *         description: Validation error or wrong status
 *       404:
 *         description: One or more records not found
 */
router.post(
  '/approve',
  authorizeRoles('super_admin', 'admin', 'branch_admin'),
  approvePayroll
);

// ─── POST /api/v1/payroll/process ────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/payroll/process:
 *   post:
 *     summary: Mark one or more APPROVED payroll records as PROCESSED
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payrollIds]
 *             properties:
 *               payrollIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Records processed
 *       400:
 *         description: Validation error or wrong status
 */
router.post(
  '/process',
  authorizeRoles('super_admin', 'admin'),
  processPayroll
);

// ─── GET /api/v1/payroll/export ──────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/payroll/export:
 *   get:
 *     summary: Export payroll data as CSV or PDF
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: periodType
 *         required: true
 *         schema: { type: string, enum: [daily, weekly, monthly] }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv, pdf], default: csv }
 *       - in: query
 *         name: guardId
 *         schema: { type: string }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, PROCESSED] }
 *     responses:
 *       200:
 *         description: File download (text/csv or application/pdf)
 *       400:
 *         description: Validation error
 */
router.get(
  '/export',
  authorizeRoles('super_admin', 'admin', 'branch_admin', 'employer', 'guard'),
  exportPayroll
);

// ─── POST /api/v1/payroll/attendance ─────────────────────────────────────────
/**
 * @swagger
 * /api/v1/payroll/attendance:
 *   post:
 *     summary: Record clock-in / clock-out attendance for a shift
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shiftId]
 *             properties:
 *               shiftId:  { type: string }
 *               guardId:  { type: string, description: "Required for admin; guards default to self" }
 *               clockIn:  { type: string, format: date-time }
 *               clockOut: { type: string, format: date-time }
 *               status:   { type: string, enum: [absent, scheduled] }
 *               notes:    { type: string }
 *     responses:
 *       200:
 *         description: Attendance recorded / updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Shift not found
 */
router.post(
  '/attendance',
  authorizeRoles('super_admin', 'admin', 'branch_admin', 'guard'),
  recordAttendance
);

// ─── GET /api/v1/payroll/attendance/:shiftId ─────────────────────────────────
/**
 * @swagger
 * /api/v1/payroll/attendance/{shiftId}:
 *   get:
 *     summary: Retrieve attendance records for a specific shift
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of attendance records
 *       400:
 *         description: Invalid shiftId
 *       404:
 *         description: Shift not found
 */
router.get(
  '/attendance/:shiftId',
  authorizeRoles('super_admin', 'admin', 'branch_admin', 'employer', 'guard'),
  getAttendanceForShift
);

export default router;

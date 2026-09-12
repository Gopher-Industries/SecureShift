import express from "express";
import auth from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import {
  approvePayroll,
  downloadPayrollExport,
  downloadPayrollCsv,
  downloadPayrollPdf,
  getPayroll,
  processPayroll,
} from "../controllers/payroll.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payroll
 *   description: Payroll generation, approval, processing, and export
 */
/**
 * @swagger
 * /api/v1/payroll:
 *   get:
 *     summary: Generate or retrieve payroll documents for a date range
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in YYYY-MM-DD format
 *       - in: query
 *         name: periodType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *       - in: query
 *         name: guardId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional guard filter
 *       - in: query
 *         name: department
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional department filter mapped from Shift.field
 *     responses:
 *       200:
 *         description: Payroll documents returned successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", auth, authorizeRoles("admin", "employer", "guard"), getPayroll);
/**
 * @swagger
 * /api/v1/payroll/export:
 *   get:
 *     summary: Export payroll documents as CSV or PDF
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: periodType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, pdf]
 *         description: Export format
 *       - in: query
 *         name: guardId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export generated successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/export",
  auth,
  authorizeRoles("admin", "employer", "guard"),
  downloadPayrollExport,
);
router.get(
  "/export/csv",
  auth,
  authorizeRoles("admin", "employer", "guard"),
  downloadPayrollCsv,
);
router.get(
  "/export/pdf",
  auth,
  authorizeRoles("admin", "employer", "guard"),
  downloadPayrollPdf,
);
/**
 * @swagger
 * /api/v1/payroll/approve:
 *   post:
 *     summary: Approve payroll documents in bulk
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
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Payroll approved successfully
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Invalid payroll state transition
 */
router.post(
  "/approve",
  auth,
  authorizeRoles("admin", "employer"),
  approvePayroll,
);
/**
 * @swagger
 * /api/v1/payroll/process:
 *   post:
 *     summary: Process payroll documents in bulk
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
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Payroll processed successfully
 *       400:
 *         description: Invalid request payload
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Invalid payroll state transition
 */
router.post(
  "/process",
  auth,
  authorizeRoles("admin", "employer"),
  processPayroll,
);

export default router;

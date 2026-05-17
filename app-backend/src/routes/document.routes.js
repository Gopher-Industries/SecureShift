import express from "express";
import auth from "../middleware/auth.js";
import { authorizeRoles } from "../controllers/rbac.controller.js";
import { addDocument } from "../controllers/document.controller.js";
import {
    getDocuments,
    getSingleDocument,
    updateDocument
} from "../controllers/document.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Document Expiry Tracking APIs (Admin/Employer)
 */

/**
 * @swagger
 * /api/v1/documents/admin/documents:
 *   get:
 *     summary: Get all documents with expiry filtering
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [valid, expiring, expired]
 *         description: Filter by expiry status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [license, rsa, firstAid, id_card, certificate, passport, other]
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/admin/documents",
    auth,
    authorizeRoles("admin", "employer"),
    getDocuments
);

/**
 * @swagger
 * /api/v1/documents/admin/documents/{id}:
 *   get:
 *     summary: Get single document details
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 *       403:
 *         description: Forbidden
 */
router.get(
    "/admin/documents/:id",
    auth,
    authorizeRoles("admin", "employer"),
    getSingleDocument
);

/**
 * @swagger
 * /api/v1/documents/admin/documents/{id}:
 *   put:
 *     summary: Update document expiry date
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - expiryDate
 *             properties:
 *               expiryDate:
 *                 type: string
 *                 example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 */
router.put(
    "/admin/documents/:id",
    auth,
    updateDocument
);
/**
 * @swagger
 * /api/v1/documents/admin/documents:
 *   post:
 *     summary: Create a new document for a user
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [license, rsa, firstAid, id_card, certificate, passport, other]
 *               expiryDate:
 *                 type: string
 *                 example: "2026-12-31"
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 */
router.post(
    "/admin/documents",
    auth,
    authorizeRoles("admin", "employer"),
    addDocument
);
export default router;
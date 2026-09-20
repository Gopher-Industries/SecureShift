import express from "express";
import { getFaqs } from "../controllers/faq.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FAQ
 *   description: Frequently Asked Questions
 */

/**
 * @swagger
 * /api/v1/faqs:
 *   get:
 *     summary: Get all active FAQs
 *     description: |
 *       Returns a list of all active FAQ entries sorted by display order.
 *       This endpoint is public and does not require authentication.
 *       If no FAQs exist, an empty array is returned.
 *     tags: [FAQ]
 *     responses:
 *       200:
 *         description: Successful response with FAQ list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 required:
 *                   - _id
 *                   - question
 *                   - answer
 *                   - category
 *                   - displayOrder
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "64f1c6a3b5e18f9b9a3d52f77"
 *                   question:
 *                     type: string
 *                     example: "How do I register as a guard?"
 *                   answer:
 *                     type: string
 *                     example: "You can register by visiting the signup page..."
 *                   category:
 *                     type: string
 *                     enum: [general, account, shift, payroll, verification, support]
 *                     example: "general"
 *                   displayOrder:
 *                     type: number
 *                     example: 1
 *             example:
 *               - _id: "64f1c6a3b5e18f9b9a3d52f77"
 *                 question: "How do I register as a guard?"
 *                 answer: "You can register by visiting the signup page and uploading your license image."
 *                 category: "general"
 *                 displayOrder: 1
 *               - _id: "64f1c6a3b5e18f9b9a3d52f78"
 *                 question: "When is payroll processed?"
 *                 answer: "Payroll is processed on the 15th of each month."
 *                 category: "payroll"
 *                 displayOrder: 2
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve FAQs"
 */

// GET / - Returns all active FAQs
// Note: This endpoint is intentionally public. If authentication is required later,
// add 'auth' middleware: router.get("/", auth, getFaqs);
router.get("/", getFaqs);

export default router;

import express from 'express';

import { 
  createSite, 
  getAllSites, 
  updateSite, 
  deleteSite 
} from '../controllers/branch.controller.js';

import auth from '../middleware/auth.js';
import { employerOnly } from '../middleware/role.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Employer
 *   description: Employer-specific operations
 */

/**
 * @swagger
 * /api/v1/branch/site:
 *   get:
 *     summary: Get all sites for the logged-in employer
 *     tags: [Employer]
 *     description: Returns all active sites created by the logged-in employer.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 sites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                         example: "Melbourne HQ"
 *                       code:
 *                         type: string
 *                         example: "MEL-HQ"
 *                       location:
 *                         type: object
 *                         properties:
 *                           line1:
 *                             type: string
 *                             example: "10 Collins Street"
 *                           line2:
 *                             type: string
 *                             example: "Level 5"
 *                           city:
 *                             type: string
 *                             example: "Melbourne"
 *                           state:
 *                             type: string
 *                             example: "VIC"
 *                           postcode:
 *                             type: string
 *                             example: "3000"
 *                           country:
 *                             type: string
 *                             example: "Australia"
 *                       createdBy:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Employer only)
 *       500:
 *         description: Server error
 */
router.get('/site', auth, employerOnly, getAllSites);

/**
 * @swagger
 * /api/v1/branch/site:
 *   post:
 *     summary: Create a new site
 *     tags: [Employer]
 *     description: Only accessible to the logged-in employer.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Melbourne HQ"
 *               code:
 *                 type: string
 *                 example: "MEL-HQ"
 *               location:
 *                 type: object
 *                 properties:
 *                   line1:
 *                     type: string
 *                     example: "10 Collins Street"
 *                   line2:
 *                     type: string
 *                     example: "Level 5"
 *                   city:
 *                     type: string
 *                     example: "Melbourne"
 *                   state:
 *                     type: string
 *                     example: "VIC"
 *                   postcode:
 *                     type: string
 *                     example: "3000"
 *                   country:
 *                     type: string
 *                     example: "Australia"
 *     responses:
 *       201:
 *         description: Site created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 code:
 *                   type: string
 *                 location:
 *                   type: object
 *                   properties:
 *                     line1: { type: string }
 *                     line2: { type: string }
 *                     city: { type: string }
 *                     state: { type: string }
 *                     postcode: { type: string }
 *                     country: { type: string }
 *                 createdBy: { type: string }
 *                 isActive: { type: boolean }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       400:
 *         description: Site code already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Employer only)
 *       500:
 *         description: Server error
 */
router.post('/site', auth, employerOnly, createSite);

/**
 * @swagger
 * /api/v1/branch/site/{id}:
 *   put:
 *     summary: Update a site by ID
 *     tags: [Employer]
 *     description: Only accessible to the employer who owns this site.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Melbourne HQ"
 *               code:
 *                 type: string
 *                 example: "MEL-HQ"
 *               location:
 *                 type: object
 *                 properties:
 *                   line1:
 *                     type: string
 *                     example: "10 Collins Street"
 *                   line2:
 *                     type: string
 *                     example: "Level 5"
 *                   city:
 *                     type: string
 *                     example: "Melbourne"
 *                   state:
 *                     type: string
 *                     example: "VIC"
 *                   postcode:
 *                     type: string
 *                     example: "3000"
 *                   country:
 *                     type: string
 *                     example: "Australia"
 *     responses:
 *       200:
 *         description: Site updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 name: { type: string }
 *                 code: { type: string }
 *                 location:
 *                   type: object
 *                   properties:
 *                     line1: { type: string }
 *                     line2: { type: string }
 *                     city: { type: string }
 *                     state: { type: string }
 *                     postcode: { type: string }
 *                     country: { type: string }
 *                 createdBy: { type: string }
 *                 isActive: { type: boolean }
 *                 createdAt: { type: string, format: date-time }
 *                 updatedAt: { type: string, format: date-time }
 *       404:
 *         description: Site not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Employer only)
 *       500:
 *         description: Server error
 */
router.put('/site/:id', auth, employerOnly, updateSite);

/**
 * @swagger
 * /api/v1/branch/site/{id}:
 *   delete:
 *     summary: Soft-delete a site by ID
 *     tags: [Employer]
 *     description: Only accessible to the employer who owns this site.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Site ID
 *     responses:
 *       200:
 *         description: Site deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Site deleted successfully"
 *       404:
 *         description: Site not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Employer only)
 *       500:
 *         description: Server error
 */
router.delete('/site/:id', auth, employerOnly, deleteSite);

export default router;
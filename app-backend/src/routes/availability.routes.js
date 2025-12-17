import express from 'express';
import * as availabilityController from '../controllers/availability.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Route: Create or Update Availability
router.post('/', auth, availabilityController.createOrUpdateAvailability);

// Route: Get Availability by User ID
router.get('/:userId', auth, availabilityController.getAvailability);

// Route: Delete Availability by User ID
router.delete('/:userId', auth, availabilityController.deleteAvailability);

export default router;
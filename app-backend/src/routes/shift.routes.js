import express from 'express';
import * as shiftController from '../controllers/shift.controller.js';
import authenticate from '../middleware/auth.js'; 
import { allowRoles as authorize } from '../middleware/roles.js';

// import swaggerUi from 'swagger-ui-express';
// import swaggerJsdoc from 'swagger-jsdoc';

const router = express.Router();

/*
// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SecureShift API',
      version: '1.0.0',
      description: 'API documentation for SecureShift',
    },
    servers: [
      {
        url: 'http://localhost:5000', // change as needed
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // files with swagger comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
*/

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift management endpoints
 */

router.post('/shifts', authenticate, authorize('employer'), shiftController.createShift);

router.put('/shifts/:id/apply', authenticate, authorize('guard'), shiftController.applyForShift);

router.put('/shifts/:id/approve', authenticate, authorize('employer', 'admin'), shiftController.approveShift);

router.put('/shifts/:id/complete', authenticate, authorize('employer', 'admin'), shiftController.completeShift);

router.get('/shifts/myshifts', authenticate, shiftController.getMyShifts);

router.patch('/shifts/:id/rate', authenticate, authorize('guard', 'employer'), shiftController.rateShift);

export default router;

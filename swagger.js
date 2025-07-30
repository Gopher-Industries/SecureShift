// src/swagger.js (or wherever your swagger.js is located)
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SecureShift API Docs',
      version: '1.0.0',
      description: 'API documentation for SecureShift MVP',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`, // Dynamic port
        description: 'Local Dev Server',
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
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Adjust path as needed
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;

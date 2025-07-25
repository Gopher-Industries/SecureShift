import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import router from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import setupSwagger from '../swagger.js'; // ✅ now using ES module import

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// API routes
app.use('/api/v1', router);

// Swagger docs
setupSwagger(app);

// Global error handler
app.use(errorHandler);

export default app;

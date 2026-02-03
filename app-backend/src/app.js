import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import router from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import setupSwagger from './config/swagger.js'; // ✅ now using ES module import
import { auditMiddleware } from "./middleware/logger.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { startScheduledJobs } from './jobs/scheduler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(auditMiddleware);


// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger docs
setupSwagger(app);

// API routes
app.use('/api/v1', router);

// Global error handler
app.use(errorHandler);

startScheduledJobs();

export default app;

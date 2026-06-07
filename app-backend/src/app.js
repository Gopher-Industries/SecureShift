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
import emergencyRoutes from "./routes/emergency.routes.js"; 

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(auditMiddleware);


// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Swagger docs
setupSwagger(app);
app.use('/api/v1/emergency', emergencyRoutes);

// API routes
app.use('/api/v1', router);

// Global error handler
app.use(errorHandler);

export default app;

// import express from 'express';
// import cors from 'cors';
// import morgan from 'morgan';
// import helmet from 'helmet';
// import router from './routes/index.js';
// import errorHandler from './middleware/errorHandler.js';
// import setupSwagger from './config/swagger.js';
// import { auditMiddleware } from "./middleware/logger.js";
// import path from 'path';
// import { fileURLToPath } from 'url';

// import emergencyRoutes from "./routes/emergency.routes.js";   // Emergency / SOS Routes

// const app = express();

// app.use(helmet());
// app.use(cors());
// app.use(morgan('dev'));
// app.use(express.json());
// app.use(auditMiddleware);

// // Resolve __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Swagger docs
// setupSwagger(app);

// // API routes
// app.use('/api/v1', router);

// // ✅ Emergency / Panic Button Routes
// app.use('/api/v1/emergency', emergencyRoutes);

// // Global error handler
// app.use(errorHandler);

// export default app;
// // import express from 'express';
// // import cors from 'cors';
// // import morgan from 'morgan';
// // import helmet from 'helmet';
// // import router from './routes/index.js';
// // import errorHandler from './middleware/errorHandler.js';
// // import setupSwagger from './config/swagger.js'; // ✅ now using ES module import
// // import { auditMiddleware } from "./middleware/logger.js";
// // import path from 'path';
// // import { fileURLToPath } from 'url';

// // const app = express();

// // app.use(helmet());
// // app.use(cors());
// // app.use(morgan('dev'));
// // app.use(express.json());
// // app.use(auditMiddleware);


// // // Resolve __dirname in ES modules
// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);


// // // Swagger docs
// // setupSwagger(app);

// // // API routes
// // app.use('/api/v1', router);

// // // Global error handler
// // app.use(errorHandler);

// // export default app;

// // import express from 'express';
// // import cors from 'cors';
// // import morgan from 'morgan';
// // import helmet from 'helmet';
// // import router from './routes/index.js';
// // import errorHandler from './middleware/errorHandler.js';
// // import setupSwagger from './config/swagger.js'; // ✅ now using ES module import
// // import { auditMiddleware } from "./middleware/logger.js";
// // import path from 'path';
// // import { fileURLToPath } from 'url';

// // const app = express();

// // app.use(helmet());
// // app.use(cors());
// // app.use(morgan('dev'));
// // app.use(express.json());
// // app.use(auditMiddleware);


// // // Resolve __dirname in ES modules
// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);


// // // Swagger docs
// // setupSwagger(app);

// // // API routes
// // app.use('/api/v1', router);

// // // Global error handler
// // app.use(errorHandler);

// // export default app;

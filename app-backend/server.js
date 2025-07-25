import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
    console.log(`SecureShift API running on port ${PORT}`);
    console.log(`📘 Swagger UI available at: http://localhost:${PORT}/api-docs`);
    });
});
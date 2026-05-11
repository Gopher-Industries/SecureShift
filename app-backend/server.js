// server.js
import dotenv from 'dotenv';
import connectDB from './src/config/connectDB.js';
import app from './src/app.js';
import { initSocket } from './src/socket.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();


    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📘 Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`🔌 WebSocket server ready for real-time notifications`);
    });

    initSocket(server);

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
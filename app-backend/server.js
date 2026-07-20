// server.js
import dotenv from "dotenv";
import connectDB from "./src/config/connectDB.js";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📘 Swagger UI: http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

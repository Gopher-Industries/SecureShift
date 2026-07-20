// server.js
import dotenv from "dotenv";
import connectDB from "./src/config/connectDB.js";
import app from "./src/app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Validate JWT secrets
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}
if (
  !process.env.JWT_REFRESH_SECRET ||
  process.env.JWT_REFRESH_SECRET.length < 32
) {
  throw new Error("JWT_REFRESH_SECRET must be at least 32 characters");
}

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

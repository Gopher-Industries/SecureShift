import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/connectDB.js";
import setupSwagger from "./src/config/swagger.js";

// Load env variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Swagger setup
setupSwagger(app);

// Routes
app.get("/", (req, res) => {
  res.send("SecureShift API is running.");
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Swagger UI available at: http://localhost:${PORT}/api-docs`);
});

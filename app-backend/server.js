const express = require("express");
const connectDB = require("./connectDB");
require("dotenv").config();
const setupSwagger = require("./swagger.js").default;

const app = express();
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Swagger UI available at: http://localhost:${PORT}/api-docs`);
});

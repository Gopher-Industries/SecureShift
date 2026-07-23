import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // add validation for MONGO_URI
  if (!mongoURI) {
    const errorMessage =
      "MONGO_URI is required. Check app-backend/.env or the Docker Compose environment.";
    console.error(`❌ ${errorMessage}`);
    throw new Error(errorMessage);
  }

  try {
    await mongoose.connect(mongoURI); // modern way, options no longer needed

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;

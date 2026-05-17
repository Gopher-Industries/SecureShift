import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      "mongodb+srv://Govardhan_DB:gova1234@gova.0pgf8wq.mongodb.net/secureShift_DB?retryWrites=true&w=majority";

    await mongoose.connect(mongoURI); // modern way, options no longer needed

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;

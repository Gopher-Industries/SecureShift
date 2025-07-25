// config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`🟢 MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`🔴 MongoDB connection error: ${error.message}`);
    process.exit(1); // Exit on failure
  }
};

export default connectDB;

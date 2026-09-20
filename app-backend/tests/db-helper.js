// tests/db-helper.js
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.test"), override: true });

const TEST_DB_URI = process.env.MONGO_TEST_URI;
if (!TEST_DB_URI) {
  throw new Error("MONGO_TEST_URI is required for tests");
}

let mongoServer;

export const startTestDatabase = async (useInMemory = false) => {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log("GOOD: In-memory test database connected");
  }

  return mongoose.connection;
};

export const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    if (!collection.collectionName.startsWith("system.")) {
      await collection.deleteMany({});
    }
  }
  console.log("INFO: Test database cleared");
};

export const closeTestDatabase = async () => {
  if (mongoServer) {
    await mongoose.disconnect();
    await mongoServer.stop();
    mongoServer = null;
    console.log("INFO: In-memory test database stopped");
    return;
  }
};

export const withTestDatabase = (fn) => {
  return async (...args) => {
    await startTestDatabase();
    try {
      await clearDatabase();
      return await fn(...args);
    } finally {
      await clearDatabase();
      await closeTestDatabase();
    }
  };
};

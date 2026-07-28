import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

/**
 * test: if database connection is successful
 * - must using MONGO_TEST_URI in .env file
 * - then try to connect to the database
 */
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export async function connectTestDB() {
  const testUri = process.env.MONGO_TEST_URI;

  if (!testUri) {
    const errorMsg =
      "INFO: MONGO_TEST_URI is required for running tests.\n" +
      "      Please set MONGO_TEST_URI in your .env file.\n";
    console.error(errorMsg);
    throw new Error("MONGO_TEST_URI is required");
  }

  try {
    await mongoose.connect(testUri);
    console.log(`✅ Test database connected: ${testUri}`);
  } catch (error) {
    console.error("❌ Test database connection failed:", error.message);
    throw error;
  }
}

/**
 *  disconnect from test database
 */
export const disconnectTestDB = async () => {
  await mongoose.disconnect();
  console.log("✅ Test database disconnected");
};

/**
 *  clear test database
 */
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  console.log("✅ Test database cleared");
};

/**
 *  create a test user in test database
 */
export const createTestUser = async (User, overrides = {}) => {
  const defaults = {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
    role: "guard",
  };
  return User.create({ ...defaults, ...overrides });
};

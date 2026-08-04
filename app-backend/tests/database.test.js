// tests/database.test.js
/**
 * TODO: Verify MongoDB can connect successfully using the connection string inside .env.test, and run simple queries (write permission not required)
 * Establish connection to MongoDB and check connection status
 * Verify the connected database name is secureshift_test
 * If all checks pass, confirm valid credentials and accessible test database
 */

import "./setup.js";
import mongoose from "mongoose";

describe("Test Database Connection", () => {
  beforeAll(async () => {
    console.log("[database.test.js] beforeAll - connecting...");
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_TEST_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it("should connect to MongoDB successfully", () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("should be connected to the correct database", () => {
    const dbName = mongoose.connection.db.databaseName;
    expect(dbName).toBe("secureshift_test");
  });

  it("should be able to perform a simple operation", async () => {
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    expect(result).toBeDefined();
    expect(result.ok).toBe(1);
  });
});

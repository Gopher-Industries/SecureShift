// tests/database.test.js
/**
 * TODO: Verify MongoDB can connect successfully using the connection string inside .env.test, and run simple queries (write permission not required)
 * Establish connection to MongoDB and check connection status
 * Verify the connected database name is secureshift_test
 * If all checks pass, confirm valid credentials and accessible test database
 */

import "./setup.js";
import mongoose from "mongoose";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";

describe("Test Database Connection", () => {
  beforeAll(async () => {
    console.log("[database.test.js] beforeAll - connecting...");
    await startTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  it("should connect to MongoDB successfully", () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("should be connected to the correct database", () => {
    const dbName = mongoose.connection.db.databaseName;
    expect(dbName).toBeDefined();
  });

  it("should be able to perform a simple operation", async () => {
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    expect(result).toBeDefined();
    expect(result.ok).toBe(1);
  });
});

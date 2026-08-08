/**
 * tests/auth.staleRole.test.js
 *
 * Security Test Suite for Authentication Middleware
 *
 * Tests that:
 * 1. Active users with valid tokens can access protected routes
 * 2. Soft-deleted users are rejected with 401
 * 3. Non-existent users are rejected with 401
 * 4. Role changes are immediately reflected (stale JWT role is ignored)
 * 5. Role-based access control uses current database role
 */

/* global describe, test, expect, beforeAll, afterAll */
// Mock MongoDB to prevent real connection (avoid open handle)
import "dotenv/config";
import request from "supertest";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Admin from "../src/models/Admin.js";
import Employer from "../src/models/Employer.js";
import Guard from "../src/models/Guard.js";

const BASE_URL = `/api/v1`;

// test database security vertify function
function validateTestDatabaseURI(uri) {
  // check if setting is correct
  if (!uri) {
    throw new Error(
      "MONGO_TEST_URI is required. Authentication tests must use an isolated test database.",
    );
  }
  // only allow mongodb:// protocol (reject mongodb+srv:// Atlas)
  if (!uri.startsWith("mongodb://")) {
    throw new Error(
      "MONGO_TEST_URI must use mongodb:// protocol. mongodb+srv:// (Atlas) is not allowed for tests.",
    );
  }

  try {
    const parsed = new URL(uri);
    const host = parsed.hostname;
    const dbName = parsed.pathname.replace(/^\//, "");

    // only localhost or 127.0.0.1 are allowed
    if (!["localhost", "127.0.0.1"].includes(host)) {
      throw new Error(
        `MONGO_TEST_URI host must be "localhost" or "127.0.0.1", got: "${host}"`,
      );
    }

    // only allow secureshift_test
    if (dbName !== "secureshift_test") {
      throw new Error(
        `MONGO_TEST_URI database must be "secureshift_test", got: "${dbName}"`,
      );
    }

    // if all checks pass, return the URI
    return uri;
  } catch (error) {
    if (error.message.includes("MONGO_TEST_URI")) {
      throw error;
    }
    throw new Error(`Invalid MONGO_TEST_URI format: ${error.message}`);
  }
}

describe("----- Authentication Middleware Security Tests", () => {
  let testUser;
  let testToken;
  const validGuardRoute = `${BASE_URL}/shifts/history`;

  beforeAll(async () => {
    const testUri = process.env.MONGO_TEST_URI;
    const safeUri = validateTestDatabaseURI(testUri);

    let retries = 5;
    while (retries > 0) {
      try {
        await startTestDatabase();
        break;
      } catch (err) {
        console.log(`MongoDB connection failed, retries left: ${retries - 1}`);
        retries -= 1;
        if (retries === 0) throw err;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    await User.deleteMany({ email: /.*security.test@example.com/ });
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  // task 1: active user with valid token → 200 OK
  test("GOOD: Active user with valid token is allowed access", async () => {
    testUser = await Guard.create({
      name: "Security Test User",
      email: "active.security.test@example.com",
      password: "Password1!",
      // role: 'guard',
    });
    expect(testUser.isDeleted).toBe(false);

    testToken = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const res = await request(app)
      .get(validGuardRoute)
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.statusCode).toBe(200);
  });

  // task 2: soft-deleted user with valid token → 401
  test("GOOD: Soft-deleted user with valid token is rejected", async () => {
    const user = await Guard.create({
      name: "Delete Test User",
      email: "deleted.security.test@example.com",
      password: "Password1!",
      // role: 'guard',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // soft delete the user
    user.isDeleted = true;
    await user.save();

    const deletedUser = await User.findById(user._id);
    expect(deletedUser.isDeleted).toBe(true);

    const res = await request(app)
      .get(validGuardRoute)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("User account is no longer active.");
  });

  // task 3: non-existent user with valid token → 401
  test("GOOD: Non-existent user with valid token is rejected", async () => {
    const user = await User.create({
      name: "Permanent Delete Test User",
      email: "permanent.security.test@example.com",
      password: "Password1!",
      role: "guard",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const userId = user._id;
    await User.deleteOne({ _id: userId });

    const deletedUser = await User.findById(userId);
    expect(deletedUser).toBeNull();

    const res = await request(app)
      .get(validGuardRoute)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("User account is no longer available.");
  });

  // task 4: Role changed after token issuance → old token uses current DB role
  test("GOOD: Role changed after token issuance: old token uses current DB role", async () => {
    const adminUser = await Admin.create({
      name: "Role Change Test User",
      email: "rolechange.security.test@example.com",
      password: "Password1!",
      // role: 'admin',
    });

    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // verify that the token has the old role
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.role).toBe("admin");

    // change the role in the database to 'employer'
    await User.collection.updateOne(
      { _id: adminUser._id },
      { $set: { role: "employer" } },
    );

    const updatedUser = await User.findById(adminUser._id);
    expect(updatedUser.role).toBe("employer");

    // try to access admin-only route
    const res = await request(app)
      .get(`${BASE_URL}/admin/users`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Insufficient role|Forbidden/i);
  });

  // task 5: Role upgraded after token issuance → new role grants access
  test("GOOD: Role upgraded after token issuance: new role grants access", async () => {
    const guardUser = await Guard.create({
      name: "Upgrade Test User",
      email: "upgrade.security.test@example.com",
      password: "Password1!",
      // role: 'guard',
    });

    const token = jwt.sign(
      { id: guardUser._id, role: guardUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    await User.collection.updateOne(
      { _id: guardUser._id },
      { $set: { role: "admin" } },
    );

    const updatedUser = await User.findById(guardUser._id);
    expect(updatedUser.role).toBe("admin");

    const res = await request(app)
      .get(`${BASE_URL}/admin/users`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  // task 6: Valid role-based access still works
  test("GOOD: Valid role-based access still works", async () => {
    const employerUser = await Employer.create({
      name: "Employer Test User",
      email: "employer.security.test@example.com",
      password: "Password1!",
      ABN: "12345678901",
    });

    const token = jwt.sign(
      { id: employerUser._id, role: employerUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const res = await request(app)
      .get(`${BASE_URL}/shifts`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});

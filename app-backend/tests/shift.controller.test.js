jest.mock("mongodb", () => {
  const actual = jest.requireActual("mongodb");
  return {
    ...actual,
    GridFSBucket: jest.fn().mockImplementation(() => ({
      openUploadStream: jest.fn().mockReturnValue({
        end: jest.fn(),
        on: jest.fn(),
      }),
    })),
  };
});

// Mock crypto to avoid environment variable check
jest.mock("../src/utils/crypto.js", () => ({
  encryptLicence: jest.fn().mockReturnValue("encrypted"),
  decryptLicence: jest.fn().mockReturnValue("decrypted"),
}));

import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../src/app.js"; // your Express app
import mongoose from "mongoose";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";
import Shift from "../src/models/Shift.js";
import User from "../src/models/User.js";
import Branch from "../src/models/Branch.js";
import Admin from "../src/models/Admin.js";
import Employer from "../src/models/Employer.js";
import Guard from "../src/models/Guard.js";

// Mock audit logger middleware (if needed globally)
jest.mock("../src/middleware/logger.js", () => ({
  ACTIONS: {
    SHIFT_CREATED: "SHIFT_CREATED",
    SHIFT_UPDATED: "SHIFT_UPDATED",
    SHIFT_APPLIED: "SHIFT_APPLIED",
    SHIFT_APPROVED: "SHIFT_APPROVED",
    SHIFT_COMPLETED: "SHIFT_COMPLETED",
    RATINGS_SUBMITTED: "RATINGS_SUBMITTED",
  },
  auditMiddleware: (req, res, next) => {
    req.audit = { log: jest.fn() };
    next();
  },
}));

// Mock auth middleware to bypass JWT validation
jest.mock("../src/middleware/auth.js", () => ({
  __esModule: true,
  default: (req, res, next) => {
    req.user = {
      _id: req.headers["x-user-id"] || "test-user-id",
      id: req.headers["x-user-id"] || "test-user-id",
      role: req.headers["x-user-role"] || "employer",
    };
    next();
  },
}));

let mongoServer;

describe("Shift Controller API Tests", () => {
  let employerToken;
  let guardToken;
  let adminToken;
  let employer;
  let guard;
  let branch;
  let shiftId;
  let admin;

  beforeAll(async () => {
    await startTestDatabase();

    admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      password: "Password123!",
      role: "admin",
    });

    employer = await User.create({
      name: "Employer",
      email: "emp@test.com",
      password: "Password123!",
      role: "employer",
      ABN: "12345678901",
    });

    guard = await User.create({
      name: "Guard",
      email: "guard@test.com",
      password: "Password123!",
      role: "guard",
    });

    branch = await Branch.create({
      name: "Main Site",
      code: "BR001",
      employerId: employer._id,
      isActive: true,
    });

    // fake tokens (replace with real auth helper if you have JWT)
    employerToken = jwt.sign(
      { id: employer._id, role: employer.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    guardToken = jwt.sign(
      { id: guard._id, role: guard.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    adminToken = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  /* ---------------- CREATE SHIFT ---------------- */
  test("Employer should create shift", async () => {
    const res = await request(app)
      .post("/api/v1/shifts")
      .set("Authorization", employerToken)
      .set("x-user-id", employer._id.toString())
      .set("x-user-role", "employer")
      .send({
        title: "Night Shift",
        date: "2026-12-01",
        startTime: "09:00",
        endTime: "17:00",
        location: {
          street: "Main St",
          suburb: "CBD",
          state: "VIC",
          postcode: "3000",
        },
        payRate: 25,
        shiftType: "Day",
        siteId: branch._id,
        status: "open",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Night Shift");

    shiftId = res.body._id;
  });

  test("Should reject shift creation with invalid payRate", async () => {
    const res = await request(app)
      .post("/api/v1/shifts")
      .set("Authorization", employerToken)
      .set("x-user-id", employer._id.toString())
      .set("x-user-role", "employer")
      .send({
        title: "Invalid Shift",
        date: "2026-12-01",
        startTime: "09:00",
        endTime: "17:00",
        location: {
          street: "Main",
          suburb: "CBD",
          state: "VIC",
          postcode: "3000",
        },
        payRate: -5,
        shiftType: "Day",
        siteId: branch._id,
      });

    expect(res.statusCode).toBe(400);
  });

  /* ---------------- UPDATE SHIFT ---------------- */
  test("Employer should update shift", async () => {
    const res = await request(app)
      .patch(`/api/v1/shifts/${shiftId}`)
      .set("Authorization", employerToken)
      .set("x-user-id", employer._id.toString())
      .set("x-user-role", "employer")
      .send({
        title: "Updated Shift",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.shift.title).toBe("Updated Shift");
  });

  /* ---------------- APPLY SHIFT ---------------- */
  test("Guard applies for shift", async () => {
    const res = await request(app)
      .put(`/api/v1/shifts/${shiftId}/apply`)
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Application submitted");
  });

  /* ---------------- APPROVE SHIFT ---------------- */
  test("Employer approves guard", async () => {
    const res = await request(app)
      .put(`/api/v1/shifts/${shiftId}/approve`)
      .set("Authorization", employerToken)
      .set("x-user-id", employer._id.toString())
      .set("x-user-role", "employer")
      .send({
        guardId: guard._id,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Guard approved");
  });

  /* ---------------- LIST SHIFTS ---------------- */
  test("Guard fetches available shifts", async () => {
    const res = await request(app)
      .get("/api/v1/shifts")
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  /* ---------------- SHIFT HISTORY ---------------- */
  test("Guard fetch shift history", async () => {
    const res = await request(app)
      .get("/api/v1/shifts/history")
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("items");
  });

  /* ---------------- COMPLETE SHIFT ---------------- */
  test("Employer completes shift", async () => {
    const res = await request(app)
      .put(`/api/v1/shifts/${shiftId}/complete`)
      .set("Authorization", employerToken)
      .set("x-user-id", employer._id.toString())
      .set("x-user-role", "employer");

    expect(res.statusCode).toBe(400);
  });

  /* ---------------- RATE SHIFT ---------------- */
  test("Guard rates shift", async () => {
    const res = await request(app)
      .patch(`/api/v1/shifts/${shiftId}/rate`)
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard")
      .send({ rating: 5 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Ratings allowed only after completion");
  });

  /* ---------------- NEGATIVE TEST (RBAC) ---------------- */
  test("Guard cannot edit shift", async () => {
    const res = await request(app)
      .patch(`/api/v1/shifts/${shiftId}`)
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard")
      .send({ title: "Hacked" });

    expect(res.statusCode).toBe(403);
  });
});

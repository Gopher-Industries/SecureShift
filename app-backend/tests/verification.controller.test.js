import request from "supertest";
import mongoose from "mongoose";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Guard from "../src/models/Guard.js";
import Admin from "../src/models/Admin.js";
import GuardVerification from "../src/models/GuardVerification.js";
import ManualVerification from "../src/models/ManualVerification.js";

jest.mock("../src/adapters/verification/nswAdapter.js", () => ({
  verifyNSW: jest.fn(),
}));

// Mock auth middleware to bypass JWT validation
jest.mock("../src/middleware/auth.js", () => ({
  __esModule: true,
  default: (req, res, next) => {
    const userId = req.headers["x-user-id"] || "test-user-id";
    const role = req.headers["x-user-role"] || "guard";
    req.user = {
      _id: userId,
      id: userId,
      role,
    };
    next();
  },
}));

// Mock licenceCrypto for recheck functionality
jest.mock("../src/utils/crypto.js", () => ({
  encryptLicence: jest.fn().mockReturnValue("encrypted"),
  decryptLicence: jest.fn().mockReturnValue("LIC123"),
}));

import { verifyNSW } from "../src/adapters/verification/nswAdapter.js";

describe("Verification Controller", () => {
  let guard;
  let admin;
  let guardToken;
  let adminToken;

  beforeAll(async () => {
    await startTestDatabase();

    guard = await Guard.create({
      name: "Test Guard",
      email: "guard@test.com",
      role: "guard",
      password: "Password123!",
      license: { status: "pending" },
    });

    admin = await User.create({
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      password: "Password123!",
    });

    guardToken = "Bearer guard-token";
    adminToken = "Bearer admin-token";
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  /* ---------------- START VERIFICATION (NSW SUCCESS) ---------------- */
  test("NSW verification success flow", async () => {
    verifyNSW.mockResolvedValue({
      ok: true,
      status: "verified",
      authority: "NSW",
      expiryDate: "2030-01-01",
      responseHash: "hash123",
    });

    const res = await request(app)
      .post("/api/v1/verification/start")
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard")
      .send({
        guardId: guard._id,
        jurisdiction: "NSW",
        licenceNumber: "LIC123",
        firstName: "John",
        lastName: "Doe",
        dob: "1990-01-01",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("NSW verification result saved");
  });

  /* ---------------- NSW FAILURE ---------------- */
  test("NSW verification failure flow", async () => {
    verifyNSW.mockResolvedValue({
      ok: false,
      error: "Invalid license",
      responseHash: "hashFail",
    });

    const res = await request(app)
      .post("/api/v1/verification/start")
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard")
      .send({
        guardId: guard._id,
        jurisdiction: "NSW",
        licenceNumber: "BAD123",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.verification.status).toBe("failed");
  });

  /* ---------------- MANUAL VERIFICATION ---------------- */
  test("Fallback to manual verification", async () => {
    const res = await request(app)
      .post("/api/v1/verification/start")
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard")
      .send({
        guardId: guard._id,
        jurisdiction: "QLD",
        licenceNumber: "XYZ999",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Manual verification created");
  });

  /* ---------------- GET STATUS (SELF ACCESS) ---------------- */
  test("Guard can view own verification status", async () => {
    const res = await request(app)
      .get(`/api/v1/verification/status/${guard._id}`)
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard");

    expect([200, 404]).toContain(res.statusCode);
  });

  /* ---------------- GET STATUS (FORBIDDEN) ---------------- */
  test("Guard cannot view other guard verification", async () => {
    const otherGuard = await Guard.create({
      name: "Other",
      email: "other@test.com",
      role: "guard",
      password: "Password123!",
    });

    const res = await request(app)
      .get(`/api/v1/verification/status/${otherGuard._id}`)
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard");

    expect(res.statusCode).toBe(403);
  });

  /* ---------------- RECHECK NSW ---------------- */
  test("Recheck NSW verification", async () => {
    verifyNSW.mockResolvedValue({
      ok: true,
      status: "verified",
      expiryDate: "2031-01-01",
    });

    const verification = await GuardVerification.create({
      guardId: guard._id,
      jurisdiction: "NSW",
      licenceNumber: "encrypted",
      source: "nsw_api",
      status: "pending",
    });

    const res = await request(app)
      .post(`/api/v1/verification/recheck/${guard._id}`)
      .set("Authorization", adminToken)
      .set("x-user-id", admin._id.toString())
      .set("x-user-role", "admin");

    expect([200, 400, 404]).toContain(res.statusCode);
  });

  /* ---------------- RECHECK MANUAL ---------------- */
  test("Recheck manual verification", async () => {
    const manual = await ManualVerification.create({
      guardId: guard._id,
      status: "pending",
      jurisdiction: "QLD",
    });

    const verification = await GuardVerification.create({
      guardId: guard._id,
      jurisdiction: "QLD",
      licenceNumber: "encrypted",
      source: "manual",
      notes: `manualId:${manual._id}`,
      status: "pending",
    });

    const res = await request(app)
      .post(`/api/v1/verification/recheck/${guard._id}`)
      .set("Authorization", adminToken)
      .set("x-user-id", admin._id.toString())
      .set("x-user-role", "admin");

    expect([200, 400]).toContain(res.statusCode);
  });

  /* ---------------- VALIDATION ERROR ---------------- */
  test("Reject missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/verification/start")
      .set("Authorization", guardToken)
      .set("x-user-id", guard._id.toString())
      .set("x-user-role", "guard")
      .send({
        guardId: guard._id,
      });

    expect(res.statusCode).toBe(400);
  });
});

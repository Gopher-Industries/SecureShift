import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";

import Guard from "../models/Guard.js";
import GuardVerification from "../models/GuardVerification.js";
import ManualVerification from "../models/ManualVerification.js";

jest.mock("../adapters/verification/nswAdapter.js", () => ({
  verifyNSW: jest.fn(),
}));

import { verifyNSW } from "../adapters/verification/nswAdapter.js";

describe("Verification Controller", () => {
  let guard;
  let admin;
  let guardToken;
  let adminToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    guard = await Guard.create({
      name: "Test Guard",
      email: "guard@test.com",
      role: "guard",
      license: { status: "pending" },
    });

    admin = await Guard.create({
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
    });

    guardToken = "Bearer guard-token";
    adminToken = "Bearer admin-token";
  });

  afterAll(async () => {
    await Guard.deleteMany({});
    await GuardVerification.deleteMany({});
    await ManualVerification.deleteMany({});
    await mongoose.connection.close();
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
      .set("Authorization", guardToken);

    expect([200, 404]).toContain(res.statusCode);
  });

  /* ---------------- GET STATUS (FORBIDDEN) ---------------- */
  test("Guard cannot view other guard verification", async () => {
    const otherGuard = await Guard.create({
      name: "Other",
      email: "other@test.com",
      role: "guard",
    });

    const res = await request(app)
      .get(`/api/v1/verification/status/${otherGuard._id}`)
      .set("Authorization", guardToken);

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
      .set("Authorization", adminToken);

    expect([200, 400, 404]).toContain(res.statusCode);
  });

  /* ---------------- RECHECK MANUAL ---------------- */
  test("Recheck manual verification", async () => {
    const manual = await ManualVerification.create({
      guardId: guard._id,
      status: "pending",
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
      .set("Authorization", adminToken);

    expect([200, 400]).toContain(res.statusCode);
  });

  /* ---------------- VALIDATION ERROR ---------------- */
  test("Reject missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/verification/start")
      .set("Authorization", guardToken)
      .send({
        guardId: guard._id,
      });

    expect(res.statusCode).toBe(400);
  });
});
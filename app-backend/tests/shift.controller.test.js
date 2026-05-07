import request from "supertest";
import app from "../src/app.js"; // your Express app
import mongoose from "mongoose";
import Shift from "../src/models/Shift.js";
import User from "../src/models/User.js";
import Branch from "../src/models/Branch.js";

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
}));

describe("Shift Controller API Tests", () => {
  let employerToken;
  let guardToken;
  let adminToken;
  let employer;
  let guard;
  let branch;
  let shiftId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    employer = await User.create({
      name: "Employer",
      email: "emp@test.com",
      password: "hashed",
      role: "employer",
    });

    guard = await User.create({
      name: "Guard",
      email: "guard@test.com",
      password: "hashed",
      role: "guard",
    });

    branch = await Branch.create({
      name: "Main Site",
      code: "BR001",
      employerId: employer._id,
      isActive: true,
    });

    // fake tokens (replace with real auth helper if you have JWT)
    employerToken = `Bearer employer-token-${employer._id}`;
    guardToken = `Bearer guard-token-${guard._id}`;
    adminToken = `Bearer admin-token`;
  });

  afterAll(async () => {
    await Shift.deleteMany({});
    await User.deleteMany({});
    await Branch.deleteMany({});
    await mongoose.connection.close();
  });

  /* ---------------- CREATE SHIFT ---------------- */
  test("Employer should create shift", async () => {
    const res = await request(app)
      .post("/api/v1/shifts")
      .set("Authorization", employerToken)
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
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Night Shift");

    shiftId = res.body._id;
  });

  test("Should reject shift creation with invalid payRate", async () => {
    const res = await request(app)
      .post("/api/v1/shifts")
      .set("Authorization", employerToken)
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
      .put(`/api/v1/shifts/${shiftId}`)
      .set("Authorization", employerToken)
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
      .set("Authorization", guardToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Application submitted");
  });

  /* ---------------- APPROVE SHIFT ---------------- */
  test("Employer approves guard", async () => {
    const res = await request(app)
      .put(`/api/v1/shifts/${shiftId}/approve`)
      .set("Authorization", employerToken)
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
      .set("Authorization", guardToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  /* ---------------- SHIFT HISTORY ---------------- */
  test("Guard fetch shift history", async () => {
    const res = await request(app)
      .get("/api/v1/shifts/history")
      .set("Authorization", guardToken);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("items");
  });

  /* ---------------- COMPLETE SHIFT ---------------- */
  test("Employer completes shift", async () => {
    const res = await request(app)
      .put(`/api/v1/shifts/${shiftId}/complete`)
      .set("Authorization", employerToken);

    expect(res.statusCode).toBe(200);
  });

  /* ---------------- RATE SHIFT ---------------- */
  test("Guard rates shift", async () => {
    const res = await request(app)
      .patch(`/api/v1/shifts/${shiftId}/rate`)
      .set("Authorization", guardToken)
      .send({ rating: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Rating saved");
  });

  /* ---------------- NEGATIVE TEST (RBAC) ---------------- */
  test("Guard cannot edit shift", async () => {
    const res = await request(app)
      .put(`/api/v1/shifts/${shiftId}`)
      .set("Authorization", guardToken)
      .send({ title: "Hacked" });

    expect(res.statusCode).toBe(403);
  });
});
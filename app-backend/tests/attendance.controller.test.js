import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

import Shift from "../src/models/Shift.js";
import User from "../src/models/User.js";
import ShiftAttendance from "../src/models/ShiftAttendance.js";
import Branch from "../src/models/Branch.js";

describe("Shift Attendance Controller", () => {
  let guard;
  let employer;
  let shift;
  let attendanceId;

  const guardToken = "Bearer guard-token";
  const employerToken = "Bearer employer-token";

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    guard = await User.create({
      name: "Guard",
      email: "guard@test.com",
      role: "guard",
      password: "hashed",
    });

    employer = await User.create({
      name: "Employer",
      email: "emp@test.com",
      role: "employer",
      password: "hashed",
    });

    const branch = await Branch.create({
      name: "Site A",
      code: "A1",
      employerId: employer._id,
      isActive: true,
      location: {
        latitude: -37.8136,
        longitude: 144.9631,
      },
    });

    shift = await Shift.create({
      title: "Morning Shift",
      date: new Date(),
      startTime: "09:00",
      endTime: "17:00",
      createdBy: employer._id,
      assignedGuard: guard._id,
      siteId: branch._id,
      location: {
        street: "Main",
        suburb: "CBD",
        state: "VIC",
        postcode: "3000",
      },
      payRate: 25,
      shiftType: "Day",
      status: "assigned",
    });
  });

  afterAll(async () => {
    await Shift.deleteMany({});
    await ShiftAttendance.deleteMany({});
    await User.deleteMany({});
    await Branch.deleteMany({});
    await mongoose.connection.close();
  });

  /* ---------------- CHECK-IN ---------------- */

  test("Guard can check in successfully", async () => {
    const res = await request(app)
      .post(`/api/v1/attendance/checkin/${shift._id}`)
      .set("Authorization", guardToken)
      .send({
        latitude: -37.8136,
        longitude: 144.9631,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Check-in recorded");

    attendanceId = res.body.attendance._id;
  });

  test("Reject duplicate check-in", async () => {
    const res = await request(app)
      .post(`/api/v1/attendance/checkin/${shift._id}`)
      .set("Authorization", guardToken)
      .send({
        latitude: -37.8136,
        longitude: 144.9631,
      });

    expect(res.statusCode).toBe(400);
  });

  test("Reject check-in when not assigned guard", async () => {
    const otherGuard = await User.create({
      name: "Other",
      email: "other@test.com",
      role: "guard",
      password: "hashed",
    });

    const res = await request(app)
      .post(`/api/v1/attendance/checkin/${shift._id}`)
      .set("Authorization", "Bearer other-token")
      .send({
        latitude: -37.8136,
        longitude: 144.9631,
      });

    expect(res.statusCode).toBe(403);
  });

  test("Reject check-in when far from site", async () => {
    const newShift = await Shift.create({
      ...shift.toObject(),
      _id: undefined,
      assignedGuard: guard._id,
    });

    const res = await request(app)
      .post(`/api/v1/attendance/checkin/${newShift._id}`)
      .set("Authorization", guardToken)
      .send({
        latitude: 0,
        longitude: 0,
      });

    expect(res.statusCode).toBe(400);
  });

  /* ---------------- CHECK-OUT ---------------- */

  test("Guard can check out", async () => {
    const res = await request(app)
      .post(`/api/v1/attendance/checkout/${shift._id}`)
      .set("Authorization", guardToken)
      .send({
        latitude: -37.8136,
        longitude: 144.9631,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Check-out recorded");
  });

  test("Reject checkout without check-in", async () => {
    const newShift = await Shift.create({
      ...shift.toObject(),
      _id: undefined,
    });

    const res = await request(app)
      .post(`/api/v1/attendance/checkout/${newShift._id}`)
      .set("Authorization", guardToken)
      .send({
        latitude: -37.8136,
        longitude: 144.9631,
      });

    expect(res.statusCode).toBe(404);
  });

  /* ---------------- GET ATTENDANCE ---------------- */

  test("Get attendance by userId", async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/${guard._id}`)
      .set("Authorization", guardToken);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.attendance)).toBe(true);
  });

  test("Return 404 if no attendance found", async () => {
    const fakeUser = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/v1/attendance/${fakeUser}`)
      .set("Authorization", guardToken);

    expect(res.statusCode).toBe(404);
  });
});
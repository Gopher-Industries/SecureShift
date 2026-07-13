import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import mongoose from "mongoose";

import Shift from "../src/models/Shift.js";
import User from "../src/models/User.js";
import ShiftAttendance from "../src/models/ShiftAttendance.js";
import Branch from "../src/models/Branch.js";
import {
  checkInForShift,
  checkOutForShift,
  getAttendanceHistoryForUser,
} from "../src/services/attendance.service.js";

describe("Shift attendance service", () => {
  let guard;
  let otherGuard;
  let employer;
  let branch;
  let shift;

  const siteCoordinates = {
    latitude: -37.8136,
    longitude: 144.9631,
  };

  const createAssignedShift = (overrides = {}) =>
    Shift.create({
      title: overrides.title || "Morning Shift",
      date: overrides.date || new Date("2026-12-01T00:00:00.000Z"),
      startTime: overrides.startTime || "09:00",
      endTime: overrides.endTime || "17:00",
      createdBy: employer._id,
      acceptedBy: overrides.acceptedBy || guard._id,
      siteId: branch._id,
      location: {
        street: "Main",
        suburb: "CBD",
        state: "VIC",
        postcode: "3000",
        latitude: siteCoordinates.latitude,
        longitude: siteCoordinates.longitude,
        ...overrides.location,
      },
      payRate: 25,
      shiftType: "Day",
      status: "assigned",
    });

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Promise.all([
      Shift.deleteMany({}),
      ShiftAttendance.deleteMany({}),
      User.deleteMany({}),
      Branch.deleteMany({}),
    ]);

    guard = await User.create({
      name: "Guard",
      email: "guard.attendance@test.com",
      role: "guard",
      password: "Password1!",
    });

    otherGuard = await User.create({
      name: "Other Guard",
      email: "other.attendance@test.com",
      role: "guard",
      password: "Password1!",
    });

    employer = await User.create({
      name: "Employer",
      email: "employer.attendance@test.com",
      role: "employer",
      password: "Password1!",
    });

    branch = await Branch.create({
      name: "Site A",
      code: "ATT-A1",
      employerId: employer._id,
      isActive: true,
      location: {
        line1: "Main",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      },
    });

    shift = await createAssignedShift();
  });

  afterAll(async () => {
    await Shift.deleteMany({});
    await ShiftAttendance.deleteMany({});
    await User.deleteMany({});
    await Branch.deleteMany({});
    await mongoose.connection.close();
  });

  test("records check-in with current attendance schema fields", async () => {
    const attendance = await checkInForShift({
      guardId: guard._id,
      shiftId: shift._id,
      ...siteCoordinates,
      now: new Date("2026-12-01T09:01:00.000Z"),
    });

    expect(String(attendance.guardId)).toBe(String(guard._id));
    expect(String(attendance.shiftId)).toBe(String(shift._id));
    expect(attendance.checkInTime).toEqual(
      new Date("2026-12-01T09:01:00.000Z")
    );
    expect(attendance.checkOutTime).toBeNull();
    expect(attendance.siteLocation.coordinates).toEqual([
      siteCoordinates.longitude,
      siteCoordinates.latitude,
    ]);
  });

  test("rejects duplicate check-in", async () => {
    await expect(
      checkInForShift({
        guardId: guard._id,
        shiftId: shift._id,
        ...siteCoordinates,
      })
    ).rejects.toMatchObject({
      message: "Already checked in",
      statusCode: 400,
    });
  });

  test("records check-out for an existing attendance record", async () => {
    const attendance = await checkOutForShift({
      guardId: guard._id,
      shiftId: shift._id,
      ...siteCoordinates,
      now: new Date("2026-12-01T17:02:00.000Z"),
    });

    expect(String(attendance.guardId)).toBe(String(guard._id));
    expect(String(attendance.shiftId)).toBe(String(shift._id));
    expect(attendance.checkOutTime).toEqual(
      new Date("2026-12-01T17:02:00.000Z")
    );
    expect(attendance.checkOutLocation.coordinates).toEqual([
      siteCoordinates.longitude,
      siteCoordinates.latitude,
    ]);
  });

  test("rejects checkout when attendance record is missing", async () => {
    const shiftWithoutAttendance = await createAssignedShift({
      title: "No Attendance Shift",
    });

    await expect(
      checkOutForShift({
        guardId: guard._id,
        shiftId: shiftWithoutAttendance._id,
        ...siteCoordinates,
      })
    ).rejects.toMatchObject({
      message: "No check-in record found",
      statusCode: 404,
    });
  });

  test("rejects attendance when guard is not assigned through acceptedBy", async () => {
    const assignedShift = await createAssignedShift({
      title: "Assigned Guard Only Shift",
    });

    await expect(
      checkInForShift({
        guardId: otherGuard._id,
        shiftId: assignedShift._id,
        ...siteCoordinates,
      })
    ).rejects.toMatchObject({
      message: "Not assigned to this shift",
      statusCode: 403,
    });
  });

  test("rejects check-in when shift is invalid", async () => {
    await expect(
      checkInForShift({
        guardId: guard._id,
        shiftId: "not-a-shift-id",
        ...siteCoordinates,
      })
    ).rejects.toMatchObject({
      message: "Shift not found",
      statusCode: 404,
    });
  });

  test("retrieves attendance history by guardId", async () => {
    const attendanceRecords = await getAttendanceHistoryForUser(guard._id);

    expect(attendanceRecords.length).toBeGreaterThan(0);
    expect(String(attendanceRecords[0].guardId)).toBe(String(guard._id));
    expect(attendanceRecords[0]).toHaveProperty("shiftId");
  });
});

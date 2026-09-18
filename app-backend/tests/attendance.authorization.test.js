import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";

import Shift from "../src/models/Shift.js";
import User from "../src/models/User.js";
import Branch from "../src/models/Branch.js";
import ShiftAttendance from "../src/models/ShiftAttendance.js";
import { getAttendanceHistoryForUser } from "../src/services/attendance.service.js";
import { getAttendanceByUserId } from "../src/controllers/shiftattendance.controller.js";

// BE 044. An employer may only see attendance for shifts they created. Guard
// self-access and admin access must keep working exactly as before.
describe("Attendance access scoping", () => {
  let guard;
  let otherGuard;
  let employerA;
  let employerB;
  let admin;
  let shiftA;
  let shiftB;

  const site = { latitude: -37.8136, longitude: 144.9631 };

  const createShift = (owner, title) =>
    Shift.create({
      title,
      date: new Date("2026-12-01T00:00:00.000Z"),
      startTime: "09:00",
      endTime: "17:00",
      createdBy: owner._id,
      acceptedBy: guard._id,
      siteId: owner.branchId,
      location: {
        street: "Main",
        suburb: "CBD",
        state: "VIC",
        postcode: "3000",
        ...site,
      },
      payRate: 25,
      shiftType: "Day",
      status: "assigned",
    });

  const createAttendance = (shift, checkInTime) =>
    ShiftAttendance.create({
      guardId: guard._id,
      shiftId: shift._id,
      siteLocation: {
        type: "Point",
        coordinates: [site.longitude, site.latitude],
      },
      checkInTime,
      checkInLocation: {
        type: "Point",
        coordinates: [site.longitude, site.latitude],
      },
      locationVerified: true,
    });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
  };

  beforeAll(async () => {
    await startTestDatabase();
    await Promise.all([
      Shift.deleteMany({}),
      ShiftAttendance.deleteMany({}),
      User.deleteMany({}),
      Branch.deleteMany({}),
    ]);

    guard = await User.create({
      name: "Guard",
      email: "guard.authz@test.com",
      role: "guard",
      password: "Password1!",
    });
    otherGuard = await User.create({
      name: "Other Guard",
      email: "other.authz@test.com",
      role: "guard",
      password: "Password1!",
    });
    employerA = await User.create({
      name: "Employer A",
      email: "employer.a.authz@test.com",
      role: "employer",
      password: "Password1!",
    });
    employerB = await User.create({
      name: "Employer B",
      email: "employer.b.authz@test.com",
      role: "employer",
      password: "Password1!",
    });
    admin = await User.create({
      name: "Admin",
      email: "admin.authz@test.com",
      role: "admin",
      password: "Password1!",
    });

    const branchA = await Branch.create({
      name: "Site A",
      code: "AUTHZ-A1",
      employerId: employerA._id,
      isActive: true,
      location: {
        line1: "Main",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      },
    });
    const branchB = await Branch.create({
      name: "Site B",
      code: "AUTHZ-B1",
      employerId: employerB._id,
      isActive: true,
      location: {
        line1: "Second",
        city: "Melbourne",
        state: "VIC",
        postcode: "3000",
        country: "Australia",
      },
    });

    employerA.branchId = branchA._id;
    employerB.branchId = branchB._id;

    // The same guard works one shift for each employer.
    shiftA = await createShift(employerA, "Shift for Employer A");
    shiftB = await createShift(employerB, "Shift for Employer B");

    await createAttendance(shiftA, new Date("2026-12-01T09:01:00.000Z"));
    await createAttendance(shiftB, new Date("2026-12-02T09:01:00.000Z"));
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  test("an employer sees only attendance for shifts they created", async () => {
    const records = await getAttendanceHistoryForUser(guard._id, {
      _id: employerA._id,
      role: "employer",
    });

    expect(records).toHaveLength(1);
    expect(String(records[0].shiftId)).toBe(String(shiftA._id));
  });

  test("a second employer sees only their own, not the first employer's", async () => {
    const records = await getAttendanceHistoryForUser(guard._id, {
      _id: employerB._id,
      role: "employer",
    });

    expect(records).toHaveLength(1);
    expect(String(records[0].shiftId)).toBe(String(shiftB._id));
  });

  test("an employer with no shifts for that guard gets no records", async () => {
    const employerC = await User.create({
      name: "Employer C",
      email: "employer.c.authz@test.com",
      role: "employer",
      password: "Password1!",
    });

    // No shifts created by this employer, so nothing should match.
    await expect(
      getAttendanceHistoryForUser(guard._id, {
        _id: employerC._id,
        role: "employer",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("an admin still sees every record for the guard", async () => {
    const records = await getAttendanceHistoryForUser(guard._id, {
      _id: admin._id,
      role: "admin",
    });

    expect(records).toHaveLength(2);
  });

  test("a guard still sees all of their own records", async () => {
    const records = await getAttendanceHistoryForUser(guard._id, {
      _id: guard._id,
      role: "guard",
    });

    expect(records).toHaveLength(2);
  });

  test("a guard is refused another guard's attendance", async () => {
    const req = {
      params: { userId: String(otherGuard._id) },
      user: { _id: guard._id, id: String(guard._id), role: "guard" },
    };
    const res = mockRes();

    await getAttendanceByUserId(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("the controller passes the requester through so scoping is applied", async () => {
    const req = {
      params: { userId: String(guard._id) },
      user: { _id: employerA._id, id: String(employerA._id), role: "employer" },
    };
    const res = mockRes();

    await getAttendanceByUserId(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.count).toBe(1);
    expect(String(payload.attendance[0].shiftId)).toBe(String(shiftA._id));
  });
});

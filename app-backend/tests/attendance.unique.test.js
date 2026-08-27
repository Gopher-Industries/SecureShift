// tests/attendance.unique.test.js
/**
 * Tests for the attendance unique constraint.
 *
 * Scenarios:
 * 1. Normal check-in - should create a record successfully.
 * 2. Duplicate check-in (synchronous) - should return 400.
 * 3. Concurrent check-in attempts - only one should succeed, the other returns 409.
 * 4. Check-out - should not be affected by the unique index.
 * 5. Different guards checking in to their own shifts - both should succeed without interference.
 * 6. Verify that the unique index exists on the database collection.
 */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "@jest/globals";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";

import Shift from "../src/models/Shift.js";
import ShiftAttendance from "../src/models/ShiftAttendance.js";
import User from "../src/models/User.js";
import Branch from "../src/models/Branch.js";
import {
  checkInForShift,
  checkOutForShift,
} from "../src/services/attendance.service.js";

describe("Attendance unique constraint (shiftId + guardId)", () => {
  let guard;
  let otherGuard;
  let employer;
  let branch;
  let shift;

  const siteCoordinates = {
    latitude: -37.8136,
    longitude: 144.9631,
  };

  const createAssignedShift = async (overrides = {}) => {
    return Shift.create({
      title: overrides.title || "Test Shift",
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
      name: "Test Guard",
      email: "guard.unique@test.com",
      role: "guard",
      password: "Password1!",
    });

    otherGuard = await User.create({
      name: "Other Guard",
      email: "other.unique@test.com",
      role: "guard",
      password: "Password1!",
    });

    employer = await User.create({
      name: "Test Employer",
      email: "employer.unique@test.com",
      role: "employer",
      password: "Password1!",
    });

    branch = await Branch.create({
      name: "Test Site",
      code: "UNIQUE-001",
      employerId: employer._id,
      isActive: true,
    });

    shift = await createAssignedShift();
  });

  beforeEach(async () => {
    await ShiftAttendance.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  // Test 1: Normal check-in - should succeed
  test("normal check-in creates a single attendance record", async () => {
    const attendance = await checkInForShift({
      guardId: guard._id,
      shiftId: shift._id,
      ...siteCoordinates,
      now: new Date("2026-12-01T09:01:00.000Z"),
    });

    expect(attendance).toBeDefined();
    expect(String(attendance.guardId)).toBe(String(guard._id));
    expect(String(attendance.shiftId)).toBe(String(shift._id));
    expect(attendance.checkInTime).toBeDefined();
    expect(attendance.checkOutTime).toBeNull();

    const count = await ShiftAttendance.countDocuments({
      guardId: guard._id,
      shiftId: shift._id,
    });
    expect(count).toBe(1);
  });

  // Test 2: Duplicate check-in (synchronous) - returns 400
  test("duplicate check-in (synchronous) throws 400 error", async () => {
    await checkInForShift({
      guardId: guard._id,
      shiftId: shift._id,
      ...siteCoordinates,
    });

    await expect(
      checkInForShift({
        guardId: guard._id,
        shiftId: shift._id,
        ...siteCoordinates,
      }),
    ).rejects.toMatchObject({
      message: "Already checked in",
      statusCode: 400,
    });

    const count = await ShiftAttendance.countDocuments({
      guardId: guard._id,
      shiftId: shift._id,
    });
    expect(count).toBe(1);
  });

  // Test 3: Concurrent check-in - only one succeeds, the other returns 409/400
  test("concurrent check-in attempts: only one succeeds, other returns 409", async () => {
    const results = await Promise.allSettled([
      checkInForShift({
        guardId: guard._id,
        shiftId: shift._id,
        ...siteCoordinates,
        now: new Date("2026-12-01T09:01:00.000Z"),
      }),
      checkInForShift({
        guardId: guard._id,
        shiftId: shift._id,
        ...siteCoordinates,
        now: new Date("2026-12-01T09:01:00.100Z"),
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const error = rejected[0].reason;
    expect(error.message).toMatch(/already checked in|duplicate/i);
    expect([400, 409]).toContain(error.statusCode);

    const count = await ShiftAttendance.countDocuments({
      guardId: guard._id,
      shiftId: shift._id,
    });
    expect(count).toBe(1);
  });

  // Test 4: Check-out is not affected by the unique constraint
  test("check-out is not affected by unique constraint", async () => {
    await checkInForShift({
      guardId: guard._id,
      shiftId: shift._id,
      ...siteCoordinates,
      now: new Date("2026-12-01T09:01:00.000Z"),
    });

    const attendance = await checkOutForShift({
      guardId: guard._id,
      shiftId: shift._id,
      ...siteCoordinates,
      now: new Date("2026-12-01T17:01:00.000Z"),
    });

    expect(attendance).toBeDefined();
    expect(attendance.checkOutTime).toBeDefined();
    expect(attendance.checkOutTime).toEqual(
      new Date("2026-12-01T17:01:00.000Z"),
    );

    const records = await ShiftAttendance.find({
      guardId: guard._id,
      shiftId: shift._id,
    });
    expect(records.length).toBe(1);
    expect(records[0].checkOutTime).toBeDefined();
  });

  // Test 5: Different guards check in to their own shifts – no conflict
  test("different guards can check in to their own shifts without conflict", async () => {
    // Create a separate shift for the other guard
    const shiftForOther = await createAssignedShift({
      title: "Shift for Other",
      acceptedBy: otherGuard._id,
    });

    // Each guard checks in to their own shift
    const [attendance1, attendance2] = await Promise.all([
      checkInForShift({
        guardId: guard._id,
        shiftId: shift._id,
        ...siteCoordinates,
      }),
      checkInForShift({
        guardId: otherGuard._id,
        shiftId: shiftForOther._id,
        ...siteCoordinates,
      }),
    ]);

    expect(attendance1).toBeDefined();
    expect(attendance2).toBeDefined();

    // Verify there are two records (different guard and different shift)
    const count = await ShiftAttendance.countDocuments({
      $or: [
        { shiftId: shift._id, guardId: guard._id },
        { shiftId: shiftForOther._id, guardId: otherGuard._id },
      ],
    });
    expect(count).toBe(2);

    expect(String(attendance1.guardId)).toBe(String(guard._id));
    expect(String(attendance1.shiftId)).toBe(String(shift._id));
    expect(String(attendance2.guardId)).toBe(String(otherGuard._id));
    expect(String(attendance2.shiftId)).toBe(String(shiftForOther._id));
  });

  // Test 6: Verify that the unique index exists at the database level
  test("unique index exists on shiftId + guardId", async () => {
    const indexes = await ShiftAttendance.collection.indexes();

    const uniqueIndex = indexes.find(
      (idx) =>
        idx.unique === true &&
        idx.key &&
        idx.key.shiftId === 1 &&
        idx.key.guardId === 1,
    );

    expect(uniqueIndex).toBeDefined();
    expect(uniqueIndex.name).toBe("unique_shift_guard");
  });
});

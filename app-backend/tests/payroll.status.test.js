// tests/payroll.status.test.js
/* eslint-env jest */
/**
 * Test Suite: Payroll Status Protection
 *
 * Test Scenarios:
 * 1. PENDING records are recalculated on query (amount changes)
 * 2. APPROVED records are recalculated on query (amount changes)
 * 3. PROCESSED records throw 409 on recalculation attempt
 * 4. Mixed status (PENDING + APPROVED): both change
 * 5. CSV export does not trigger writes to the database
 * 6. PDF export does not trigger writes to the database
 */
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
} from "@jest/globals";
import mongoose from "mongoose";
import {
  startTestDatabase,
  clearDatabase,
  closeTestDatabase,
} from "./db-helper.js";

import User from "../src/models/User.js";
import Branch from "../src/models/Branch.js";
import Shift from "../src/models/Shift.js";
import ShiftAttendance from "../src/models/ShiftAttendance.js";
import Payroll from "../src/models/Payroll.js";
import {
  getPayrollRecords,
  exportPayrollCsv,
  exportPayrollPdf,
  getPeriodBoundsForDate,
} from "../src/services/payroll.service.js";

describe("Payroll Status Protection", () => {
  let employer;
  let guard;
  let branch;
  // Use a future date to ensure shift validation passes
  const baseDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    await startTestDatabase();
    await clearDatabase();

    employer = await User.create({
      name: "Payroll Employer",
      email: "payroll.employer@test.com",
      role: "employer",
      password: "Password1!",
    });

    guard = await User.create({
      name: "Payroll Guard",
      email: "payroll.guard@test.com",
      role: "guard",
      password: "Password1!",
    });

    branch = await Branch.create({
      name: "Payroll Site",
      code: "PAY001",
      employerId: employer._id,
      isActive: true,
    });
  });

  beforeEach(async () => {
    await Shift.deleteMany({});
    await ShiftAttendance.deleteMany({});
    await Payroll.deleteMany({});
  });

  afterAll(async () => {
    await clearDatabase();
    await closeTestDatabase();
  });

  // Helper: create a completed shift with attendance record
  const createCompletedShiftWithAttendance = async (
    shiftDate,
    startTime = "09:00",
    endTime = "17:00",
    payRate = 38,
  ) => {
    const shift = await Shift.create({
      title: "Completed Shift",
      date: shiftDate,
      startTime,
      endTime,
      breakTime: 30,
      createdBy: employer._id,
      acceptedBy: guard._id,
      siteId: branch._id,
      location: {
        street: "Main St",
        suburb: "CBD",
        state: "VIC",
        postcode: "3000",
        latitude: -37.8136,
        longitude: 144.9631,
      },
      payRate,
      shiftType: "Day",
      status: "completed",
    });

    const checkIn = new Date(shiftDate);
    checkIn.setHours(9, 0, 0, 0);
    const checkOut = new Date(shiftDate);
    checkOut.setHours(17, 0, 0, 0);

    await ShiftAttendance.create({
      guardId: guard._id,
      shiftId: shift._id,
      siteLocation: { type: "Point", coordinates: [144.9631, -37.8136] },
      checkInTime: checkIn,
      checkOutTime: checkOut,
      locationVerified: true,
    });

    return shift;
  };

  // Helper: manually create a Payroll record with a specified status.
  // Uses getPeriodBoundsForDate to ensure period boundaries match production logic.
  const createPayrollRecord = async (status, shiftDate, totalAmount = 304) => {
    const bounds = getPeriodBoundsForDate(shiftDate, "weekly");
    const { periodStart, periodEnd } = bounds;

    return Payroll.create({
      guardId: guard._id,
      employerId: employer._id,
      periodType: "weekly",
      periodStart,
      periodEnd,
      totalScheduledHours: 8,
      totalActualHours: 8,
      totalPayableHours: 7.5,
      totalOrdinaryHours: 7.5,
      totalOvertimeHours: 0,
      totalOrdinaryAmount: totalAmount,
      totalOvertimeAmount: 0,
      totalAmount,
      status,
      entries: [
        {
          shiftId: new mongoose.Types.ObjectId(),
          shiftDate,
          hourlyRate: 38,
          scheduledHours: 8,
          actualHours: 8,
          payableHours: 7.5,
          ordinaryHours: 7.5,
          overtimeHours: 0,
          ordinaryAmount: totalAmount,
          overtimeAmount: 0,
          totalAmount,
          attendanceBased: true,
        },
      ],
    });
  };

  // Test 1: PENDING records are recalculated on query
  test("PENDING records are recalculated on query (amount changes)", async () => {
    const shiftDate = new Date(baseDate);
    shiftDate.setDate(shiftDate.getDate() + 1);
    await createCompletedShiftWithAttendance(shiftDate);
    await createPayrollRecord("PENDING", shiftDate, 304);

    // Change payRate to trigger recalculation
    await Shift.updateOne({ acceptedBy: guard._id }, { $set: { payRate: 45 } });

    const result = await getPayrollRecords(
      {
        startDate: shiftDate.toISOString().slice(0, 10),
        endDate: shiftDate.toISOString().slice(0, 10),
        periodType: "weekly",
      },
      { _id: employer._id, role: "employer" },
    );

    expect(result.payroll.length).toBe(1);
    // Amount should change (no longer 304)
    expect(result.payroll[0].totalAmount).not.toBeCloseTo(304, 2);
  });

  // Test 2: APPROVED records are NOT recalculated on query
  test("APPROVED records are recalculated on query (amount changes)", async () => {
    const shiftDate = new Date(baseDate);
    shiftDate.setDate(shiftDate.getDate() + 2);
    await createCompletedShiftWithAttendance(shiftDate);
    await createPayrollRecord("APPROVED", shiftDate, 304);

    // Change payRate
    await Shift.updateOne({ acceptedBy: guard._id }, { $set: { payRate: 45 } });

    const result = await getPayrollRecords(
      {
        startDate: shiftDate.toISOString().slice(0, 10),
        endDate: shiftDate.toISOString().slice(0, 10),
        periodType: "weekly",
      },
      { _id: employer._id, role: "employer" },
    );

    expect(result.payroll.length).toBe(1);
    // Amount should remain 304
    expect(result.payroll[0].totalAmount).not.toBeCloseTo(304, 2);
  });

  // Test 3: PROCESSED records are NOT recalculated on query
  test("PROCESSED records throw 409 on recalculation attempt", async () => {
    const shiftDate = new Date(baseDate);
    shiftDate.setDate(shiftDate.getDate() + 3);
    await createCompletedShiftWithAttendance(shiftDate);
    await createPayrollRecord("PROCESSED", shiftDate, 304);

    // Change payRate
    await Shift.updateOne({ acceptedBy: guard._id }, { $set: { payRate: 45 } });

    // Expect getPayrollRecords to throw 409
    await expect(
      getPayrollRecords(
        {
          startDate: shiftDate.toISOString().slice(0, 10),
          endDate: shiftDate.toISOString().slice(0, 10),
          periodType: "weekly",
        },
        { _id: employer._id, role: "employer" },
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("already been processed"),
    });
  });

  // Test 4: Mixed status query
  test("Mixed status (PENDING + APPROVED): both change", async () => {
    // Three shifts, each at least a week apart to fall into different payroll periods
    const date1 = new Date(baseDate);
    date1.setDate(date1.getDate() + 4);
    const date2 = new Date(baseDate);
    date2.setDate(date2.getDate() + 11);

    await createCompletedShiftWithAttendance(date1);
    await createCompletedShiftWithAttendance(date2);

    // Create records with PENDING and APPROVED statuses
    await createPayrollRecord("PENDING", date1, 304);
    await createPayrollRecord("APPROVED", date2, 304);

    // Change payRate for all shifts
    await Shift.updateMany(
      { acceptedBy: guard._id },
      { $set: { payRate: 45 } },
    );

    // Date range covering all shifts
    const startRange = new Date(date1);
    startRange.setDate(startRange.getDate() - 7);
    const endRange = new Date(date2);
    endRange.setDate(endRange.getDate() + 7);

    const result = await getPayrollRecords(
      {
        startDate: startRange.toISOString().slice(0, 10),
        endDate: endRange.toISOString().slice(0, 10),
        periodType: "weekly",
      },
      { _id: employer._id, role: "employer" },
    );

    // Should have two records
    expect(result.payroll.length).toBe(2);

    const pending = result.payroll.find((p) => p.status === "PENDING");
    const approved = result.payroll.find((p) => p.status === "APPROVED");

    // Verify both records exist
    expect(pending).toBeDefined();
    expect(approved).toBeDefined();

    // Both should have changed (not 304)
    expect(pending.totalAmount).not.toBeCloseTo(304, 2);
    expect(approved.totalAmount).not.toBeCloseTo(304, 2);
  });

  // Test 5: CSV export does not trigger writes
  test("CSV export does not trigger writes (read-only mode)", async () => {
    const shiftDate = new Date(baseDate);
    shiftDate.setDate(shiftDate.getDate() + 7);
    await createCompletedShiftWithAttendance(shiftDate);
    await createPayrollRecord("PENDING", shiftDate, 304);

    const before = await Payroll.findOne({ guardId: guard._id });

    await exportPayrollCsv(
      {
        startDate: shiftDate.toISOString().slice(0, 10),
        endDate: shiftDate.toISOString().slice(0, 10),
        periodType: "weekly",
      },
      { _id: employer._id, role: "employer" },
    );

    const after = await Payroll.findOne({ guardId: guard._id });

    expect(before.totalAmount).toBe(after.totalAmount);
    // Compare ISO strings to ignore millisecond differences
    expect(before.updatedAt.toISOString()).toBe(after.updatedAt.toISOString());
  });

  // Test 6: PDF export does not trigger writes
  test("PDF export does not trigger writes (read-only mode)", async () => {
    const shiftDate = new Date(baseDate);
    shiftDate.setDate(shiftDate.getDate() + 8);
    await createCompletedShiftWithAttendance(shiftDate);
    await createPayrollRecord("PENDING", shiftDate, 304);

    const before = await Payroll.findOne({ guardId: guard._id });

    await exportPayrollPdf(
      {
        startDate: shiftDate.toISOString().slice(0, 10),
        endDate: shiftDate.toISOString().slice(0, 10),
        periodType: "weekly",
      },
      { _id: employer._id, role: "employer" },
    );

    const after = await Payroll.findOne({ guardId: guard._id });

    expect(before.totalAmount).toBe(after.totalAmount);
    expect(before.updatedAt.toISOString()).toBe(after.updatedAt.toISOString());
  });
});

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import Payroll from "../src/models/Payroll.js";
import Shift from "../src/models/Shift.js";
import ShiftAttendance from "../src/models/ShiftAttendance.js";
import { syncPayrollForShiftIds } from "../src/services/payroll.service.js";

jest.mock("../src/models/Payroll.js", () => ({
  __esModule: true,
  default: {
    bulkWrite: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock("../src/models/Shift.js", () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

jest.mock("../src/models/ShiftAttendance.js", () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

const queryResolvingTo = (value) => {
  const query = {
    populate: jest.fn(() => query),
    sort: jest.fn().mockResolvedValue(value),
  };
  return query;
};

describe("seed payroll isolation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("syncs payroll from only the explicitly scoped completed shift", async () => {
    const seededShiftId = "64b000000000000000000001";
    const unrelatedShiftId = "64b000000000000000000002";
    const guardId = "64b000000000000000000003";
    const employerId = "64b000000000000000000004";
    const shiftDate = new Date("2026-07-13T12:00:00.000Z");
    const seededShift = {
      _id: seededShiftId,
      acceptedBy: guardId,
      createdBy: employerId,
      date: shiftDate,
      startTime: "06:00",
      endTime: "14:00",
      breakTime: 30,
      field: "Corporate",
      payRate: 38,
    };

    Shift.find.mockReturnValue(queryResolvingTo([seededShift]));
    ShiftAttendance.find.mockResolvedValue([
      {
        shiftId: seededShiftId,
        guardId,
        checkInTime: new Date("2026-07-13T06:00:00.000Z"),
        checkOutTime: new Date("2026-07-13T14:00:00.000Z"),
      },
    ]);
    Payroll.bulkWrite.mockResolvedValue({});
    Payroll.find.mockReturnValue(queryResolvingTo([]));

    await syncPayrollForShiftIds({
      shiftIds: [seededShiftId],
      periodType: "weekly",
    });

    expect(Shift.find).toHaveBeenCalledWith({
      _id: { $in: [seededShiftId] },
      status: "completed",
      acceptedBy: { $ne: null },
    });
    expect(ShiftAttendance.find).toHaveBeenCalledWith({
      shiftId: { $in: [seededShiftId] },
    });

    const operations = Payroll.bulkWrite.mock.calls[0][0];
    const entries = operations[0].updateOne.update.$set.entries;
    expect(entries).toHaveLength(1);
    expect(String(entries[0].shiftId)).toBe(seededShiftId);
    expect(
      entries.some((entry) => String(entry.shiftId) === unrelatedShiftId),
    ).toBe(false);
  });
});

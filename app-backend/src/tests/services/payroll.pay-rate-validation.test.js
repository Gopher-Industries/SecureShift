import { describe, expect, test } from "@jest/globals";
import {
  buildComputedEntries,
  validateShiftPayRates,
} from "../../services/payroll.service.js";

const createShift = (overrides = {}) => ({
  _id: "shift-1",
  acceptedBy: { _id: "guard-1" },
  createdBy: { _id: "employer-1" },
  date: new Date("2026-09-15T00:00:00.000Z"),
  startTime: "09:00",
  endTime: "17:00",
  breakTime: 0,
  field: "Security",
  payRate: 40,
  ...overrides,
});

describe("payroll pay-rate validation", () => {
  test.each([
    { label: "missing", payRate: undefined },
    { label: "null", payRate: null },
    { label: "nonnumeric", payRate: "forty" },
    { label: "NaN", payRate: Number.NaN },
    { label: "infinite", payRate: Number.POSITIVE_INFINITY },
    { label: "zero", payRate: 0 },
    { label: "negative", payRate: -10 },
  ])("rejects a $label pay rate", ({ payRate }) => {
    expect(() => validateShiftPayRates([createShift({ payRate })])).toThrow(
      "Payroll cannot be generated because one or more shifts have a missing or invalid pay rate",
    );
  });

  test("identifies every affected shift", () => {
    expect.assertions(3);

    try {
      validateShiftPayRates([
        createShift({
          _id: "shift-missing",
          payRate: null,
        }),
        createShift({
          _id: "shift-zero",
          payRate: 0,
        }),
      ]);
    } catch (error) {
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe("INVALID_SHIFT_PAY_RATE");
      expect(
        error.details.affectedShifts.map((shift) => shift.shiftId),
      ).toEqual(["shift-missing", "shift-zero"]);
    }
  });

  test("allows a valid positive pay rate", () => {
    expect(() =>
      validateShiftPayRates([createShift({ payRate: 40 })]),
    ).not.toThrow();
  });

  test("generates the correct payroll amount for a valid shift", () => {
    const records = buildComputedEntries([createShift()], []);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      hourlyRate: 40,
      scheduledHours: 8,
      ordinaryHours: 8,
      overtimeHours: 0,
      totalAmount: 320,
    });
  });

  test("stops payroll calculation when a pay rate is invalid", () => {
    expect(() =>
      buildComputedEntries([createShift({ payRate: null })], []),
    ).toThrow("missing or invalid pay rate");
  });
});

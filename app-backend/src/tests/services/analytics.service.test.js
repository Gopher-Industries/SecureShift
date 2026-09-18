import { afterEach, describe, expect, jest, test } from "@jest/globals";

import Timesheet from "../../models/Timesheet.js";
import {
  calculateGini,
  calculateMean,
  calculateMedian,
  calculateTop20Share,
  getEmployerWorkforceAnalytics,
} from "../../services/analytics.service.js";

const mockTimesheetQuery = (rows) => {
  const lean = jest.fn().mockResolvedValue(rows);
  const sort = jest.fn(() => ({ lean }));
  const populate = jest.fn(() => ({ sort }));

  return {
    query: { populate },
    populate,
    sort,
    lean,
  };
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("analytics.service calculations", () => {
  test("calculates mean workload", () => {
    expect(calculateMean([10, 20, 30])).toBe(20);
  });

  test("returns zero mean for an empty dataset", () => {
    expect(calculateMean([])).toBe(0);
  });

  test("calculates median for odd and even datasets", () => {
    expect(calculateMedian([30, 10, 20])).toBe(20);
    expect(calculateMedian([10, 20, 30, 40])).toBe(25);
  });

  test("calculates top-20-percent workload share", () => {
    expect(calculateTop20Share([40, 30, 20, 10, 0])).toBe(40);
  });

  test("uses ceil for the top-20-percent guard group", () => {
    expect(calculateTop20Share([70, 70, 70, 70, 70, 70])).toBe(33.33);
  });

  test("returns zero Gini for equal workload", () => {
    expect(calculateGini([70, 70, 70, 70, 70, 70])).toBe(0);
  });

  test("detects concentrated workload using Gini", () => {
    expect(calculateGini([0, 0, 0, 10])).toBe(0.75);
  });

  test("returns zero Gini for empty and all-zero datasets", () => {
    expect(calculateGini([])).toBe(0);
    expect(calculateGini([0, 0, 0])).toBe(0);
  });
});

describe("getEmployerWorkforceAnalytics", () => {
  test("scopes the Timesheet query to the authenticated employer", async () => {
    const rows = [
      {
        _id: "timesheet-1",
        employerId: "employer-a",
        guardId: { _id: "guard-a", name: "Alpha Guard" },
        shiftDate: new Date("2026-09-12T00:00:00.000Z"),
        actualHours: 8,
      },
    ];

    const mocked = mockTimesheetQuery(rows);

    jest.spyOn(Timesheet, "find").mockReturnValue(mocked.query);

    const result = await getEmployerWorkforceAnalytics({
      employerId: "employer-a",
    });

    expect(Timesheet.find).toHaveBeenCalledWith({
      employerId: "employer-a",
    });

    expect(result.dataset.timesheetCount).toBe(1);
    expect(result.dataset.activeGuardCount).toBe(1);
    expect(result.summary.totalActualHours).toBe(8);
    expect(result.guards[0].guardId).toBe("guard-a");
  });

  test("returns a zero-valued analytical result when no records exist", async () => {
    const mocked = mockTimesheetQuery([]);

    jest.spyOn(Timesheet, "find").mockReturnValue(mocked.query);

    const result = await getEmployerWorkforceAnalytics({
      employerId: "employer-empty",
    });

    expect(result.dataset.timesheetCount).toBe(0);
    expect(result.dataset.activeGuardCount).toBe(0);
    expect(result.summary).toEqual({
      totalActualHours: 0,
      meanHoursPerGuard: 0,
      medianHoursPerGuard: 0,
      top20PercentWorkloadShare: 0,
      giniCoefficient: 0,
    });
  });

  test("rejects an invalid start date", async () => {
    await expect(
      getEmployerWorkforceAnalytics({
        employerId: "employer-a",
        startDate: "not-a-date",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid startDate",
    });
  });

  test("rejects a reversed date range", async () => {
    await expect(
      getEmployerWorkforceAnalytics({
        employerId: "employer-a",
        startDate: "2026-09-10",
        endDate: "2026-09-01",
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "startDate must be on or before endDate",
    });
  });
});

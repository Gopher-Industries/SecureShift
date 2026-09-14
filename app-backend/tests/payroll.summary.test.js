import { getPayrollSummary } from "../src/controllers/payroll.controller.js";
import * as payrollService from "../src/services/payroll.service.js";

jest.mock("../src/services/payroll.service.js", () => ({
  getPayrollRecords: jest.fn(),
  getPayrollSummaryRecords: jest.fn(),
}));

describe("Payroll Controller - getPayrollSummary", () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        periodType: "weekly",
      },
      user: { id: "guard1", role: "guard" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("should return 200 with hours, earnings and status counts", async () => {
    const mockResult = {
      filters: { startDate: "2026-01-01", endDate: "2026-01-31" },
      totalPayableHours: 50,
      totalOrdinaryHours: 40,
      totalOvertimeHours: 10,
      totalEarnings: 1500,
      statusCounts: { PENDING: 1, APPROVED: 1, PROCESSED: 0 },
    };

    payrollService.getPayrollSummaryRecords.mockResolvedValue(mockResult);

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it("should not use the payroll path that writes records", async () => {
    payrollService.getPayrollSummaryRecords.mockResolvedValue({});

    await getPayrollSummary(req, res);

    expect(payrollService.getPayrollRecords).not.toHaveBeenCalled();
  });

  it("should return 400 when the date range is invalid", async () => {
    const error = new Error("startDate cannot be after endDate");
    error.statusCode = 400;
    payrollService.getPayrollSummaryRecords.mockRejectedValue(error);

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "startDate cannot be after endDate",
    });
  });

  it("should return 403 when a guard requests another guard's payroll", async () => {
    const error = new Error("Guards can only access their own payroll");
    error.statusCode = 403;
    payrollService.getPayrollSummaryRecords.mockRejectedValue(error);

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

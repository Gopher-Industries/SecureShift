import { getPayrollSummary } from "../src/controllers/payroll.controller.js";
import * as payrollService from "../src/services/payroll.service.js";

jest.mock("../src/services/payroll.service.js", () => ({
  getPayrollRecords: jest.fn(),
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
    payrollService.getPayrollRecords.mockResolvedValue({
      filters: { startDate: "2026-01-01", endDate: "2026-01-31" },
      summary: {
        totalPayableHours: 50,
        totalOrdinaryHours: 40,
        totalOvertimeHours: 10,
        totalAmount: 1500,
      },
      payroll: [{ status: "PENDING" }, { status: "APPROVED" }],
    });

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      filters: { startDate: "2026-01-01", endDate: "2026-01-31" },
      totalPayableHours: 50,
      totalOrdinaryHours: 40,
      totalOvertimeHours: 10,
      totalEarnings: 1500,
      statusCounts: { PENDING: 1, APPROVED: 1, PROCESSED: 0 },
    });
  });

  it("should return 400 when the date range is invalid", async () => {
    const error = new Error("startDate cannot be after endDate");
    error.statusCode = 400;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "startDate cannot be after endDate",
    });
  });

  it("should return 403 when a guard requests another guard's payroll", async () => {
    const error = new Error("Guards can only access their own payroll");
    error.statusCode = 403;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

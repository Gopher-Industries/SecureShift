import { getPayroll } from "../src/controllers/payroll.controller.js";
import * as payrollService from "../src/services/payroll.service.js";

jest.mock("../src/services/payroll.service.js", () => ({
  getPayrollRecords: jest.fn(),
}));

describe("Payroll Controller - getPayrollSummary", () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      user: { id: "user1", role: "employer" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // ---------------- SUCCESS CASE ----------------
  it("should return 200 with payroll summary", async () => {
    const mockResult = { totalPay: 1000 };

    payrollService.getPayrollRecords.mockResolvedValue(mockResult);

    await getPayroll(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  // ---------------- 400 ERROR CASES ----------------
  it("should return 400 for invalid periodType error", async () => {
    const error = new Error("Invalid periodType provided");
    error.statusCode = 400;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayroll(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid periodType provided",
    });
  });

  it("should return 400 for invalid ISO error", async () => {
    const error = new Error("Invalid ISO format");
    error.statusCode = 400;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayroll(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ---------------- 403 ERROR CASES ----------------
  it("should return 403 for forbidden access", async () => {
    const error = new Error("Forbidden: access denied");
    error.statusCode = 403;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayroll(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return 403 for unsupported role", async () => {
    const error = new Error("unsupported role");
    error.statusCode = 403;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayroll(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // ---------------- 401 ERROR CASE ----------------
  it("should return 401 for unauthorised error", async () => {
    const error = new Error("Unauthorised access");
    error.statusCode = 401;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayroll(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ---------------- 500 FALLBACK ----------------
  it("should return 500 for unknown error", async () => {
    const error = new Error("Database crashed");
    error.statusCode = 500;
    payrollService.getPayrollRecords.mockRejectedValue(error);

    await getPayroll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Database crashed" });
  });
});

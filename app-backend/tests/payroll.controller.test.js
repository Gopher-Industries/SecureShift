import { getPayrollSummary } from "../src/controllers/payroll.controller.js";
import { buildPayrollSummary } from "../src/services/payroll.service.js";

jest.mock("../src/services/payroll.service.js");

describe("Payroll Controller - getPayrollSummary", () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      user: { id: "user1", role: "employer" }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  // ---------------- SUCCESS CASE ----------------
  it("should return 200 with payroll summary", async () => {
    const mockResult = { totalPay: 1000 };

    buildPayrollSummary.mockResolvedValue(mockResult);

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  // ---------------- 400 ERROR CASES ----------------
  it("should return 400 for invalid periodType error", async () => {
    buildPayrollSummary.mockRejectedValue(
      new Error("Invalid periodType provided")
    );

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid periodType provided"
    });
  });

  it("should return 400 for invalid ISO error", async () => {
    buildPayrollSummary.mockRejectedValue(
      new Error("Invalid ISO format")
    );

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ---------------- 403 ERROR CASES ----------------
  it("should return 403 for forbidden access", async () => {
    buildPayrollSummary.mockRejectedValue(
      new Error("Forbidden: access denied")
    );

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return 403 for unsupported role", async () => {
    buildPayrollSummary.mockRejectedValue(
      new Error("unsupported role")
    );

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  // ---------------- 401 ERROR CASE ----------------
  it("should return 401 for unauthorised error", async () => {
    buildPayrollSummary.mockRejectedValue(
      new Error("Unauthorised access")
    );

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // ---------------- 500 FALLBACK ----------------
  it("should return 500 for unknown error", async () => {
    buildPayrollSummary.mockRejectedValue(
      new Error("Database crashed")
    );

    await getPayrollSummary(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Failed to retrieve payroll summary"
      })
    );
  });
});
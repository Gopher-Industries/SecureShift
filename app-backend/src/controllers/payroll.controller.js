import { buildPayrollSummary } from "../services/payroll.service.js";

export const getPayrollSummary = async (req, res) => {
  try {
    const result = await buildPayrollSummary(req.query, req.user);
    return res.status(200).json(result);
  } catch (error) {
    if (
      error.message.includes("required") ||
      error.message.includes("periodType") ||
      error.message.includes("ISO") ||
      error.message.includes("Invalid startDate") ||
      error.message.includes("after")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (
      error.message.includes("Forbidden") ||
      error.message.includes("only access their own") ||
      error.message.includes("unsupported role")
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    if (error.message.includes("Unauthorised")) {
      return res.status(401).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to retrieve payroll summary",
      error: error.message,
    });
  }
};
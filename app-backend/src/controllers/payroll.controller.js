import { buildPayrollSummary } from "../services/payroll.service.js";

export const getPayrollSummary = async (req, res) => {
  try {
    const result = await buildPayrollSummary(req.query, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
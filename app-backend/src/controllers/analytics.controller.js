import { getEmployerWorkforceAnalytics } from "../services/analytics.service.js";

export const getWorkforceAnalytics = async (req, res) => {
  try {
    const employerId = req.user?._id || req.user?.id;

    const analytics = await getEmployerWorkforceAnalytics({
      employerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to retrieve workforce analytics",
    });
  }
};

import Shift from "../models/Shift.js";

export const getDashboardStats = async (req, res) => {
  try {
    const employerId = req.user._id;

    const [total, assigned, completed, cancelled] = await Promise.all([
      Shift.countDocuments({ createdBy: employerId }),
      Shift.countDocuments({ createdBy: employerId, status: "assigned" }),
      Shift.countDocuments({ createdBy: employerId, status: "completed" }),
      Shift.countDocuments({ createdBy: employerId, status: "cancelled" }),
    ]);

    const recentShifts = await Shift.find({ createdBy: employerId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title status date updatedAt");

    const reviewSummary = await Shift.aggregate([
      { $match: { createdBy: employerId, ratedByGuard: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$guardRating" },
          totalRated: { $sum: 1 },
        },
      },
    ]);

    res.json({
      stats: {
        total,
        assigned,
        completed,
        cancelled,
      },
      recentShifts,
      reviews: reviewSummary[0] || { averageRating: 0, totalRated: 0 },
    });
  } catch (err) {
    res.status(500).json({ message: "Dashboard error", error: err.message });
  }
};

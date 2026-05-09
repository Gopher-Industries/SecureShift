import {
  checkInForShift,
  checkOutForShift,
  getAttendanceHistoryForUser,
} from "../services/attendance.service.js";

// POST /api/v1/attendance/checkin/:shiftId
export const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { shiftId } = req.params;
    const guardId = req.user.id;

    // ✅ Save attendance
    const attendance = await checkInForShift({
      guardId,
      shiftId,
      latitude,
      longitude,
    });

    return res.status(201).json({
      message: "Check-in recorded",
      attendance,
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

// POST /api/v1/attendance/checkout/:shiftId
export const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { shiftId } = req.params;
    const guardId = req.user.id;

    const attendance = await checkOutForShift({
      shiftId,
      guardId,
      latitude,
      longitude,
    });
    return res.status(200).json({
      message: "Check-out recorded",
      attendance,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};
// GET /api/v1/attendance/:userId
export const getAttendanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const attendanceRecords = await getAttendanceHistoryForUser(userId);

    return res.status(200).json({
      message: "Attendance history retrieved successfully",
      count: attendanceRecords.length,
      attendance: attendanceRecords,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

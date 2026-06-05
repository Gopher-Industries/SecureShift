import ShiftAttendance from "../models/ShiftAttendance.js";
import Shift from "../models/Shift.js";

// Utility: calculate distance using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

// POST /api/v1/attendance/checkin/:shiftId
export const checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { shiftId } = req.params;
    const guardId = req.user?._id || req.user?.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Invalid location coordinates" });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ message: "Invalid location coordinates" });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const siteLatitude = shift.location?.latitude;
    const siteLongitude = shift.location?.longitude;

    if (!Number.isFinite(siteLatitude) || !Number.isFinite(siteLongitude)) {
      return res.status(400).json({ message: "Shift location not configured" });
    }

    if (String(shift.assignedGuard) !== String(guardId)) {
      return res.status(403).json({ message: "Not assigned to this shift" });
    }

    const existing = await ShiftAttendance.findOne({ guard: guardId, shift: shiftId });
    if (existing) {
      return res.status(400).json({ message: "Already checked in" });
    }

    const distance = calculateDistance(latNum, lngNum, siteLatitude, siteLongitude);
    if (distance > 0.1) {
      return res.status(400).json({ message: "Not within shift radius (100m)" });
    }

    const [startHour, startMinute] = String(shift.startTime).split(":").map(Number);
    const [endHour, endMinute] = String(shift.endTime).split(":").map(Number);

    const scheduledStart = new Date(shift.date);
    scheduledStart.setHours(startHour, startMinute, 0, 0);

    const scheduledEnd = new Date(shift.date);
    scheduledEnd.setHours(endHour, endMinute, 0, 0);

    if (scheduledEnd <= scheduledStart) {
      scheduledEnd.setDate(scheduledEnd.getDate() + 1);
    }

    const attendance = new ShiftAttendance({
      shift: shiftId,
      guard: guardId,
      clockIn: new Date(),
      scheduledStart,
      scheduledEnd,
      recordedBy: guardId,
    });

    await attendance.save();

    return res.status(201).json({
      message: "Check-in recorded",
      attendance,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/v1/attendance/checkout/:shiftId
export const checkOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const { shiftId } = req.params;
    const guardId = req.user?._id || req.user?.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Invalid location coordinates" });
    }

    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res.status(400).json({ message: "Invalid location coordinates" });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    if (String(shift.assignedGuard) !== String(guardId)) {
      return res.status(403).json({ message: "Not assigned to this shift" });
    }

    const attendance = await ShiftAttendance.findOne({ 
      guardId: guardId, 
      shiftId: shiftId 
    });

    if (!attendance) {
      return res.status(404).json({ message: "No check-in record found" });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: "Already checked out" });
    }

    attendance.checkOutTime = new Date();

    await attendance.save();

    // AUTO TIMESHEET GENERATION 
    // When a guard checks out, we automatically:
    // 1. Calculate hours worked
    // 2. Create a new Timesheet record
    // 3. Save it to the database
    const checkInTime = new Date(attendance.checkInTime);
    const checkOutTime = new Date(attendance.checkOutTime);
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60); // in hours

    const Timesheet = (await import("../models/Timesheet.js")).default;

    const timesheet = new Timesheet({
      guardId,
      shiftId,
      date: checkInTime,                    // Store full date
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      hoursWorked: parseFloat(hoursWorked.toFixed(2)),
    });

    await timesheet.save();


    return res.status(200).json({ 
      message: "Check-out recorded successfully", 
      attendance,
      timesheet: {
        id: timesheet._id,
        hoursWorked: timesheet.hoursWorked
      }
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/v1/timesheets
export const getTimesheets = async (req, res) => {
  try {
    const { guardId, startDate, endDate } = req.query;
    const Timesheet = (await import("../models/Timesheet.js")).default;

    let filter = {};

    if (guardId) {
      filter.guardId = guardId;
    }
    if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.date = filter.date || {};
      filter.date.$lte = new Date(endDate);
    }

    const timesheets = await Timesheet.find(filter)
      .populate('guardId', 'name email')   // Optional: show guard info
      .populate('shiftId', 'date startTime endTime')
      .sort({ date: -1 });

    res.status(200).json({
      message: "Timesheets retrieved successfully",
      count: timesheets.length,
      timesheets
    });
  } catch (error) {
    console.error("Get Timesheets Error:", error);
    res.status(500).json({ message: error.message });
  }
};
// export const checkOut = async (req, res) => {
//   try {
//     const { latitude, longitude } = req.body;
//     const { shiftId } = req.params;
//     const guardId = req.user?._id || req.user?.id;

//     if (latitude === undefined || longitude === undefined) {
//       return res.status(400).json({ message: "Invalid location coordinates" });
//     }

//     const latNum = Number(latitude);
//     const lngNum = Number(longitude);

//     if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
//       return res.status(400).json({ message: "Invalid location coordinates" });
//     }

//     const shift = await Shift.findById(shiftId);
//     if (!shift) {
//       return res.status(404).json({ message: "Shift not found" });
//     }

//     if (String(shift.assignedGuard) !== String(guardId)) {
//       return res.status(403).json({ message: "Not assigned to this shift" });
//     }

//     const attendance = await ShiftAttendance.findOne({ guard: guardId, shift: shiftId });
//     if (!attendance) {
//       return res.status(404).json({ message: "No check-in record found" });
//     }

//     if (attendance.clockOut) {
//       return res.status(400).json({ message: "Already checked out" });
//     }

//     attendance.clockOut = new Date();
//     attendance.recordedBy = guardId;

//     await attendance.save();

//     return res.status(200).json({ message: "Check-out recorded", attendance });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };
// // GET /api/v1/attendance/:userId
export const getAttendanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const attendanceRecords = await ShiftAttendance.find({ guard: userId })
      .sort({ clockIn: -1 });

    if (!attendanceRecords.length) {
      return res.status(404).json({
        message: "No attendance records found for this user",
      });
    }

    res.status(200).json({
      message: "Attendance history retrieved successfully",
      count: attendanceRecords.length,
      attendance: attendanceRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

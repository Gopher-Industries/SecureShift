import ShiftAttendance from "../models/ShiftAttendance.js";

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
    const guardId = req.user.id;

    // ✅ Validate inputs
    if (
      latitude === undefined ||
      longitude === undefined ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return res.status(400).json({ message: "Invalid location coordinates" });
    }

    // ✅ Validate shift
    const shift = await Shift.findById(shiftId).populate("siteId");
    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    // ✅ Check guard is assigned
    if (String(shift.assignedGuard) !== String(guardId)) {
      return res.status(403).json({ message: "Not assigned to this shift" });
    }

    // ✅ Prevent duplicate check-in
    const existing = await ShiftAttendance.findOne({ guardId, shiftId });
    if (existing) {
      return res.status(400).json({ message: "Already checked in" });
    }

    // ✅ Get real site location
    const siteLocation = shift.siteId?.location;
    if (!siteLocation?.latitude || !siteLocation?.longitude) {
      return res.status(400).json({ message: "Site location not configured" });
    }

    const distance = calculateDistance(
      latitude,
      longitude,
      siteLocation.latitude,
      siteLocation.longitude
    );

    // ✅ Radius check (100m)
    if (distance > 0.1) {
      return res.status(400).json({
        message: "Not within shift radius (100m)",
      });
    }

    // ✅ Save attendance
    const attendance = new ShiftAttendance({
      guardId,
      shiftId,
      checkInTime: new Date(),
      siteLocation: {
        type: "Point",
        coordinates: [siteLocation.longitude, siteLocation.latitude],
      },
      checkInLocation: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      locationVerified: true,
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
    console.log("Incoming check-in request:", req.params, req.body);

    const { latitude, longitude } = req.body;
    const { shiftId } = req.params;
    const guardId = req.user.id;

    const attendance = await ShiftAttendance.findOne({ guardId, shiftId });
    if (!attendance)
      return res.status(404).json({ message: "No check-in record found" });

    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = { type: "Point", coordinates: [longitude, latitude] };
    await attendance.save();

    res.status(200).json({ message: "Check-out recorded", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET /api/v1/attendance/:userId
export const getAttendanceByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const attendanceRecords = await ShiftAttendance.find({ guardId: userId })
      .sort({ checkInTime: -1 });

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
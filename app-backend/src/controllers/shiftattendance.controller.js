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
    const guardId = req.user.id; // from JWT

    const siteLocation = [145.1140, -37.8496]; // placeholder until integrated with Shift model
    const distance = calculateDistance(latitude, longitude, siteLocation[1], siteLocation[0]);

    if (distance > 0.1)
      return res.status(400).json({ message: "Not within shift radius (100m)" });

    const attendance = new ShiftAttendance({
      guardId,
      shiftId,
      siteLocation: { type: "Point", coordinates: siteLocation },
      checkInTime: new Date(),
      checkInLocation: { type: "Point", coordinates: [longitude, latitude] },
      locationVerified: true,
    });

    await attendance.save();
    res.status(201).json({ message: "Check-in recorded", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/v1/attendance/checkout/:shiftId
export const checkOut = async (req, res) => {
  try {
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

import Shift from "../models/Shift.js";
import ShiftAttendance from "../models/ShiftAttendance.js";

const DEFAULT_ATTENDANCE_RADIUS_KM = 0.1; // 100 meters

const createServiceError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const calculateDistance = (from, to) => {
  const earthRadiusKm = 6371;

  const fromLatitudeRadians = (from.latitude * Math.PI) / 180;
  const toLatitudeRadians = (to.latitude * Math.PI) / 180;
  const latitudeDifferenceRadians =
    ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDifferenceRadians =
    ((to.longitude - from.longitude) * Math.PI) / 180;

  const haversineValue =
    Math.sin(latitudeDifferenceRadians / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDifferenceRadians / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return earthRadiusKm * centralAngle;
};

export const validateAttendanceCoordinates = (latitude, longitude) => {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    Number.isNaN(parsedLatitude) ||
    Number.isNaN(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    throw createServiceError("Invalid location coordinates", 400);
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
};

const getShiftAttendanceLocation = (shift) => {
  const latitude = shift.location?.latitude;
  const longitude = shift.location?.longitude;

  if (latitude === undefined || longitude === undefined) {
    throw createServiceError("Shift location not configured", 400);
  }

  return {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };
};

export const getAssignedShiftForAttendance = async (shiftId, guardId) => {
  const shift = await Shift.findById(shiftId);

  if (!shift) {
    throw createServiceError("Shift not found", 404);
  }

  if (String(shift.assignedGuard) !== String(guardId)) {
    throw createServiceError("Not assigned to this shift", 403);
  }

  return shift;
};

export const verifyWithinSiteRadius = ({
  guardLocation,
  siteLocation,
  radiusKm = DEFAULT_ATTENDANCE_RADIUS_KM,
}) => {
  const distanceKm = calculateDistance(guardLocation, siteLocation);

  if (distanceKm > radiusKm) {
    throw createServiceError("Not within shift radius (100m)", 400);
  }

  return {
    withinRadius: true,
    distanceKm,
  };
};

export const checkInForShift = async ({
  guardId,
  shiftId,
  latitude,
  longitude,
  now = new Date(),
}) => {
  const guardLocation = validateAttendanceCoordinates(latitude, longitude);
  const shift = await getAssignedShiftForAttendance(shiftId, guardId);

  const existingAttendance = await ShiftAttendance.findOne({
    guardId,
    shiftId,
  });

  if (existingAttendance) {
    throw createServiceError("Already checked in", 400);
  }

  const siteLocation = getShiftAttendanceLocation(shift);

  verifyWithinSiteRadius({
    guardLocation,
    siteLocation,
  });

  const attendance = new ShiftAttendance({
    guardId,
    shiftId,
    checkInTime: now,
    siteLocation: {
      type: "Point",
      coordinates: [siteLocation.longitude, siteLocation.latitude],
    },
    checkInLocation: {
      type: "Point",
      coordinates: [guardLocation.longitude, guardLocation.latitude],
    },
    locationVerified: true,
  });

  await attendance.save();

  return attendance;
};

export const checkOutForShift = async ({
  shiftId,
  guardId,
  latitude,
  longitude,
  now = new Date(),
}) => {
  const guardLocation = validateAttendanceCoordinates(latitude, longitude);

  const attendance = await ShiftAttendance.findOne({
    guardId,
    shiftId,
  });

  if (!attendance) {
    throw createServiceError("No check-in record found", 404);
  }

  attendance.checkOutTime = now;
  attendance.checkOutLocation = {
    type: "Point",
    coordinates: [guardLocation.longitude, guardLocation.latitude],
  };

  await attendance.save();

  return attendance;
};

export const getAttendanceHistoryForUser = async (userId) => {
  const attendanceRecords = await ShiftAttendance.find({ guardId: userId }).sort({
    checkInTime: -1,
  });

  if (!attendanceRecords.length) {
    throw createServiceError("No attendance records found for this user", 404);
  }

  return attendanceRecords;
};

export const buildAttendancePayrollFacts = (attendance, shift) => ({
  shiftId: shift._id,
  guardId: attendance.guardId,
  scheduledDate: shift.date,
  scheduledStartTime: shift.startTime,
  scheduledEndTime: shift.endTime,
  payRate: shift.payRate,
  checkInTime: attendance.checkInTime,
  checkOutTime: attendance.checkOutTime,
  locationVerified: attendance.locationVerified,
});
import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import Guard from "../models/Guard.js";
import Availability from "../models/Availability.js";
import User from "../models/User.js";
import { timeToMinutes, normalizeEnd } from "../utils/timeUtils.js";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getWeekdayName = (date) => {
  return WEEKDAY_NAMES[new Date(date).getDay()];
};

const shiftFitsTimeSlot = (startTime, endTime, slot) => {
  if (typeof slot !== "string" || !slot.includes("-")) return false;

  const [slotStart, slotEnd] = slot.split("-");

  const shiftStart = timeToMinutes(startTime);
  const shiftEnd = normalizeEnd(startTime, endTime);

  const slotStartMinutes = timeToMinutes(slotStart);
  const slotEndMinutes = normalizeEnd(slotStart, slotEnd);

  return shiftStart >= slotStartMinutes && shiftEnd <= slotEndMinutes;
};

const getShiftDateRange = (date, startTime, endTime) => {
  const start = new Date(date);
  const [startHour, startMinute] = String(startTime).split(":").map(Number);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(date);
  const [endHour, endMinute] = String(endTime).split(":").map(Number);
  end.setHours(endHour, endMinute, 0, 0);

  if (end <= start) end.setDate(end.getDate() + 1);

  return { start, end };
};

const rangesOverlap = (rangeA, rangeB) => {
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
};

const getSuitabilityLevel = (score) => {
  if (score >= 80) return "VERY_HIGH";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score > 0) return "LOW";
  return "VERY_LOW";
};

export const getShiftMatches = async (req, res) => {
  try {
    const { shiftId } = req.params;

    if (!mongoose.isValidObjectId(shiftId)) {
      return res.status(400).json({ message: "Invalid shiftId" });
    }

    const requesterId = req.user?._id || req.user?.id;

    const shift = await Shift.findById(shiftId).lean();

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const isOwner = String(shift.createdBy) === String(requesterId);
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Only the shift owner or admin can view shift matches",
      });
    }

    const employer = await User.findById(requesterId)
      .select("favourites")
      .lean();

    const favouriteIds = (employer?.favourites || []).map((id) =>
      String(id)
    );

    const guards = await Guard.find({
      role: "guard",
      isDeleted: { $ne: true },
    })
      .select("name email role address license rating numberOfReviews")
      .lean();

    const guardIds = guards.map((guard) => guard._id);

    const availabilities = await Availability.find({
      user: { $in: guardIds },
    }).lean();

    const shiftDay = getWeekdayName(shift.date);
    const shiftRange = getShiftDateRange(
      shift.date,
      shift.startTime,
      shift.endTime
    );

    const existingShifts = await Shift.find({
      _id: { $ne: shift._id },
      status: { $in: ["applied", "assigned"] },
      $or: [
        { acceptedBy: { $in: guardIds } },
        { applicants: { $in: guardIds } },
        { guardIds: { $in: guardIds } },
      ],
    })
      .select(
        "_id title date startTime endTime acceptedBy applicants guardIds status"
      )
      .lean();

    const matches = guards.map((guard) => {
      let score = 0;
      const reasons = [];

      const availability = availabilities.find(
        (item) => String(item.user) === String(guard._id)
      );

      const hasAvailabilityDay =
        availability?.days?.includes(shiftDay) || false;

      const hasAvailabilityTime =
        availability?.timeSlots?.some((slot) =>
          shiftFitsTimeSlot(shift.startTime, shift.endTime, slot)
        ) || false;

      if (
        availability?.status === "AVAILABLE" &&
        hasAvailabilityDay &&
        hasAvailabilityTime
      ) {
        score += 40;
        reasons.push("Available for the shift day and time");
      } else if (hasAvailabilityDay && hasAvailabilityTime) {
        score += 25;
        reasons.push("Availability matches, but live status is not AVAILABLE");
      } else {
        reasons.push("Availability does not fully match");
      }

      const hasConflict = existingShifts.some((existingShift) => {
        const belongsToGuard =
          String(existingShift.acceptedBy) === String(guard._id) ||
          (existingShift.applicants || []).some(
            (id) => String(id) === String(guard._id)
          ) ||
          (existingShift.guardIds || []).some(
            (id) => String(id) === String(guard._id)
          );

        if (!belongsToGuard) return false;

        const existingRange = getShiftDateRange(
          existingShift.date,
          existingShift.startTime,
          existingShift.endTime
        );

        return rangesOverlap(shiftRange, existingRange);
      });

      if (!hasConflict) {
        score += 25;
        reasons.push("No conflicting shift found");
      } else {
        score -= 30;
        reasons.push("Guard has a conflicting shift");
      }

      if (guard.license?.status === "verified") {
        score += 15;
        reasons.push("Verified licence");
      } else {
        reasons.push("Licence is not verified");
      }

      if (typeof guard.rating === "number" && guard.rating > 0) {
        const ratingScore = Math.min(10, guard.rating * 2);
        score += ratingScore;
        reasons.push(`Rating considered (${guard.rating}/5)`);
      }

      if (favouriteIds.includes(String(guard._id))) {
        score += 10;
        reasons.push("Employer favourite guard");
      }

      if (
        shift.location?.suburb &&
        guard.address?.suburb &&
        shift.location.suburb.toLowerCase() ===
          guard.address.suburb.toLowerCase()
      ) {
        score += 5;
        reasons.push("Same suburb as shift location");
      }

      const finalScore = Math.max(0, Math.round(score));
      const suitability = getSuitabilityLevel(finalScore);

      return {
        guardId: guard._id,
        name: guard.name,
        email: guard.email,
        rating: guard.rating || 0,
        numberOfReviews: guard.numberOfReviews || 0,
        licenseStatus: guard.license?.status || "none",
        availabilityStatus: availability?.status || "NOT_SET",
        score: finalScore,
        suitability,
        reasons,
      };
    });

    matches.sort((a, b) => b.score - a.score);

    return res.status(200).json({
      shiftId: shift._id,
      shiftTitle: shift.title,
      shiftStatus: shift.status,
      totalGuardsChecked: guards.length,
      totalMatches: matches.length,
      matches,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate shift matches",
      error: error.message,
    });
  }
};
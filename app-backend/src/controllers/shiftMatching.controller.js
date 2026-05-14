import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import Guard from "../models/Guard.js";
import Availability from "../models/Availability.js";
import User from "../models/User.js";
import { timeToMinutes, normalizeEnd } from "../utils/timeUtils.js";
import GuardPreference from "../models/GuardPreference.js";
import ShiftInvitation from "../models/ShiftInvitation.js";

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

export const createOrUpdateGuardPreference = async (req, res) => {
  try {
    if (req.user.role !== "guard") {
      return res.status(403).json({ message: "Only guards can set preferences" });
    }

    const guardId = req.user._id || req.user.id;

    const {
      preferredShiftTypes = [],
      preferredFields = [],
      preferredSuburbs = [],
      minimumPayRate = 0,
      acceptsUrgentShifts = false,
    } = req.body;

    const preference = await GuardPreference.findOneAndUpdate(
      { guardId },
      {
        guardId,
        preferredShiftTypes,
        preferredFields,
        preferredSuburbs,
        minimumPayRate,
        acceptsUrgentShifts,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Guard preferences saved",
      preference,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save guard preferences",
      error: error.message,
    });
  }
};

export const getMyGuardPreference = async (req, res) => {
  try {
    if (req.user.role !== "guard") {
      return res.status(403).json({ message: "Only guards can view preferences" });
    }

    const guardId = req.user._id || req.user.id;

    const preference = await GuardPreference.findOne({ guardId });

    return res.status(200).json({
      preference,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch guard preferences",
      error: error.message,
    });
  }
};

export const inviteGuardToShift = async (req, res) => {
  try {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only employers/admins can invite guards" });
    }

    const { shiftId, guardId } = req.params;
    const { message } = req.body;

    if (!mongoose.isValidObjectId(shiftId) || !mongoose.isValidObjectId(guardId)) {
      return res.status(400).json({ message: "Invalid shiftId or guardId" });
    }

    const employerId = req.user._id || req.user.id;

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({ message: "Shift not found" });
    }

    const isOwner = String(shift.createdBy) === String(employerId);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to invite for this shift" });
    }

    const guard = await Guard.findById(guardId);

    if (!guard || guard.isDeleted) {
      return res.status(404).json({ message: "Guard not found" });
    }

    const invitation = await ShiftInvitation.findOneAndUpdate(
      { shiftId, guardId },
      {
        shiftId,
        guardId,
        employerId,
        message,
        status: "PENDING",
        respondedAt: null,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(201).json({
      message: "Invitation sent",
      invitation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Invitation already exists" });
    }

    return res.status(500).json({
      message: "Failed to invite guard",
      error: error.message,
    });
  }
};

export const getMyShiftInvitations = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    let query = {};

    if (req.user.role === "guard") {
      query.guardId = userId;
    } else if (req.user.role === "employer") {
      query.employerId = userId;
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed to view invitations" });
    }

    const invitations = await ShiftInvitation.find(query)
      .populate("shiftId", "title date startTime endTime status location urgency payRate")
      .populate("guardId", "name email role")
      .populate("employerId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: invitations.length,
      invitations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch invitations",
      error: error.message,
    });
  }
};

export const respondToShiftInvitation = async (req, res) => {
  try {
    if (req.user.role !== "guard") {
      return res.status(403).json({ message: "Only guards can respond to invitations" });
    }

    const { invitationId } = req.params;
    const { status } = req.body;

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return res.status(400).json({ message: "status must be ACCEPTED or DECLINED" });
    }

    if (!mongoose.isValidObjectId(invitationId)) {
      return res.status(400).json({ message: "Invalid invitationId" });
    }

    const guardId = req.user._id || req.user.id;

    const invitation = await ShiftInvitation.findById(invitationId);

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (String(invitation.guardId) !== String(guardId)) {
      return res.status(403).json({ message: "Not allowed to respond to this invitation" });
    }

    if (invitation.status !== "PENDING") {
      return res.status(400).json({ message: `Invitation already ${invitation.status}` });
    }

    invitation.status = status;
    invitation.respondedAt = new Date();

    await invitation.save();

    return res.status(200).json({
      message: `Invitation ${status.toLowerCase()}`,
      invitation,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to respond to invitation",
      error: error.message,
    });
  }
};
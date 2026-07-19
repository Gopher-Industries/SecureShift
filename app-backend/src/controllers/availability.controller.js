import { ACTIONS } from "../middleware/logger.js";
import Availability from "../models/Availability.js";
import mongoose from "mongoose";

/**
 * controllers/availability.controller.js
 *
 * Features:
 * - Create/update availability
 * - Real-time status support
 * - Admin override support
 * - Validation improvements
 */

const timeSlotRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

const VALID_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const VALID_STATUSES = ["AVAILABLE", "BUSY", "OFF_DUTY"];

/**
 * Utility
 */
const toMinutes = (hhmm) => {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
};

/**
 * POST /api/v1/availability
 *
 * Create or update user availability
 */
export const createOrUpdateAvailability = async (req, res) => {
  try {
    const requester = req.user;

    if (!requester || !requester.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const bodyUserId = req.body.user;

    let targetUserId = requester.id;

    /**
     * Admin override
     */
    if (bodyUserId) {
      if (!mongoose.Types.ObjectId.isValid(bodyUserId)) {
        return res.status(400).json({
          message: "Invalid user id provided.",
        });
      }

      if (requester.role === "admin") {
        targetUserId = bodyUserId;
      } else if (bodyUserId !== requester.id) {
        return res.status(403).json({
          message: "Forbidden: you can only update your own availability.",
        });
      }
    }

    const { days, timeSlots, status } = req.body;

    /**
     * Validate days
     */
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({
        message: "Please select at least one day.",
      });
    }

    const invalidDays = days.filter((day) => !VALID_DAYS.includes(day));

    if (invalidDays.length > 0) {
      return res.status(400).json({
        message: `Invalid day(s): ${invalidDays.join(", ")}`,
      });
    }

    /**
     * Validate time slots
     */
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        message: "Please provide at least one time slot.",
      });
    }

    for (const ts of timeSlots) {
      if (typeof ts !== "string" || !timeSlotRegex.test(ts)) {
        return res.status(400).json({
          message: `Invalid time slot format: "${ts}". Use HH:MM-HH:MM.`,
        });
      }

      const [start, end] = ts.split("-");

      if (toMinutes(start) >= toMinutes(end)) {
        return res.status(400).json({
          message: `Invalid time slot "${ts}": start time must be before end time.`,
        });
      }
    }

    /**
     * Validate status
     */
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
      });
    }

    /**
     * Upsert availability
     */
    const filter = {
      user: targetUserId,
    };

    const update = {
      user: targetUserId,
      days,
      timeSlots,
    };

    /**
     * Only set status if provided
     */
    if (status) {
      update.status = status;
      update.lastStatusUpdatedAt = Date.now();
    }

    const options = {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    };

    const availability = await Availability.findOneAndUpdate(
      filter,
      update,
      options,
    ).populate("user", "name email role");

    /**
     * Audit log
     */
    if (req.audit?.log) {
      await req.audit.log(requester.id, ACTIONS.AVAILABILITY_UPDATED, {
        availabilityId: availability._id,
        targetUserId,
        days,
        timeSlots,
        status: availability.status,
      });
    }

    return res.status(200).json({
      message: "Availability saved successfully.",
      availability,
    });
  } catch (err) {
    console.error("Availability POST error:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Availability already exists for this user.",
      });
    }

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/**
 * GET /api/v1/availability/:userId
 *
 * Fetch user availability
 */
export const getAvailability = async (req, res) => {
  try {
    const requester = req.user;

    const { userId } = req.params;

    if (!requester || !requester.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user id.",
      });
    }

    /**
     * Access control
     */
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({
        message: "Forbidden: cannot access other user availability.",
      });
    }

    const availability = await Availability.findOne({
      user: userId,
    }).populate("user", "name email role");

    if (!availability) {
      return res.status(404).json({
        message: "Availability not found for this user.",
      });
    }

    return res.status(200).json({
      availability,
    });
  } catch (err) {
    console.error("Availability GET error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/**
 * PATCH /api/v1/availability/status
 *
 * Update live operational status only
 */
export const updateAvailabilityStatus = async (req, res) => {
  try {
    const requester = req.user;

    if (!requester || !requester.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const availability = await Availability.findOneAndUpdate(
      {
        user: requester.id,
      },
      {
        status,
        lastStatusUpdatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("user", "name email role");

    if (!availability) {
      return res.status(404).json({
        message: "Availability record not found.",
      });
    }

    /**
     * Audit log
     */
    if (req.audit?.log) {
      await req.audit.log(requester.id, ACTIONS.AVAILABILITY_UPDATED, {
        availabilityId: availability._id,
        status,
      });
    }

    return res.status(200).json({
      message: "Availability status updated successfully.",
      availability,
    });
  } catch (err) {
    console.error("Availability STATUS PATCH error:", err);

    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

/**
 * services/availabilitySlot.service.js
 *
 * Business logic for calendar-based availability slots (Ticket #20).
 *
 * Design rules (confirmed with Krisha Patel, Guard App Lead):
 * - Every operation is scoped to ONE guard. The caller passes `guardId`, which
 *   the controller always derives from the authenticated user (req.user)
 *   and never from the request body, so a guard can only touch their own slots.
 * - Validation errors throw an Error with `status: 400`; ownership misses on a
 *   single slot throw `status: 404`. The controller maps `.status` to the HTTP
 *   response (falling back to 500).
 */

import mongoose from "mongoose";
import AvailabilitySlot, {
  ISO_DATE_REGEX,
  TIME_REGEX,
  RECURRING_PATTERNS,
} from "../models/AvailabilitySlot.js";

/**
 * Build an Error that carries an HTTP status for the controller to surface.
 * @param {number} status
 * @param {string} message
 */
const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const toMinutes = (hhmm) => {
  const [hh, mm] = hhmm.split(":").map(Number);
  return hh * 60 + mm;
};

/**
 * Validate and normalise the create-slot payload.
 * Returns the clean fields to persist; throws a 400 on any bad input.
 */
const validateSlotInput = (body = {}) => {
  const { date, fromTime, toTime, recurring } = body;

  if (typeof date !== "string" || !ISO_DATE_REGEX.test(date)) {
    throw httpError(400, 'date is required in "YYYY-MM-DD" format.');
  }

  // Reject impossible calendar dates that still match the regex (e.g. 2025-13-40).
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw httpError(400, `date "${date}" is not a valid calendar date.`);
  }

  if (typeof fromTime !== "string" || !TIME_REGEX.test(fromTime)) {
    throw httpError(400, 'fromTime is required in "HH:MM" 24-hour format.');
  }

  if (typeof toTime !== "string" || !TIME_REGEX.test(toTime)) {
    throw httpError(400, 'toTime is required in "HH:MM" 24-hour format.');
  }

  if (toMinutes(fromTime) >= toMinutes(toTime)) {
    throw httpError(400, "fromTime must be earlier than toTime.");
  }

  const clean = { date, fromTime, toTime };

  if (recurring !== undefined && recurring !== null) {
    if (typeof recurring !== "object" || Array.isArray(recurring)) {
      throw httpError(400, "recurring must be an object.");
    }

    if (typeof recurring.enabled !== "boolean") {
      throw httpError(400, "recurring.enabled must be a boolean.");
    }

    if (recurring.enabled) {
      if (!RECURRING_PATTERNS.includes(recurring.pattern)) {
        throw httpError(
          400,
          `recurring.pattern must be one of: ${RECURRING_PATTERNS.join(", ")}.`,
        );
      }

      if (recurring.endDate !== undefined && recurring.endDate !== null) {
        if (
          typeof recurring.endDate !== "string" ||
          !ISO_DATE_REGEX.test(recurring.endDate)
        ) {
          throw httpError(
            400,
            'recurring.endDate must be in "YYYY-MM-DD" format.',
          );
        }
        if (recurring.endDate < date) {
          throw httpError(400, "recurring.endDate cannot be before date.");
        }
      }
    }

    clean.recurring = {
      enabled: recurring.enabled,
      ...(recurring.enabled
        ? {
            pattern: recurring.pattern,
            ...(recurring.endDate ? { endDate: recurring.endDate } : {}),
          }
        : {}),
    };
  }

  return clean;
};

/**
 * Validate an optional {startDate,endDate} range for list filtering.
 * Both are optional; each must be a valid ISO date if present.
 */
const buildDateRangeFilter = (query = {}) => {
  const { startDate, endDate } = query;
  const range = {};

  if (startDate !== undefined) {
    if (typeof startDate !== "string" || !ISO_DATE_REGEX.test(startDate)) {
      throw httpError(400, 'startDate must be in "YYYY-MM-DD" format.');
    }
    range.$gte = startDate;
  }

  if (endDate !== undefined) {
    if (typeof endDate !== "string" || !ISO_DATE_REGEX.test(endDate)) {
      throw httpError(400, 'endDate must be in "YYYY-MM-DD" format.');
    }
    range.$lte = endDate;
  }

  if (range.$gte && range.$lte && range.$gte > range.$lte) {
    throw httpError(400, "startDate cannot be after endDate.");
  }

  return Object.keys(range).length ? range : null;
};

const assertValidGuardId = (guardId) => {
  if (!guardId || !mongoose.Types.ObjectId.isValid(guardId)) {
    throw httpError(400, "A valid authenticated guard id is required.");
  }
};

/**
 * POST /availability/slots: create a slot owned by the given guardId.
 */
export const createSlot = async (guardId, body) => {
  assertValidGuardId(guardId);
  const clean = validateSlotInput(body);
  return AvailabilitySlot.create({ guardId, ...clean });
};

/**
 * GET /availability/slots/my-slots: list the guard's slots, optionally
 * filtered to a [startDate, endDate] range. Sorted along the calendar.
 */
export const listMySlots = async (guardId, query) => {
  assertValidGuardId(guardId);
  const filter = { guardId };

  const range = buildDateRangeFilter(query);
  if (range) {
    filter.date = range;
  }

  return AvailabilitySlot.find(filter).sort({ date: 1, fromTime: 1 });
};

/**
 * DELETE /availability/slots/:id: delete one slot, only if it belongs to the
 * guard. A non-existent id OR another guard's slot both surface as 404, so the
 * endpoint never reveals the existence of slots the caller doesn't own.
 */
export const deleteSlot = async (guardId, slotId) => {
  assertValidGuardId(guardId);

  if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
    throw httpError(404, "Availability slot not found.");
  }

  const deleted = await AvailabilitySlot.findOneAndDelete({
    _id: slotId,
    guardId,
  });

  if (!deleted) {
    throw httpError(404, "Availability slot not found.");
  }

  return deleted;
};

/**
 * DELETE /availability/slots/clear-all: remove all of the guard's slots.
 * Returns the number deleted.
 */
export const clearAllSlots = async (guardId) => {
  assertValidGuardId(guardId);
  const result = await AvailabilitySlot.deleteMany({ guardId });
  return result?.deletedCount ?? 0;
};

/**
 * models/AvailabilitySlot.js
 *
 * Calendar-based availability slots for the Guard App (Ticket #20).
 *
 * This is a DISTINCT concept from models/Availability.js. `Availability` is a
 * single unique document per user describing recurring weekday preferences
 * (days[] / timeSlots[] / live status). An `AvailabilitySlot` is one concrete
 * date-bound window a guard is available; a guard owns MANY of them.
 *
 * Slot shape matches the Guard App contract (guard_app/src/api/availability.ts,
 * AvailabilitySlotDto):
 *   { _id, guardId, date, fromTime, toTime, recurring?, createdAt, updatedAt }
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// "YYYY-MM-DD" zero-padded ISO calendar date. Sorts and range-filters lexically.
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// "HH:MM" 24-hour clock.
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const RECURRING_PATTERNS = ["weekly", "daily"];

const RecurringSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    pattern: {
      type: String,
      enum: RECURRING_PATTERNS,
    },
    endDate: {
      type: String,
      match: ISO_DATE_REGEX,
    },
  },
  { _id: false },
);

const AvailabilitySlotSchema = new Schema(
  {
    guardId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
      match: [ISO_DATE_REGEX, 'date must be in "YYYY-MM-DD" format.'],
    },

    fromTime: {
      type: String,
      required: true,
      match: [TIME_REGEX, 'fromTime must be in "HH:MM" 24-hour format.'],
    },

    toTime: {
      type: String,
      required: true,
      match: [TIME_REGEX, 'toTime must be in "HH:MM" 24-hour format.'],
    },

    recurring: {
      type: RecurringSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  },
);

// Common access pattern: a guard's slots ordered along the calendar.
AvailabilitySlotSchema.index({ guardId: 1, date: 1, fromTime: 1 });

const AvailabilitySlot = mongoose.model(
  "AvailabilitySlot",
  AvailabilitySlotSchema,
);

export default AvailabilitySlot;

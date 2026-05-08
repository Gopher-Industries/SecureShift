/**
 * models/Availability.js
 *
 * Availability schema:
 * - user (unique per user)
 * - days: array of weekday strings
 * - timeSlots: array of strings in format "HH:MM-HH:MM"
 * - status: real-time availability status
 * - lastStatusUpdatedAt: tracks latest live status update
 * - timestamps enabled
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const timeSlotRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

const VALID_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const VALID_STATUSES = [
  'AVAILABLE',
  'BUSY',
  'OFF_DUTY',
];

const AvailabilitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
      index: true,
    },

    days: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return (
            Array.isArray(v) &&
            v.length > 0 &&
            v.every((day) => VALID_DAYS.includes(day))
          );
        },
        message:
          'Days must contain valid weekday values.',
      },
    },

    timeSlots: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          if (!Array.isArray(arr) || arr.length === 0) {
            return false;
          }

          return arr.every((ts) => {
            if (!timeSlotRegex.test(ts)) {
              return false;
            }

            const [start, end] = ts.split('-');

            const toMinutes = (time) => {
              const [hh, mm] = time.split(':').map(Number);
              return hh * 60 + mm;
            };

            return toMinutes(start) < toMinutes(end);
          });
        },

        message:
          'timeSlots must follow "HH:MM-HH:MM" format with valid chronological order.',
      },
    },

    /**
     * Real-time operational status
     */
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: 'OFF_DUTY',
      required: true,
    },

    /**
     * Tracks latest status update
     */
    lastStatusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Automatically update status timestamp
 * whenever status changes
 */
AvailabilitySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.status) {
    update.lastStatusUpdatedAt = Date.now();
  }

  next();
});

/**
 * Ensure lastStatusUpdatedAt updates on save
 */
AvailabilitySchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.lastStatusUpdatedAt = Date.now();
  }

  next();
});

const Availability = mongoose.model(
  'Availability',
  AvailabilitySchema
);

export default Availability;
/**
 * models/Availability.js
 *
 * Availability schema:
 * - user (unique per user)
 * - days: array of weekday strings (at least one required)
 * - timeSlots: array of strings in format "HH:MM-HH:MM"
 * - updatedAt: automatic timestamp (kept for compatibility)
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const timeSlotRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

const AvailabilitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
    days: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one day must be selected.',
      },
      required: true,
    },
    timeSlots: {
      type: [String],
      validate: {
        validator: function (arr) {
          if (!Array.isArray(arr)) return false;
          // allow empty array? spec suggests timeSlots must be validated but doesn't force >=1
          // We'll require at least one timeslot; change if you want optional times.
          if (arr.length === 0) return false;
          return arr.every((ts) => timeSlotRegex.test(ts));
        },
        message:
          'timeSlots must be an array of strings in the format "HH:MM-HH:MM" (e.g., "09:00-12:00").',
      },
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Use timestamps so Mongoose keeps track of updatedAt automatically (keeps consistency)
    timestamps: true,
  }
);

// Ensure updatedAt updates on save/update
AvailabilitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// When using findOneAndUpdate with {new:true}, updatedAt is not automatically set by pre('save').
// Add a middleware to set updatedAt on findOneAndUpdate
AvailabilitySchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Availability = mongoose.model('Availability', AvailabilitySchema);

export default Availability;

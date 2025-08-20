import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Helper: "HH:MM" -> minutes since midnight
const hhmmToMinutes = (s) => {
  if (typeof s !== 'string') return NaN;
  const m = s.match(/^([0-1]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return NaN;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};

const locationSchema = new Schema(
  {
    street:   { type: String, trim: true },
    suburb:   { type: String, trim: true },
    state:    { type: String, trim: true },
    postcode: { type: String, match: /^\d{4}$/ }, // 4 digits
  },
  { _id: false }
);
const shiftSchema = new Schema(
  {
    // Core details
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      match: /^[A-Za-z0-9\s-]+$/,
      index: true,
    },

    // Date must be today or future
    date: {
      type: Date,
      required: true,
      validate: {
        validator: (v) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return v >= today;
        },
        message: 'Shift date must be today or in the future',
      },
    },

    // Times as HH:MM strings (original behavior)
    startTime: {
      type: String,
      required: true,
      match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
      validate: {
        validator: function (v) {
          const start = hhmmToMinutes(this.startTime);
          const end = hhmmToMinutes(v);
          return !Number.isNaN(start) && !Number.isNaN(end) && end > start;
        },
        message: 'End time must be after start time',
      },
    },

    // Location (street/suburb/state/postcode)
    location: locationSchema,

    // Urgency enum
    urgency: {
      type: String,
      enum: ['normal', 'priority', 'last-minute'],
      default: 'normal',
    },

    // Domain fields
    status: {
      type: String,
      enum: ['open', 'applied', 'assigned', 'completed'],
      default: 'open',
      index: true,
    },

    applicants: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    // Canonical historical name
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    // Creator (employer)
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Ratings & one-time flags
    guardRating: { type: Number, min: 1, max: 5 },
    employerRating: { type: Number, min: 1, max: 5 },
    ratedByGuard: { type: Boolean, default: false },
    ratedByEmployer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual alias: assignedGuard <-> acceptedBy (keeps new code working)
shiftSchema
  .virtual('assignedGuard')
  .get(function () {
    return this.acceptedBy;
  })
  .set(function (v) {
    this.acceptedBy = v;
  });

// Ensure virtuals appear in API responses
shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

const Shift = model('Shift', shiftSchema);
export default Shift;

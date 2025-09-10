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
    postcode: { type: String, match: /^\d{4}$/ }, // 4 digits (AU)
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
      // allow common punctuation
      match: /^[\w\s\-&,.'()/]+$/u,
      index: true,
    },

    company: {
      type: String,
      trim: true,
      maxlength: 100,
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

    // Times as HH:MM strings
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
          const end   = hhmmToMinutes(v);
          if (Number.isNaN(start) || Number.isNaN(end)) return false;
          const duration = (end - start + 1440) % 1440;
          return duration > 0;
        },
        message: 'End time must be after start time (same day or next day)',
      },
    },

    // Computed flag
    spansMidnight: { type: Boolean, default: false },

    // Location
    location: locationSchema,

    // Optional field
    field: { type: String, trim: true, maxlength: 50 },

    // Urgency
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

    applicants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.every(Boolean),
        message: 'Applicants cannot contain null/undefined',
      },
    },

    // Canonical historical name
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    // Creator
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Ratings
    guardRating: { type: Number, min: 1, max: 5 },
    employerRating: { type: Number, min: 1, max: 5 },
    ratedByGuard: { type: Boolean, default: false },
    ratedByEmployer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compute spansMidnight
shiftSchema.pre('validate', function (next) {
  const s = hhmmToMinutes(this.startTime);
  const e = hhmmToMinutes(this.endTime);
  if (!Number.isNaN(s) && !Number.isNaN(e)) {
    this.spansMidnight = e <= s;
  }
  next();
});

// Clean applicants
shiftSchema.pre('save', function (next) {
  if (Array.isArray(this.applicants)) {
    this.applicants = this.applicants.filter(Boolean);
  } else {
    this.applicants = [];
  }
  next();
});

// Virtual alias: assignedGuard <-> acceptedBy
shiftSchema
  .virtual('assignedGuard')
  .get(function () {
    return this.acceptedBy;
  })
  .set(function (v) {
    this.acceptedBy = v;
  });

// Ensure virtuals in responses
shiftSchema.set('toJSON', { virtuals: true });
shiftSchema.set('toObject', { virtuals: true });

// 🔑 Compound index for history queries
shiftSchema.index({ status: 1, date: -1 });

const Shift = model('Shift', shiftSchema);
export default Shift;

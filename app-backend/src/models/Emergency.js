import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["ACTIVE", "ESCALATED", "RESOLVED", "CANCELLED"],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    at: {
      type: Date,
      default: Date.now,
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false },
);

const locationUpdateSchema = new mongoose.Schema(
  {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const emergencySchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ESCALATED", "RESOLVED", "CANCELLED"],
      default: "ACTIVE",
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    locationUpdates: {
      type: [locationUpdateSchema],
      default: [],
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

emergencySchema.index({ guardId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Emergency", emergencySchema);

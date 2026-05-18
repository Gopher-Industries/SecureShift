import mongoose from "mongoose";

// ---------------- Attachment Schema ----------------
const attachmentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
    },

    fileSize: {
      type: Number,
    },

    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "pdf", "other"],
      default: "other",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ---------------- Incident Schema ----------------
const incidentSchema = new mongoose.Schema(
  {
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },

    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // NEW structured lifecycle
    status: {
      type: String,
      enum: ["SUBMITTED", "IN_REVIEW", "RESOLVED"],
      default: "SUBMITTED",
    },

    // NEW GPS location
    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
    },

    // NEW standard timestamp
    recordedAt: {
      type: Date,
      default: Date.now,
    },

    attachments: [attachmentSchema],

    // ---------------- Soft Delete ----------------
    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Incident", incidentSchema);
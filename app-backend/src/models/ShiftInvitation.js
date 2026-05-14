import mongoose from "mongoose";

const shiftInvitationSchema = new mongoose.Schema(
  {
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      index: true,
    },

    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

shiftInvitationSchema.index(
  { shiftId: 1, guardId: 1 },
  { unique: true }
);

export default mongoose.model("ShiftInvitation", shiftInvitationSchema);
import mongoose from "mongoose";

const shiftAttendanceSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    siteLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    checkInLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    checkOutLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    locationVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

shiftAttendanceSchema.index({ siteLocation: "2dsphere" });

const ShiftAttendance = mongoose.model("ShiftAttendance", shiftAttendanceSchema);
export default ShiftAttendance;

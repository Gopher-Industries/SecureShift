// This model stores timesheet records that are automatically
import mongoose from "mongoose"; //Created for when a guard checks in/out of a shift

const timesheetSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
      required: true,
    },
    hoursWorked: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "pending"],
      default: "completed",
    },
  },
  { timestamps: true }
);

// Prevent duplicate timesheet for same guard + shift
timesheetSchema.index({ guardId: 1, shiftId: 1 }, { unique: true });

const Timesheet = mongoose.model("Timesheet", timesheetSchema);
export default Timesheet;

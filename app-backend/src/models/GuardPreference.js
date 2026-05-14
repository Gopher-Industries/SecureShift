import mongoose from "mongoose";

const guardPreferenceSchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    preferredShiftTypes: {
      type: [String],
      enum: ["Day", "Night"],
      default: [],
    },

    preferredFields: {
      type: [String],
      default: [],
    },

    preferredSuburbs: {
      type: [String],
      default: [],
    },

    minimumPayRate: {
      type: Number,
      min: 0,
      default: 0,
    },

    acceptsUrgentShifts: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("GuardPreference", guardPreferenceSchema);
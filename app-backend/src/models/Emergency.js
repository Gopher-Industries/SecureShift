// models/Emergency.js
import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema(
  {
    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",           //  Changed from "User" to "Guard" - better reference
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,               //  Added validation
      max: 90,
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,              //  Added validation
      max: 180,
    },
    message: {
      type: String,
      default: "",
      trim: true,             //  Added
      maxlength: 500,         //  Added
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED"],
      default: "ACTIVE",
    },
  },
  { 
    timestamps: true          //  Already good
  }
);

export default mongoose.model("Emergency", emergencySchema);
// import mongoose from "mongoose";

// const emergencySchema = new mongoose.Schema(
//   {
//     guardId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     latitude: {
//       type: Number,
//       required: true,
//     },
//     longitude: {
//       type: Number,
//       required: true,
//     },
//     message: {
//       type: String,
//       default: "",
//     },
//     status: {
//       type: String,
//       enum: ["ACTIVE", "RESOLVED"],
//       default: "ACTIVE",
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Emergency", emergencySchema);

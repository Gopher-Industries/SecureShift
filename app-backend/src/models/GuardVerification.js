import mongoose from "mongoose";

const GuardVerificationSchema = new mongoose.Schema(
  {
    guardId: { type: mongoose.Schema.Types.ObjectId, ref: "Guard", required: true },
    jurisdiction: { type: String, required: true }, // NSW, VIC, etc.
    licenceNumber: { type: String, required: true },

    status: { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
    authority: { type: String, default: null },
    expiryDate: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },

    source: { type: String, enum: ["nsw_api", "manual", "mock_db"], required: true },
    responseHash: { type: String, default: null },
    notes: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model("GuardVerification", GuardVerificationSchema);

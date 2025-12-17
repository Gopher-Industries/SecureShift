// src/models/ManualVerification.js
import mongoose from 'mongoose';

const ManualVerificationSchema = new mongoose.Schema({
  guardId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jurisdiction: { type: String, required: true },
  status: { type: String, enum: ['pending','in_review','approved','rejected'], default: 'pending', index: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin assigned
  evidence: [{ filename: String, url: String }], // optional admin attachments
  history: [{
    action: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

export default mongoose.model('ManualVerification', ManualVerificationSchema);

import mongoose from 'mongoose';

const fcmTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('FcmToken', fcmTokenSchema);

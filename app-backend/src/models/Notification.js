import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  guardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Guard' },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: { type: Object, default: {} },
  type: { type: String, enum: ['SHIFT_NEW', 'SHIFT_UPDATE', 'MESSAGE'], required: true },
  status: { type: String, enum: ['SENT','FAILED'], default: 'SENT' },
  sentAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);

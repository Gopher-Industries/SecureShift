import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'SHIFT_APPLIED',
      'SHIFT_APPROVED',
      'SHIFT_REJECTED',
      'SHIFT_SWAP_REQUEST',
      'SHIFT_SWAP_ACCEPTED',
      'SHIFT_SWAP_DECLINED',
      'SHIFT_LEAVE_REQUEST',
      'SHIFT_LEAVE_APPROVED',
      'SHIFT_LEAVE_REJECTED',
      'SHIFT_REMINDER',
      'DOCUMENT_EXPIRING',
      'INCIDENT_REPORTED',
      'INCIDENT_RESOLVED',
      'SOS_ALERT',
      'SYSTEM_ALERT',
      'PAYROLL_PROCESSED'
    ],
    required: true,
    index: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true,
  },
  category: {
    type: String,
    enum: ['SOS', 'INCIDENT', 'SHIFT', 'SYSTEM', 'DOCUMENT', 'PAYROLL'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  data: {
    type: Object,
    default: {},
  },
  metadata: {
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShiftRequest' },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number], // [longitude, latitude]
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionRequired: { type: Boolean, default: false },
    actionUrl: { type: String },
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true,
  },
  broadcast: {
    type: Boolean,
    default: false,
  },
  broadcastRoles: [{
    type: String,
    enum: ['guard', 'employer', 'admin'],
  }],
  deliveredAt: {
    type: Date,
    default: Date.now,
  },
  deliveryStatus: {
    type: String,
    enum: ['PENDING', 'DELIVERED', 'FAILED'],
    default: 'PENDING',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, priority: -1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired
notificationSchema.index({ priority: 1, deliveryStatus: 1 });

// Virtual: check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual: time ago
notificationSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
});

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead === true && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to create notification with priority queue
notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = await this.create(notificationData);

  // TODO: Emit WebSocket event for real-time delivery
  // if (global.io) {
  //   global.io.to(`user_${notification.userId}`).emit('new_notification', notification);
  // }

  return notification;
};

// Static method to broadcast to multiple users
notificationSchema.statics.broadcast = async function(broadcastData, userIds) {
  const notifications = [];
  for (const userId of userIds) {
    notifications.push({
      ...broadcastData,
      userId,
      broadcast: true,
    });
  }
  return await this.insertMany(notifications);
};

// Static method to get unread count by priority
notificationSchema.statics.getUnreadCountByPriority = async function(userId) {
  return await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), isRead: false } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: {
        $switch: {
          branches: [
            { case: { $eq: ['$_id', 'CRITICAL'] }, then: 1 },
            { case: { $eq: ['$_id', 'HIGH'] }, then: 2 },
            { case: { $eq: ['$_id', 'MEDIUM'] }, then: 3 },
            { case: { $eq: ['$_id', 'LOW'] }, then: 4 },
          ],
          default: 5
        }
      }
    }
  ]);
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
    // index removed — covered by compound index below
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required'],
    // index removed — covered by compound index below
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxLength: [1000, 'Message content cannot exceed 1000 characters'],
    minLength: [1, 'Message content cannot be empty'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
    // index removed — covered by compound index below
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  conversationId: {
    type: String,
    // index removed — covered by compound index below
  },

  // soft delete fields
  isDeleted: { type: Boolean, default: false }, // index removed — covered by compound index below
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deleteReason: { type: String, default: null },

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Create conversation ID based on sorted user IDs for consistent grouping
messageSchema.pre('save', function (next) {
  if (!this.conversationId) {
    const ids = [this.sender.toString(), this.receiver.toString()].sort();
    this.conversationId = `${ids[0]}_${ids[1]}`;
  }
  next();
});

// Compound indexes — these are the only index definitions needed
messageSchema.index({ sender: 1, timestamp: -1 });
messageSchema.index({ receiver: 1, timestamp: -1 });
messageSchema.index({ conversationId: 1, isDeleted: 1, timestamp: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ isDeleted: 1, timestamp: -1 });

// Virtual for message age
messageSchema.virtual('age').get(function () {
  return Date.now() - this.timestamp;
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function (userId1, userId2, limit = 50) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  const conversationId = `${ids[0]}_${ids[1]}`;

  return this.find({ conversationId, isDeleted: { $ne: true } })
    .populate('sender', 'email name role')
    .populate('receiver', 'email name role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function (receiverId, senderId) {
  const ids = [receiverId.toString(), senderId.toString()].sort();
  const conversationId = `${ids[0]}_${ids[1]}`;

  return this.updateMany(
    {
      conversationId,
      receiver: receiverId,
      isRead: false,
      isDeleted: { $ne: true },
    },
    { isRead: true }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false,
    isDeleted: { $ne: true },
  });
};

const Message = mongoose.model('Message', messageSchema);

export default Message;

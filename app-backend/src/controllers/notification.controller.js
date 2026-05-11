import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * GET /notifications
 * User-specific notifications (paginated + filters + priority sorting)
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    let { page = 1, limit = 20, type, category, priority, isRead, sortBy = 'priority' } = req.query;

    page = Math.max(1, parseInt(page));
    limit = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = { userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    // Sort logic: CRITICAL first, then HIGH, then date
    let sortOptions = {};
    if (sortBy === 'priority') {
      sortOptions = { priority: -1, createdAt: -1 };
    } else {
      sortOptions = { createdAt: -1 };
    }

    const notifications = await Notification.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(filter);

    // Get unread count by priority
    const unreadByPriority = await Notification.getUnreadCountByPriority(userId);

    res.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: { unreadByPriority, totalUnread: notifications.filter(n => !n.isRead).length }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /notifications
 * Enhanced notification creation with priority support
 */
export const createNotification = async (req, res) => {
  try {
    const { userId, type, category, priority, title, message, data, metadata, expiresAt, broadcast, broadcastRoles } = req.body;

    // Required field validation
    if (!userId || !type || !category || !message) {
      return res.status(400).json({
        message: 'userId, type, category, and message are required',
      });
    }

    const allowedRoles = ['super_admin', 'admin', 'branch_admin', 'employer'];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You are not allowed to create notifications',
      });
    }

    // Handle broadcast to multiple users
    if (broadcast) {
      let targetUsers = [];
      if (broadcastRoles && broadcastRoles.length > 0) {
        targetUsers = await User.find({ role: { $in: broadcastRoles } }).distinct('_id');
      } else if (userId === 'all') {
        targetUsers = await User.find().distinct('_id');
      }

      if (targetUsers.length > 0) {
        const notifications = await Notification.broadcast({
          type,
          category,
          priority: priority || 'MEDIUM',
          title: title || '',
          message,
          data: data || {},
          metadata: metadata || {},
          expiresAt: expiresAt || null,
        }, targetUsers);

        return res.status(201).json({
          success: true,
          message: `Broadcast sent to ${targetUsers.length} users`,
          count: notifications.length
        });
      }
    }

    // Single notification
    const notification = await Notification.createNotification({
      userId,
      type,
      category,
      priority: priority || 'MEDIUM',
      title: title || '',
      message,
      data: data || {},
      metadata: metadata || {},
      expiresAt: expiresAt || null,
    });

    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /notifications/:id
 * Secure ownership-based access
 */
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PATCH /notifications/:id/read
 * Mark single notification as read (secure)
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PATCH /notifications/read-all
 * Mark all user notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /notifications/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    const byPriority = await Notification.getUnreadCountByPriority(req.user._id);

    res.json({
      success: true,
      unreadCount: count,
      byPriority
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /notifications/expired
 * Clean up expired notifications
 */
export const deleteExpiredNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} expired notifications deleted`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /notifications/unread/high-priority
 * Get unread HIGH and CRITICAL priority notifications
 */
export const getHighPriorityUnread = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      isRead: false,
      priority: { $in: ['HIGH', 'CRITICAL'] }
    }).sort({ priority: -1, createdAt: -1 });

    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
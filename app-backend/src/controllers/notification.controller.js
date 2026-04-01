import Notification from '../models/Notification.js';
import { ROLES } from '../constants/roles.js';

/**
 * GET /notifications
 * User-specific notifications (paginated + filters)
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    let { page = 1, limit = 20, type, isRead } = req.query;

    page = Math.max(1, parseInt(page));
    limit = Math.min(100, Math.max(1, parseInt(limit)));

    const filter = { userId };

    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments(filter);

    res.json({
      notifications,
      total,
      page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /notifications
 * Secure notification creation (restricted roles only)
 */
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;

    // Required field validation
    if (!userId || !type || !message) {
      return res.status(400).json({
        message: 'userId, type, and message are required',
      });
    }

    // Role-based restriction
    const allowedRoles = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.BRANCH_ADMIN,
      ROLES.EMPLOYER,
    ];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You are not allowed to create notifications',
      });
    }

    const notification = await Notification.create({
      userId,
      type,
      title: title || '',
      message,
      data: data || {},
      createdBy: req.user._id,
    });

    res.status(201).json(notification);
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

    res.json(notification);
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
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
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
    await Notification.updateMany(
      { userId: req.user._id },
      { isRead: true }
    );

    res.json({ success: true });
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

    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

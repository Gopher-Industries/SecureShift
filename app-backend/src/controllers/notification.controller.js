import Notification from '../models/Notification.js';

// GET /notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Notification.countDocuments({ userId });

    res.json({ notifications, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /notifications
export const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET single
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH read one
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH read all
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

// GET unread count
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

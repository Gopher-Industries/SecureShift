import AuditLog from '../models/AuditLogs.js';

export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, role, from, to } = req.query;

    const query = {};
    if (userId) query.user = userId;
    if (action) query.action = action;
    if (role) query.role = role;
    if (from || to) query.timestamp = {};
    if (from) query.timestamp.$gte = new Date(from);
    if (to) query.timestamp.$lte = new Date(to);

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'name email role'); // populate user info

    res.status(200).json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

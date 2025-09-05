import User from '../models/User.js';
import Shift from '../models/Shift.js';
import AuditLog from '../models/AuditLogs.js';
import Message from '../models/Message.js'; // Message Model
import { ACTIONS } from '../middleware/logger.js';

import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for a user
 * @param {Object} user
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * @desc Admin login
 * @route POST /api/v1/admin/login
 * @access Public
 */
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Not an admin user.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();
    await req.audit.log(user._id, ACTIONS.LOGIN_SUCCESS, { step: "ADMIN_LOGIN" });
    const token = generateToken(user);

    res.status(200).json({
      token,
      id: user._id,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc Get all users (admin only)
 * @route GET /api/v1/admin/users
 * @access Admin only
 */
export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users, exclude passwords for security
    const users = await User.find({ isDeleted: { $ne: true } }).select('-password');
    await req.audit.log(req.user.id, ACTIONS.VIEW_USERS, { totalUsers: users.length });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve users', error: error.message });
  }
};

/**
 * @desc Get all shifts (admin only)
 * @route GET /api/v1/admin/shifts
 * @access Admin only
 */
export const getAllShifts = async (req, res) => {
  try {
    // Fetch all shifts with user references populated for clarity
    const shifts = await Shift.find()
      .populate('createdBy', 'name email role')  // populate employer info
      .populate('acceptedBy', 'name email role'); // populate guard info
    await req.audit.log(req.user.id, ACTIONS.VIEW_SHIFTS, { totalShifts: shifts.length });
    res.status(200).json({ shifts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve shifts', error: error.message });
  }
};


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

/**
 * @desc Purge audit logs older than a given number of days
 * @route DELETE /api/v1/admin/audit-logs/purge?days=30
 * @access Admin only
 */
export const purgeAuditLogs = async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  try {
    const result = await AuditLog.purgeOldLogs(days);
    res.status(200).json({ message: `Purged logs older than ${days} days`, deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to purge audit logs', error: err.message });
  }
};

/**
 * @desc Get a single user by ID (admin only)
 * @route GET /api/v1/admin/users/:id
 * @access Admin only
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find user, exclude password
    const user = await User.findById(id).select('-password');
    if (!user || user.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user', error: error.message });
  }
};

/**
 * @desc Get all messages (admin only) with optional filters
 * @route GET /api/v1/admin/messages
 * @access Admin only
 * @query
 *   sender, receiver, conversationId
 *   from, to (ISO dates → filters "timestamp")
 *   page, limit (for pagination)
 */
export const getAllMessages = async (req, res) => {
  try {
    // pagination setup
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip  = (page - 1) * limit;

    // build query object
    const query = {};
    if (req.query.sender)         query.sender = req.query.sender;
    if (req.query.receiver)       query.receiver = req.query.receiver;
    if (req.query.conversationId) query.conversationId = req.query.conversationId;

    // soft-delete default
    if (req.query.includeDeleted !== 'true') {
      query.isDeleted = { $ne: true };
    }

    // date range filter
    if (req.query.from || req.query.to) {
      query.timestamp = {};
      if (req.query.from) query.timestamp.$gte = new Date(req.query.from);
      if (req.query.to)   query.timestamp.$lte = new Date(req.query.to);
    }

    // query DB
    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .populate('sender', 'name email role')
        .populate('receiver', 'name email role')
        .lean(),
      Message.countDocuments(query),
    ]);

    return res.status(200).json({
      messages,
      pagination: {
        page,
        limit,
        total,
        hasNext: skip + messages.length < total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve messages',
      error: error.message,
    });
  }
};

/**
 * @desc Soft-delete a user by ID (Admin only)
 * @route DELETE /api/v1/admin/users/:id
 * @access Admin only
 */
export const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = (req.body && req.body.reason) || null;

    // Find target user
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // if already soft-deleted, just return OK
    if (target.isDeleted) {
      return res.status(200).json({ message: 'User already deleted.' });
    }

    // Prevent self-delete
    if (String(target._id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    // Prevent deleting the last admin
    if (target.role === 'admin') {
      const otherAdmins = await User.countDocuments({ role: 'admin', _id: { $ne: target._id }, isDeleted: { $ne: true } });
      if (otherAdmins === 0) {
        return res.status(400).json({ message: 'Cannot delete the last remaining admin.' });
      }
    }

    // Soft delete
    target.isDeleted = true;
    target.deletedAt = new Date();
    target.deletedBy = req.user.id;
    target.deleteReason = reason;
    await target.save();

    // AUDIT: user soft-deleted
    await req.audit.log(req.user.id, ACTIONS.USER_SOFT_DELETED, {
      targetUserId: String(target._id),
      targetRole: target.role,
      reason: reason || null,
    });

    return res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

/**
 * @desc Soft-delete a message by ID (Admin only)
 * @route DELETE /api/v1/admin/messages/:id
 * @access Admin only
 */
export const deleteMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = (req.body && req.body.reason) || null;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Already deleted
    if (message.isDeleted) {
      return res.status(200).json({ message: 'Message already deleted.' });
    }

    // Soft delete
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user.id;
    message.deleteReason = reason;
    await message.save();

    // AUDIT: message soft-deleted
    await req.audit.log(req.user.id, ACTIONS.MESSAGE_SOFT_DELETED, {
      messageId: String(message._id),
      sender: String(message.sender),
      receiver: String(message.receiver),
      conversationId: message.conversationId || null,
      reason: reason || null,
    });
    
    return res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};
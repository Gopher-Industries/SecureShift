import User from '../models/User.js';
import Shift from '../models/Shift.js';
import AuditLog from '../models/AuditLogs.js';

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
    const users = await User.find().select('-password');
    await req.audit.log(req.user.id, ACTIONS.USERS_VIEWED, { totalUsers: users.length });
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
    await req.audit.log(req.user.id, ACTIONS.SHIFTS_VIEWED, { totalShifts: shifts.length });
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

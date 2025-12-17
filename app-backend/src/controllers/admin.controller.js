import User from '../models/User.js';
import Shift from '../models/Shift.js';
import AuditLog from '../models/AuditLogs.js';
import Message from '../models/Message.js';
import { ACTIONS } from '../middleware/logger.js';
import Guard from '../models/Guard.js';
import { sendOTP } from '../utils/sendEmail.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * @desc List guards with pending license
 * @route GET /api/v1/admin/guards/pending
 * @access Admin
 */
export const listPendingLicenses = async (req, res) => {
  try {
    const guards = await Guard.find({ 'license.status': 'pending' })
      .select('name email license.status license.imageUrl license.verifiedAt license.verifiedBy createdAt');
    return res.status(200).json({ count: guards.length, guards });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch pending licenses', error: err.message });
  }
};

/**
 * @desc Verify a guard's license
 * @route PATCH /api/v1/admin/guards/:id/license/verify
 * @access Admin
 */
export const verifyGuardLicense = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure it's a guard record
    const guard = await Guard.findById(id);
    if (!guard) return res.status(404).json({ message: 'Guard not found' });

    guard.license.status = 'verified';
    guard.license.reviewedAt = new Date();
    guard.license.verifiedBy = req.user.id;     // admin performing the action
    guard.license.rejectionReason = null;

    await guard.save();

    return res.status(200).json({
      message: 'License verified successfully',
      license: guard.license,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to verify license', error: err.message });
  }
};

/**
 * @desc Reject a guard's license
 * @route PATCH /api/v1/admin/guards/:id/license/reject
 * @access Admin
 * @body { reason?: string }
 */
export const rejectGuardLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const guard = await Guard.findById(id);
    if (!guard) return res.status(404).json({ message: 'Guard not found' });

    guard.license.status = 'rejected';
    guard.license.reviewedAt = new Date();           // not verified
    guard.license.verifiedBy = req.user.id;     // admin who reviewed
    guard.license.rejectionReason = reason || null;

    await guard.save();

    return res.status(200).json({
      message: 'License rejected',
      license: guard.license,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reject license', error: err.message });
  }
};

/**
 * @desc Get SMTP settings (Admin only)
 * @route GET /api/v1/admin/smtp-settings
 * @access Admin
 */
export const getSmtpSettings = async (req, res) => {
  try {
    const envPath = path.join(__dirname, '../../.env');
    
    const settings = {
      SMTP_HOST: process.env.SMTP_HOST || '',
      SMTP_PORT: process.env.SMTP_PORT || '587',
      SMTP_SECURE: process.env.SMTP_SECURE || 'false',
      SMTP_USER: process.env.SMTP_USER || '',
      SMTP_PASS: process.env.SMTP_PASS ? '***hidden***' : '',
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || '',
    };

    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get SMTP settings', error: err.message });
  }
};

/**
 * @desc Update SMTP settings (Admin only)
 * @route PUT /api/v1/admin/smtp-settings
 * @access Admin
 */
export const updateSmtpSettings = async (req, res) => {
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = req.body;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return res.status(400).json({ 
        message: 'SMTP_HOST, SMTP_USER, and SMTP_PASS are required' 
      });
    }

    if (!SMTP_FROM_EMAIL) {
      return res.status(400).json({ 
        message: 'SMTP_FROM_EMAIL is required. This must be a verified sender email address.' 
      });
    }

    const envPath = path.join(__dirname, '../../.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const lines = envContent.split('\n');
    const updatedLines = [];
    const newSettings = {
      SMTP_HOST,
      SMTP_PORT: SMTP_PORT || '587',
      SMTP_SECURE: SMTP_SECURE || 'false',
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM_EMAIL,
    };

    let smtpFound = false;
    for (const line of lines) {
      if (line.startsWith('SMTP_HOST=') || line.startsWith('SMTP_PORT=') || 
          line.startsWith('SMTP_SECURE=') || line.startsWith('SMTP_USER=') || 
          line.startsWith('SMTP_PASS=') || line.startsWith('SMTP_FROM_EMAIL=')) {
        if (!smtpFound) {
          updatedLines.push(`SMTP_HOST=${SMTP_HOST}`);
          updatedLines.push(`SMTP_PORT=${newSettings.SMTP_PORT}`);
          updatedLines.push(`SMTP_SECURE=${newSettings.SMTP_SECURE}`);
          updatedLines.push(`SMTP_USER=${SMTP_USER}`);
          updatedLines.push(`SMTP_PASS=${SMTP_PASS}`);
          updatedLines.push(`SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL}`);
          smtpFound = true;
        }
      } else if (line.trim() && !line.startsWith('#')) {
        updatedLines.push(line);
      } else {
        updatedLines.push(line);
      }
    }

    if (!smtpFound) {
      updatedLines.push('');
      updatedLines.push('# SMTP Configuration');
      updatedLines.push(`SMTP_HOST=${SMTP_HOST}`);
      updatedLines.push(`SMTP_PORT=${newSettings.SMTP_PORT}`);
      updatedLines.push(`SMTP_SECURE=${newSettings.SMTP_SECURE}`);
      updatedLines.push(`SMTP_USER=${SMTP_USER}`);
      updatedLines.push(`SMTP_PASS=${SMTP_PASS}`);
      updatedLines.push(`SMTP_FROM_EMAIL=${SMTP_FROM_EMAIL}`);
    }

    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');

    process.env.SMTP_HOST = SMTP_HOST;
    process.env.SMTP_PORT = newSettings.SMTP_PORT;
    process.env.SMTP_SECURE = newSettings.SMTP_SECURE;
    process.env.SMTP_USER = SMTP_USER;
    process.env.SMTP_PASS = SMTP_PASS;
    process.env.SMTP_FROM_EMAIL = SMTP_FROM_EMAIL;

    await req.audit.log(req.user.id, ACTIONS.ADMIN_ACTION, { 
      action: 'UPDATE_SMTP_SETTINGS' 
    });

    res.status(200).json({ 
      message: 'SMTP settings updated successfully',
      settings: {
        SMTP_HOST,
        SMTP_PORT: newSettings.SMTP_PORT,
        SMTP_SECURE: newSettings.SMTP_SECURE,
        SMTP_USER,
        SMTP_PASS: '***hidden***',
        SMTP_FROM_EMAIL,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update SMTP settings', error: err.message });
  }
};

/**
 * @desc Test SMTP settings by sending a test email (Admin only)
 * @route POST /api/v1/admin/smtp-settings/test
 * @access Admin
 */
export const testSmtpSettings = async (req, res) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ message: 'testEmail is required' });
    }

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOTP(testEmail, testOtp);
      await req.audit.log(req.user.id, ACTIONS.ADMIN_ACTION, { 
        action: 'TEST_SMTP_SETTINGS', 
        testEmail 
      });
      res.status(200).json({ 
        message: 'Test email sent successfully',
        note: 'Check the inbox of the test email address'
      });
    } catch (emailError) {
      res.status(500).json({ 
        message: 'Failed to send test email',
        error: emailError.message 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to test SMTP settings', error: err.message });
  }
};
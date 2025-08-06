import User from '../models/User.js';
import Shift from '../models/Shift.js';  // import your Shift model
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

    res.status(200).json({ shifts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve shifts', error: error.message });
  }
};

import User from '../models/User.js';
import { ACTIONS } from "../middleware/logger.js";

/**
 * @desc    View logged-in user's profile
 * @route   GET /api/v1/users/me
 * @access  Private (all roles)
 */
export const getMyProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

/**
 * @desc    Admin: List all users
 * @route   GET /api/v1/users
 * @access  Private/Admins
 */
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ total: users.length, users });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * @desc    Update logged-in user's profile
 * @route   PUT /api/v1/users/me
 * @access  Private (all roles)
 */
export const updateMyProfile = async (req, res) => {
  const fieldsToUpdate = { ...req.body };
  delete fieldsToUpdate.role;       // prevent role changes
  delete fieldsToUpdate.password;   // don’t allow password here

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  ).select('-password');

  res.json(updatedUser);
};

/**
 * @desc    Admin: View any user profile
 * @route   GET /api/v1/users/:id
 * @access  Private/Admin
 */
export const adminGetUserProfile = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

/**
 * @desc    Admin: Update any user's profile
 * @route   PUT /api/v1/users/:id
 * @access  Private/Admin
 */
export const adminUpdateUserProfile = async (req, res) => {
  const fieldsToUpdate = { ...req.body };
  delete fieldsToUpdate.password;   // separate password endpoint if needed

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) return res.status(404).json({ message: 'User not found' });

  await req.audit.log(req.user.id, ACTIONS.PROFILE_UPDATED, {
    updatedUserId: req.params.id,
    updatedFields: Object.keys(fieldsToUpdate),
  });

  res.json(updatedUser);
};

/**
 * @desc    Get all guards (Admin + Employee only)
 * @route   GET /api/v1/users/guards
 * @access  Private/Admin,Employee
 */
export const getAllGuards = async (req, res) => {
  const guards = await User.find({ role: 'guard' }).select('-password');
  res.json(guards);
};

/**
 * @desc    Admin: Delete a user
 * @route   DELETE /api/v1/users/:userId
 * @access  Private (Admin, Super Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await req.audit?.log(req.user.id, ACTIONS.USER_DELETED, {
      deletedUserId: req.params.userId,
      deletedUserEmail: user.email,
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

/**
 * @desc    Get logged-in employer's profile (Employer only)
 * @route   GET /api/v1/users/profile
 * @access  Private (Employer only)
 */
export const getEmployerProfile = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const employer = await User.findById(req.user.id).select('-password');
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found' });
    }

    res.status(200).json(employer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Update logged-in employer's profile (Employer only)
 * @route   PUT /api/v1/users/profile
 * @access  Private (Employer only)
 */
export const updateEmployerProfile = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const fieldsToUpdate = { ...req.body };
    delete fieldsToUpdate.role;
    delete fieldsToUpdate.password;

    const updatedEmployer = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedEmployer) return res.status(404).json({ message: 'Employer not found' });
    res.status(200).json(updatedEmployer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

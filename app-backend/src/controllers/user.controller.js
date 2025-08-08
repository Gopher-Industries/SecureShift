import User from '../models/User.js';

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
  res.json(updatedUser);
};

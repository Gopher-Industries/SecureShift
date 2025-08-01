// controllers/userController.js
import User from '../models/User.js';

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ message: 'Failed to retrieve user profile', error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.params.id;

    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        const field = existingUser.username === username ? 'Username' : 'Email';
        return res.status(400).json({ message: `${field} already in use` });
      }
    }

    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only change your own password' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

export const deactivateUserAccount = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    res.status(500).json({ message: 'Failed to deactivate account', error: error.message });
  }
};

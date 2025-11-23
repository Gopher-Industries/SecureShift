/**
 * Loads the full user document and attaches it to req.userDoc
 * Requires that req.user is already populated by the JWT auth middleware.
 */
import User from '../models/User.js';

const loadUser = async (req, res, next) => {
  try {
    if (!req.user?.id && !req.user?._id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const id = req.user.id || req.user._id;
    const userDoc = await User.findById(id);
    if (!userDoc) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    req.userDoc = userDoc;
    next();
  } catch (err) {
    next(err);
  }
};

export default loadUser;
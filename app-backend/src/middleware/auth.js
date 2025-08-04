import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to verify JWT token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Token verification failed' });
  }
};

/**
 * Helper function to determine user role based on populated relationships
 */
const getUserRole = (user) => {
  // Check if user has admin role (assuming there's an isAdmin field or admin role)
  if (user.role === 'admin' || user.isAdmin) {
    return 'admin';
  }

  // Check if user is associated with Guard entity
  if (user.guard) {
    return 'moderator'; // Assuming guards are moderators
  }

  // Check if user is associated with Employer entity
  if (user.employer) {
    return 'employer';
  }

  // Default role
  return 'user';
};

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = getUserRole(req.user);
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: userRole 
      });
    }

    next();
  };
};

/**
 * Pre-configured role middleware
 */
export const requireAdmin = requireRole('admin');
export const requireModeratorOrAdmin = requireRole(['admin', 'moderator']);

/**
 * Middleware to check ownership or admin access
 */
export const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const userId = req.params.id || req.params.userId;
  const isOwner = req.user._id.toString() === userId;
  const userRole = getUserRole(req.user);
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ 
      message: 'Access denied. You can only access your own resources or be an admin.' 
    });
  }

  next();
};

/**
 * Optional authentication middleware
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .populate('guard')
      .populate('employer');

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }

  next();
};
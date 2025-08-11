/**
 * @file middleware/auth.js
 * @description Middleware for verifying JWTs in SecureShift.
 * Checks for a valid Bearer token and attaches decoded user info to req.user.
 */

import jwt from 'jsonwebtoken';

// Middleware: Authenticate protected routes using JWT
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Ensure Authorization header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object for downstream use
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next(); // Continue to next middleware or route handler
  } catch (error) {
    console.error('JWT Auth Error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default auth;

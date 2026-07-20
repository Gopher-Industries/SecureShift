/**
 * @file middleware/auth.js
 * @description JWT Authentication middleware for SecureShift project.
 * Validates Bearer token in the Authorization header and attaches decoded user info to `req.user`.
 * Rejects requests with missing or invalid tokens.
 *
 * @usage
 * app.use(auth) → for protected routes
 *
 * @req.header Authorization: Bearer <token>
 * @res.status 401 if token is missing or invalid
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Middleware to authenticate requests using JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is not deactivated
    const user = await User.findById(decoded.id).select("isDeleted");
    if (!user || user.isDeleted) {
      return res
        .status(401)
        .json({ message: "User account has been deactivated." });
    }

    req.user = {
      _id: decoded.id,
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("JWT Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default auth;

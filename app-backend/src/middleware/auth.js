/**
 * @file middleware/auth.js
 * @description JWT Authentication middleware for SecureShift project.
 * Validates Bearer token in the Authorization header and attaches decoded user info to `req.user`.
 * Rejects requests with missing or invalid tokens.
 *
 *   Security Enhancement: Always loads the current user from database to:
 * - Reject soft-deleted users
 * - Reject users who no longer exist
 * - Use the current stored role for authorisation (not the stale JWT role)
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
    // Verify the token and decode it
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const uid = decoded.id || decoded._id; // whatever you encoded in the JWT

    // get the user from the database
    const user = await User.findById(uid).select("role isDeleted");

    // add a debug log to check the user object
    // console.log('User object keys:', Object.keys(user.toObject()));
    // console.log(`[AUTH] User ${uid} role from DB: ${user?.role}`);

    // reject if user is not found or soft-deleted
    if (!user) {
      return res
        .status(401)
        .json({ message: "User account is no longer available." });
    }
    if (user.isDeleted) {
      return res
        .status(401)
        .json({ message: "User account is no longer active." });
    }

    req.user = {
      _id: uid,
      id: uid,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("JWT Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default auth;

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendOTP } from '../utils/sendEmail.js';
import { ACTIONS } from "../middleware/logger.js";
import EOI from '../models/eoi.js';
import { GridFSBucket } from 'mongodb';

import Guard from '../models/Guard.js'; // use the discriminator so license fields persist

// ---------- Helpers ----------
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

// ---------- Controllers ----------

// @desc Register a new user (Employer, Admin)
// @route POST /api/v1/auth/register
export const register = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  try {
    // Guards must use the dedicated /auth/register/guard route
    if (role === 'guard') {
      return res.status(400).json({
        message: 'Guards must register using /auth/register/guard with a license upload.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = new User({ name, email, password, role, phone, address });
    await newUser.save();
    await req.audit.log(newUser._id, ACTIONS.PROFILE_CREATED, { registered: true });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc Register a new Guard with a required license image
 * @route POST /api/v1/auth/register/guard
 * @access Public
 * @body  multipart/form-data with field "license" (image), plus JSON fields
 *        name, email, password, phone?, address?
 */
export const registerGuardWithLicense = async (req, res) => {
  try {
    // Must have a file (handled by Multer in the route)
    if (!req.file) {
      return res.status(400).json({ message: 'License image is required (form-data field: "license").' });
    }

    const { name, email, password } = req.body;

    // Basic presence checks
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Uniqueness check
    const existing = await Guard.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Build license URL from saved file (served via /uploads)
    const imageUrl = `/uploads/${req.file.filename}`;

    // Create Guard (license starts as pending)
    const guard = await Guard.create({
      name,
      email,
      password,
      role: 'guard',
      license: {
        imageUrl,
        status: 'pending',
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
      },
    });

    // Hide password in response
    const { password: _pw, ...safe } = guard.toObject();

    return res.status(201).json({
      message: 'Guard registered successfully. License submitted for review.',
      user: safe,
    });
  } catch (err) {
    // Handle a common case where address might be stringified JSON but invalid
    if (err instanceof SyntaxError) {
      return res.status(400).json({ message: 'Invalid address JSON format.' });
    }
    return res.status(500).json({ message: err.message });
  }
};

// @desc Step 1: Login and trigger OTP
// @route POST /api/v1/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admins must use a different login method' });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    user.otp = otp;
    user.otpExpiresAt = expiry;
    await user.save();

    await sendOTP(user.email, otp);
    await req.audit.log(user._id, ACTIONS.LOGIN_SUCCESS, { step: "OTP_SENT" });

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Step 2: Verify OTP and return JWT
// @route POST /api/v1/auth/verify-otp
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email }).select('+otp +otpExpiresAt');
    if (!user) return res.status(401).json({ message: 'Invalid email or OTP' });

    const now = new Date();
    if (user.otp !== otp || now > user.otpExpiresAt) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    await req.audit.log(user._id, ACTIONS.LOGIN_SUCCESS, { step: "OTP_VERIFIED" });

    res.status(200).json({
      token,
      role: user.role,
      id: user._id,
      name: user.name,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Submit Expression of Interest (EOI)
// @route POST /api/v1/auth/eoi
export const submitEOI = async (eoiData) => {
  // This is a service-style function, called from the router after GridFS upload
  const newEOI = new EOI(eoiData);
  await newEOI.save();
  return newEOI;
};

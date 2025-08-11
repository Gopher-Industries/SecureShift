import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendOTP } from '../utils/sendEmail.js';

// Helper: create a signed JWT token with limited lifetime
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // token valid for 1 hour
  );
};

// Helper: produce a random 6-digit OTP as a string
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Controller: Register a brand-new account
export const register = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  try {
    // Avoid duplicate accounts with the same email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Save new user details in DB
    const newUser = new User({ name, email, password, role, phone, address });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller: Login step 1 — verify credentials, generate and send OTP
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Compare entered password with stored hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Create OTP and set 5-minute expiration
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    // Store OTP in user record temporarily
    user.otp = otp;
    user.otpExpiresAt = expiry;
    await user.save();

    // Send OTP to email
    await sendOTP(user.email, otp);

    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller: Login step 2 — validate OTP and return JWT
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email }).select('+otp +otpExpiresAt');
    if (!user) return res.status(401).json({ message: 'Invalid email or OTP' });

    const now = new Date();
    // Reject if OTP mismatches or has expired
    if (user.otp !== otp || now > user.otpExpiresAt) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // OTP verified — clear fields, update last login
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Issue signed JWT token
    const token = generateToken(user);
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

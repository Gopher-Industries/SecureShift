import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Employer from '../models/Employer.js';
import { sendEmployerCredentials, sendGenericEmail } from '../utils/sendEmail.js';

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

// @desc Register a new user (Employer, Admin)
// @route POST /api/v1/auth/register
export const register = async (req, res) => {
  const { name, email, password, role, phone, address, ABN } = req.body;

  try {
    // Guards must use the dedicated /auth/register/guard route
    if (role === 'guard') {
      return res.status(400).json({
        message: 'Guards must register using /auth/register/guard with a license upload.',
      });
    }

    // Unique email check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    let newUser;
    if (role === 'employer') {
      if (!ABN) {
        return res.status(400).json({ message: 'ABN is required for employers' });
      }

      newUser = new Employer({
        name,
        email,
        password,
        role,
        phone,
        address,
        ABN,
      });
    } else {
      // default Admin or other roles
      newUser = new User({ name, email, password, role, phone, address });
    }

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

    console.log("DEV_MODE otp: ", otp);
    // await sendOTP(user.email, otp);
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
  
  // Create employer account if not exists, then email credentials
  const email = eoiData.contactEmail;
  const abnAcn = eoiData.abnAcn;
  const contactPerson = eoiData.contactPerson;
  const companyName = eoiData.companyName;
  const phone = eoiData.phone;
  let employerCreated = false;
  let credentialsEmailSent = false;

  // Check if a user already exists for this email
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    // Generate a strong temporary password
    const tempPassword = generateStrongTempPassword();

    // If ABN looks valid (11 digits), create Employer; otherwise fallback to base User with role employer
    const isValidABN = /^\d{11}$/.test(abnAcn || '');
    const baseUserData = {
      name: contactPerson || companyName || 'Employer',
      email,
      password: tempPassword,
      role: 'employer',
      phone,
    };

    if (isValidABN) {
      await Employer.create({ ...baseUserData, ABN: abnAcn });
    } else {
      await User.create(baseUserData);
    }
    employerCreated = true;

    // Send credentials email (do not block on failure)
    try {
      await sendEmployerCredentials(email, tempPassword, contactPerson, companyName);
      credentialsEmailSent = true;
    } catch (err) {
      // Log and continue; EOI still created
      console.error('Failed to send employer credentials:', err.message);
    }
  } else {
    console.warn(`submitEOI: User with email ${email} already exists; skipping account creation and credential email.`);
  }

  // Return EOI and status flags
  return { eoi: newEOI, employerCreated, credentialsEmailSent };
};

// Local helper to ensure password meets validation rules
const generateStrongTempPassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_=+[]{};:,.?';
  const all = upper + lower + digits + special;

  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(special)];

  const length = 12;
  const remaining = Array.from({ length: length - required.length }, () => pick(all));
  const passwordChars = required.concat(remaining);

  // Shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  return passwordChars.join('');
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await sendGenericEmail(user.email, "Password Reset", `Click to reset: ${resetUrl}`);

  return res.status(200).json({ message: "Reset link sent to your email." });
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "Invalid token" });

    user.password = newPassword; // Make sure pre-save middleware hashes it
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ message: "Token invalid or expired" });
  }
};

export const sendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.isVerified) return res.sendStatus(400);

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "30m" });
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  await sendEmail(email, "Verify your email", `Click here: ${verifyUrl}`);
  res.json({ message: "Verification link sent" });
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(userId, { isVerified: true });
    res.send("Email verified successfully");
  } catch {
    res.status(400).send("Invalid or expired token");
  }
};



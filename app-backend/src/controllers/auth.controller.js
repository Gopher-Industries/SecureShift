import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Employer from "../models/Employer.js";
import { sendEmployerCredentials } from "../utils/sendEmail.js";
import { sendOTP } from "../utils/sendEmail.js";
import { ACTIONS } from "../middleware/logger.js";
import EOI from "../models/eoi.js";

import Guard from "../models/Guard.js"; // use the discriminator so license fields persist

// ---------- Helpers ----------
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
};

// @desc Register a new user (Employer, Admin)
// @route POST /api/v1/auth/register
export const register = async (req, res) => {
  const { name, email, password, role, phone, address, ABN } = req.body;

  // ban roles other than employer for this endpoint; guards must use /auth/register/guard
  const allowedRoles = ["employer"];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({
      message:
        "Invalid role. Only employer registration is allowed via this endpoint.",
    });
  }

  try {
    // Guards must use the dedicated /auth/register/guard route
    if (role === "guard") {
      return res.status(400).json({
        message:
          "Guards must register using /auth/register/guard with a license upload.",
      });
    }

    // Unique email check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    let newUser;
    if (role === "employer") {
      if (!ABN) {
        return res
          .status(400)
          .json({ message: "ABN is required for employers" });
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
    await req.audit.log(newUser._id, ACTIONS.PROFILE_CREATED, {
      registered: true,
    });

    res.status(201).json({ message: "User registered successfully" });
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
      return res.status(400).json({
        message: 'License image is required (form-data field: "license").',
      });
    }

    // Validate file type and protect against malicious uploads
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!allowedImageTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Only JPEG, PNG, WEBP, and HEIC images are allowed.",
      });
    }

    const { name, email, password } = req.body;

    // Basic presence checks
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    // Uniqueness check
    const existing = await Guard.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Build license URL from saved file (served via /uploads)
    const imageUrl = `/uploads/${req.file.filename}`;

    // Create Guard (license starts as pending)
    const guard = await Guard.create({
      name,
      email,
      password,
      role: "guard",
      license: {
        imageUrl,
        status: "pending",
        verifiedAt: null,
        verifiedBy: null,
        rejectionReason: null,
      },
    });

    // Hide password in response
    const { password: _pw, ...safe } = guard.toObject();

    return res.status(201).json({
      message: "Guard registered successfully. License submitted for review.",
      user: safe,
    });
  } catch (err) {
    // Handle a common case where address might be stringified JSON but invalid
    if (err instanceof SyntaxError && err.message?.includes("address")) {
      return res.status(400).json({ message: "Invalid address JSON format." });
    }
    return res.status(500).json({ message: err.message });
  }
};

// @desc Step 1: Login and trigger OTP
// @route POST /api/v1/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.role === "admin") {
      return res
        .status(403)
        .json({ message: "Admins must use a different login method" });
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiresAt = expiry;
    await user.save();

    // let emailSent = false;

    try {
      await sendOTP(user.email, otp, user.name);
      // emailSent = true;
    } catch (err) {
      console.error("OTP email failed:", err.message);
    }

    await req.audit.log(user._id, ACTIONS.LOGIN_SUCCESS, { step: "OTP_SENT" });

    // if (emailSent) {
    //   return res.status(200).json({ message: 'OTP sent to your email' });
    // }

    // Log the OTP in development for testing purposes

    return res.status(200).json({
      message: "OTP sent to your email",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// protect against brute-force OTP attempts
const MAX_OTP_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

// @desc Step 2: Verify OTP and return JWT
// @route POST /api/v1/auth/verify-otp
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email }).select("+otp +otpExpiresAt");
    if (!user) return res.status(401).json({ message: "Invalid email or OTP" });

    // Check if user is currently locked out due to too many failed attempts
    if (user.otpLockedUntil && new Date() < user.otpLockedUntil) {
      const remaining = Math.ceil((user.otpLockedUntil - new Date()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${remaining} minutes.`,
      });
    }

    const now = new Date();
    // Reset failed attempts on successful OTP verification
    if (user.otp !== otp || now > user.otpExpiresAt) {
      user.otpFailedAttempts = (user.otpFailedAttempts || 0) + 1;

      // Lock account if max attempts reached
      if (user.otpFailedAttempts >= MAX_OTP_ATTEMPTS) {
        user.otpLockedUntil = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
        );
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();
        return res.status(429).json({
          message: `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`,
        });
      }

      await user.save();
      return res.status(401).json({ message: "Invalid or expired OTP" });
    }

    // Successful OTP verification and reset failed attempts
    user.otpFailedAttempts = 0;
    user.otpLockedUntil = null;

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);
    await req.audit.log(user._id, ACTIONS.LOGIN_SUCCESS, {
      step: "OTP_VERIFIED",
    });

    res.status(200).json({
      accessToken,
      refreshToken,
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
  // add validation for ABN Australian Business Number to ensure it's 11 digits and passes the checksum
  const validateABN = (abn) => {
    if (!/^\d{11}$/.test(abn)) return false;
    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const digits = abn.split("").map(Number);
    digits[0] -= 1;
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += digits[i] * weights[i];
    return sum % 89 === 0;
  };

  if (eoiData.abnAcn && !validateABN(eoiData.abnAcn)) {
    throw new Error("Invalid ABN provided.");
  }

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
    const isValidABN = abnAcn && validateABN(abnAcn);
    const baseUserData = {
      name: contactPerson || companyName || "Employer",
      email,
      password: tempPassword,
      role: "employer",
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
      await sendEmployerCredentials(
        email,
        tempPassword,
        contactPerson,
        companyName,
      );
      credentialsEmailSent = true;
    } catch (err) {
      // Log and continue; EOI still created
      console.error("Failed to send employer credentials:", err.message);
    }
  } else {
    console.warn(
      `submitEOI: User with email ${email} already exists; skipping account creation and credential email.`,
    );
  }

  // Return EOI and status flags
  return { eoi: newEOI, employerCreated, credentialsEmailSent };
};

// Local helper to ensure password meets validation rules
const generateStrongTempPassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()-_=+[]{};:,.?";
  const all = upper + lower + digits + special;

  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(special)];

  const length = 12;
  const remaining = Array.from({ length: length - required.length }, () =>
    pick(all),
  );
  const passwordChars = required.concat(remaining);

  // Shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  return passwordChars.join("");
};

// added refresh token endpoint to allow clients to get a new access token without re-login
// @desc Refresh access token using refresh token
// @route POST /api/v1/auth/refresh-token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    user.refreshTokenUsed = true;
    await user.save();

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

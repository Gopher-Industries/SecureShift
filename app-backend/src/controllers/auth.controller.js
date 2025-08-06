import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// @desc Register a new user (Guard, Employer, Admin)
// @route POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  try {
    // Check for duplicate
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = new User({ name, email, password, role, phone, address });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Login and get JWT token
// @route POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Include password explicitly
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

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

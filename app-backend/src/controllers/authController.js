import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Constants
const DEFAULT_ROLE = 'user';

// Helper Functions
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const handleValidationError = (error) => {
  if (error.name === 'ValidationError') {
    return {
      status: 400,
      message: 'Validation error',
      errors: Object.values(error.errors).map(e => e.message)
    };
  }
  return null;
};

const sanitizeUser = (user) => {
  // Remove password from user object
  const userObject = user.toObject ? user.toObject() : user;
  delete userObject.password;
  return userObject;
};

// Controller Functions
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, role = DEFAULT_ROLE } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const conflictField = existingUser.email === email ? 'Email' : 'Username';
      const conflictMessage = existingUser.email === email ? 'Email already registered' : 'Username already taken';
      
      return res.status(400).json({ 
        message: conflictMessage,
        field: conflictField.toLowerCase()
      });
    }

    // Create new user
    const user = new User({ username, email, password, role });
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Sanitize user data for response
    const sanitizedUser = sanitizeUser(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    const validationError = handleValidationError(error);
    if (validationError) {
      return res.status(validationError.status).json(validationError);
    }
    
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message 
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Update last login timestamp (optional)
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Sanitize user data for response
    const sanitizedUser = sanitizeUser(user);

    res.json({
      message: 'Login successful',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Login failed', 
      error: error.message 
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const sanitizedUser = sanitizeUser(req.user);
    
    res.json({ 
      user: sanitizedUser 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get user profile', 
      error: error.message 
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const { _id, role } = req.user;

    // Generate new token with fresh expiration
    const token = generateToken(_id, role);

    res.json({
      message: 'Token refreshed successfully',
      token,
      expiresIn: process.env.JWT_EXPIRES_IN
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Token refresh failed', 
      error: error.message 
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // Note: With JWT, logout is typically handled client-side by removing the token
    // For server-side logout, you would need to implement a token blacklist
    
    res.json({
      message: 'Logout successful. Please remove the token from client storage.'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Logout failed', 
      error: error.message 
    });
  }
};

export const validateToken = async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const sanitizedUser = sanitizeUser(req.user);
    
    res.json({
      valid: true,
      user: sanitizedUser,
      message: 'Token is valid'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Token validation failed', 
      error: error.message 
    });
  }
};
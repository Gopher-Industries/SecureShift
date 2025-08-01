import User from '../models/User.js';

// Constants
const VALID_ROLES = ['user', 'admin', 'moderator'];
const VALID_SORT_FIELDS = ['username', 'email', 'role', 'createdAt', 'updatedAt'];
const SORT_ORDERS = ['asc', 'desc'];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';

// Helper Functions
const validateObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const buildUserFilter = ({ role, isActive, search }) => {
  const filter = {};
  
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  return filter;
};

const buildSortObject = (sortBy = DEFAULT_SORT_BY, sortOrder = DEFAULT_SORT_ORDER) => {
  const validSortBy = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : DEFAULT_SORT_BY;
  const validSortOrder = SORT_ORDERS.includes(sortOrder) ? sortOrder : DEFAULT_SORT_ORDER;
  
  return { [validSortBy]: validSortOrder === 'asc' ? 1 : -1 };
};

const validatePagination = (page, limit) => {
  const pageNum = Math.max(DEFAULT_PAGE, parseInt(page) || DEFAULT_PAGE);
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit) || DEFAULT_LIMIT));
  const skip = (pageNum - 1) * limitNum;
  
  return { pageNum, limitNum, skip };
};

const handleCastError = (error) => {
  if (error.name === 'CastError') {
    return { status: 400, message: 'Invalid user ID format' };
  }
  return null;
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

// Controller Functions
export const getUsersList = async (req, res) => {
  try {
    const { page, limit, role, isActive, search, sortBy, sortOrder } = req.query;

    // Build filter and sort objects
    const filter = buildUserFilter({ role, isActive, search });
    const sort = buildSortObject(sortBy, sortOrder);
    const { pageNum, limitNum, skip } = validatePagination(page, limit);

    // Execute queries in parallel
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalUsers / limitNum);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalUsers,
        pages: totalPages
      },
      filters: {
        role: role || null,
        isActive: isActive !== undefined ? isActive === 'true' : null,
        search: search || null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve users', 
      error: error.message 
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    const castError = handleCastError(error);
    if (castError) {
      return res.status(castError.status).json({ message: castError.message });
    }
    
    res.status(500).json({ 
      message: 'Failed to retrieve user', 
      error: error.message 
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id: userId } = req.params;

    // Validate role
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      });
    }

    // Prevent admin from changing their own role
    if (userId === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    const castError = handleCastError(error);
    if (castError) {
      return res.status(castError.status).json({ message: castError.message });
    }

    const validationError = handleValidationError(error);
    if (validationError) {
      return res.status(validationError.status).json(validationError);
    }

    res.status(500).json({ 
      message: 'Failed to update user role', 
      error: error.message 
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot change your own account status' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User account ${user.isActive ? 'activated' : 'deactivated'}`,
      user
    });
  } catch (error) {
    const castError = handleCastError(error);
    if (castError) {
      return res.status(castError.status).json({ message: castError.message });
    }
    
    res.status(500).json({ 
      message: 'Failed to update user status', 
      error: error.message 
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: user
    });
  } catch (error) {
    const castError = handleCastError(error);
    if (castError) {
      return res.status(castError.status).json({ message: castError.message });
    }
    
    res.status(500).json({ 
      message: 'Failed to delete user', 
      error: error.message 
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Execute all queries in parallel for better performance
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentRegistrations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    // Initialize role statistics with default values
    const roleStats = VALID_ROLES.reduce((acc, role) => {
      acc[role] = 0;
      return acc;
    }, {});

    // Populate role statistics from aggregation results
    usersByRole.forEach(item => {
      if (VALID_ROLES.includes(item._id)) {
        roleStats[item._id] = item.count;
      }
    });

    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: roleStats,
      recentRegistrations
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to retrieve statistics', 
      error: error.message 
    });
  }
};
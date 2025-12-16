import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Branch from './Branch.js';

// Define the base user schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      validate: {
        validator: function (value) {
          return /^[A-Za-z\s'-]+$/.test(value);
        },
        message: "Name can only contain letters, spaces, hyphens (-), and apostrophes (').",
      },
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return /^\S+@\S+\.\S+$/.test(value);
        },
        message: 'Please enter a valid email address.',
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/.test(value);
        },
        message:
          'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      },
    },

    role: {
      type: String,
      required: true,
      enum: ['client','guard','employer','admin','branch_admin','super_admin'],
    },

    /**
     * Optional branch association:
     * - Branch Admin: must be associated with a branch
     * - Guards/Clients/Employers: may be associated with a branch depending on business rules
     */
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
      index: true,
    },

    phone: {
      type: String,
      validate: {
        validator: function (value) {
          return /^(\+?\d{8,15})?$/.test(value);
        },
        message: 'Phone number must be between 8 to 15 digits and can optionally start with +',
      },
    },
    
    address: {
      street: { type: String, trim: true },
      suburb: { type: String, trim: true },
      state: { type: String, trim: true },
      postcode: {
        type: String,
        validate: {
          validator: function (value) {
            return /^\d{4}$/.test(value); // Australian postcode exactly 4 digits
          },
          message: 'Postcode must be a 4-digit number.',
        }
      }
    },
    
    otp: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // soft delete fields
    isDeleted: { type: Boolean, default: false, index: true }, // marks user as deactivated
    deletedAt: { type: Date, default: null }, // when it was deactivated
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // who did it
    deleteReason: { type: String, default: null }, // optional reason
  },
  {
    timestamps: true,
    discriminatorKey: 'role', // Extend this schema for Guard, Employer, Admin
  }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt); 
    next();
  } catch (err) {
    next(err); 
  }
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Convenience role checks
userSchema.methods.isSuperAdmin = function () {
  return this.role === 'super_admin';
};
userSchema.methods.isBranchAdmin = function () {
  return this.role === 'branch_admin';
};

const User = mongoose.model('User', userSchema);
export default User;

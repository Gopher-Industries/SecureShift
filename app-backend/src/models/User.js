import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
      enum: ['guard', 'employer', 'admin'],
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

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'role', // Extend this schema for Guard, Employer, Admin
  }
);

// Hash password
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
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
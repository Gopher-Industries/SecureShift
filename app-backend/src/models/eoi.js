import mongoose from 'mongoose';

const eoiSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    abnAcn: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (value) => /^\S+@\S+\.\S+$/.test(value),
        message: 'Invalid email format',
      },
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (value) => /^(\+?\d{8,15})$/.test(value),
        message: 'Phone number must be 8–15 digits, optionally starting with +',
      },
    },
    description: {
      type: String,
      required: true,
    },
    documents: [
      {
        fileName: String,
        filePath: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const EOI = mongoose.model('EOI', eoiSchema);
export default EOI;

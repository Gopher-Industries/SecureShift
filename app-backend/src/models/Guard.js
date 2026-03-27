import mongoose from 'mongoose';
import User from './User.js'; // Import the base User model

// Additional fields for the 'guard' role
const guardSchema = new mongoose.Schema(
    {
        license: {
            imageUrl: { type: String, default: null },  // single image
            status: { type: String, enum: ['none','pending','verified','rejected'], default: 'none' },
            reviewedAt: { type: Date, default: null }, 
            verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            rejectionReason: { type: String, default: null },
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        numberOfReviews: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
);

const Guard = User.discriminator('guard', guardSchema);
export default Guard;
import mongoose from 'mongoose';

export const DocumentSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['license', 'id_card', 'passport', 'firstAid', 'certificate', 'rsa', 'other'],
            default: 'license'
        },
        status: {
            type: String, 
            enum: ['pending', 'verified', 'rejected', 'none'],
            default: 'none'
        },
        imageUrl: { type: String, default: null },
        expiryDate: { type: Date, default: null },
        reviewedAt: { type: Date, default: null },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        rejectionReason: { type: String, default: null },
        submittedAt: { type: Date, default: Date.now },
    },
    { _id: true }
);
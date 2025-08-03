import mongoose from 'mongoose';
import User from './User.js'; // Import the base User model

// Additional fields for the 'employer' role
const employerSchema = new mongoose.Schema(
    {
        ABN: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (value) {
                return /^\d{11}$/.test(value);// Australian ABN is 11 digits
            },
            message: 'ABN must be exactly 11 digits.',
        },
        },
    },
    {
        timestamps: true,
    }
);

const Employer = User.discriminator('employer', employerSchema);
export default Employer;
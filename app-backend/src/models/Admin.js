import mongoose from 'mongoose';
import User from './User.js'; // Import the base User model

const adminSchema = new mongoose.Schema({}, { timestamps: true });

const Admin = User.discriminator('admin', adminSchema);
export default Admin;
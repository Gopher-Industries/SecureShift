const mongoose = require('mongoose');
const User = require('./User'); // Import the base User model

const adminSchema = new mongoose.Schema({}, { timestamps: true });

const Admin = User.discriminator('admin', adminSchema);
module.exports = Admin;
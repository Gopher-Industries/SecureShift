// toProveProblem/reproduce-stale-role.js
// using for reproducing the issue where a user's role is changed in the database but the JWT still contains the old role
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function reproduceStaleRole() {
  await mongoose.connect(process.env.MONGO_URI);

  // 1. create admin user
  const user = await User.create({
    name: 'Admin User',
    email: 'admin.stale@example.com',
    password: 'Password1!',
    role: 'admin',
  });
  console.log(`GOOD: Created user: ${user._id}, role: ${user.role}`);

  // 2. generate JWT (at this point, role = admin)
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log(`GOOD: Generated JWT, role = admin`);

  // 3. simulate auth middleware (old implementation)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(`NOTE: Role read by auth middleware: ${decoded.role}`);

  // 4. change role to employer
  await User.findByIdAndUpdate(user._id, { role: 'employer' });
  console.log(`NOTE: Database role has been changed to: employer`);

  // 5. again simulate auth middleware (old implementation still reads from JWT)
  const decodedAgain = jwt.verify(token, process.env.JWT_SECRET);
  console.log(`NOTE: auth middleware still reads role from JWT: ${decodedAgain.role}`);
  console.log(`ERROR Issue: Database role has been changed to employer, but auth middleware still uses admin from JWT`);

  // 6. cleanup
  await User.deleteOne({ _id: user._id });
  await mongoose.disconnect();
}

reproduceStaleRole().catch(console.error);
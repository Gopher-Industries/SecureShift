// toProveProblem/reproduce-deleted-user.js
// using for reproducing the issue where a deleted user can still authenticate with a valid JWT
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function reproduce() {
  await mongoose.connect(process.env.MONGO_URI);

  // 1. create a new user
  const user = await User.create({
    name: 'Security Test User',
    email: 'security.test@example.com',
    password: 'Password1!',
    role: 'admin',
  });
  console.log(`GOOD: Created user: ${user._id}, role: ${user.role}`);

  // 2. generate JWT
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log(`GOOD: Generated JWT: ${token.substring(0, 30)}...`);

  // 3. simulate auth middleware behavior (old implementation)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log(`NOTE: Role in JWT: ${decoded.role}`);

  // 4. soft delete the user
  await User.findByIdAndUpdate(user._id, { isDeleted: true });
  console.log(`NOTE: User has been soft deleted: isDeleted = true`);

  // 5. again validate token (simulate auth middleware)
  try {
    const decodedAgain = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`NOTE: JWT is still valid, role: ${decodedAgain.role}`);
    console.log(`ERROR Issue: User has been deleted but auth middleware still accepts the token!`);
  } catch (err) {
    console.log(`GOOD: JWT has expired (expected)`);
  }
  

  // 6. cleanup
  await User.deleteOne({ _id: user._id });
  await mongoose.disconnect();
}

reproduce().catch(console.error);
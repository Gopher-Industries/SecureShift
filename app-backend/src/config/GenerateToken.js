import jwt from 'jsonwebtoken';

const payload = {
  userId: '688b85c9ee366613321aa21c', 
  email: 'john@example.com',
  role: 'guard'
};

const secret = 'test_secret'; 
const token = jwt.sign(payload, secret, { expiresIn: '15h' });

console.log('Test JWT Token:', token);

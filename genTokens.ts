import jwt from 'jsonwebtoken';

const SECRET = 'cinestream_secret_dev';

const userToken = jwt.sign(
  { user_id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'user@test.com', role: 'user' },
  SECRET,
  { expiresIn: '7d' }
);

const adminToken = jwt.sign(
  { user_id: 'bbbbbbbb-0000-0000-0000-000000000002', email: 'admin@test.com', role: 'admin' },
  SECRET,
  { expiresIn: '7d' }
);

console.log('\n👤 USER TOKEN:\n', userToken);
console.log('\n🔑 ADMIN TOKEN:\n', adminToken, '\n');

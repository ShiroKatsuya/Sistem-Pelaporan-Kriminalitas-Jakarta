require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
};


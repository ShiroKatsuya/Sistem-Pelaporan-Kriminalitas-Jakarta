const rateLimit = require('express-rate-limit');

// Rate limiter for report submission (3 reports per hour per IP)
const reportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    error: 'Terlalu banyak laporan. Silakan coba lagi dalam 1 jam.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for admin login (5 attempts per 15 minutes)
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  reportRateLimiter,
  loginRateLimiter,
};


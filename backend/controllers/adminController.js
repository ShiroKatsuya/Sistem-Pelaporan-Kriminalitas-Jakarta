const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');
const Joi = require('joi');

// Validation schema for login
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

// Admin login
const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, password } = value;

    // Find admin by username
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Verify password
    const isValidPassword = await Admin.verifyPassword(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Login berhasil',
      token: token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Gagal melakukan login' });
  }
};

module.exports = {
  login,
};


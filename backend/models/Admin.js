const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class Admin {
  // Find admin by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM admins WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Create admin (for initial setup)
  static async create(username, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO admins (username, password_hash)
      VALUES ($1, $2)
      RETURNING id, username, created_at
    `;
    const result = await pool.query(query, [username, passwordHash]);
    return result.rows[0];
  }
}

module.exports = Admin;


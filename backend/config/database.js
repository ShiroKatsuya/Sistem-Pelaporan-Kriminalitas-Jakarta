const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crime_reporting_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test connection function
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0].now);
    
    // Check if PostGIS is enabled
    const postgisCheck = await pool.query('SELECT PostGIS_version()');
    console.log('PostGIS version:', postgisCheck.rows[0].postgis_version);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
};

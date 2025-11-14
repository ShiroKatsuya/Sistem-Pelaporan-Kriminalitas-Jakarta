const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection, pool } = require('./config/database');
const reportsRoutes = require('./routes/reports');
const zonesRoutes = require('./routes/zones');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// Routes
app.use('/api/reports', reportsRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Terjadi kesalahan pada server',
  });
});

// Initialize database schema if tables don't exist
const initializeDatabase = async () => {
  try {
    // Check if reports table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reports'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Database tables not found. Initializing schema...');
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split SQL statements while handling $$ delimiters in functions
      const statements = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarTag = '';
      
      const lines = schema.split('\n');
      
      for (const line of lines) {
        // Skip comment-only lines
        if (line.trim().startsWith('--') && !inDollarQuote) {
          continue;
        }
        
        currentStatement += line + '\n';
        
        // Check for dollar quote start/end
        const dollarQuoteMatch = line.match(/\$([^$]*)\$/g);
        if (dollarQuoteMatch) {
          for (const match of dollarQuoteMatch) {
            if (!inDollarQuote) {
              inDollarQuote = true;
              dollarTag = match;
            } else if (match === dollarTag) {
              inDollarQuote = false;
              dollarTag = '';
            }
          }
        }
        
        // If we're not in a dollar quote and line ends with semicolon, it's a complete statement
        if (!inDollarQuote && line.trim().endsWith(';')) {
          const trimmed = currentStatement.trim();
          if (trimmed && trimmed !== ';') {
            statements.push(trimmed);
          }
          currentStatement = '';
        }
      }
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          await pool.query(statement);
        }
      }
      
      console.log('Database schema initialized successfully!');
    } else {
      console.log('Database tables already exist.');
    }
  } catch (error) {
    console.error('Error initializing database:', error.message);
    throw error;
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize database schema if needed
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;


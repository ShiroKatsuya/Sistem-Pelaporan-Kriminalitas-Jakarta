const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  try {
    console.log('Initializing database schema...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
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
    
    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('Created tables:', tablesCheck.rows.map(r => r.table_name).join(', '));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();


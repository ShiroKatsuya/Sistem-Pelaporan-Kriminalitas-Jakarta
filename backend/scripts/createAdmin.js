const Admin = require('../models/Admin');
const { testConnection } = require('../config/database');

async function createAdmin() {
  try {
    await testConnection();
    
    const username = process.argv[2] || 'admin';
    const password = process.argv[3] || 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findByUsername(username);
    if (existingAdmin) {
      console.log(`Admin dengan username "${username}" sudah ada.`);
      process.exit(0);
    }
    
    // Create admin
    const admin = await Admin.create(username, password);
    console.log(`Admin berhasil dibuat:`);
    console.log(`Username: ${admin.username}`);
    console.log(`Password: ${password}`);
    console.log(`\nHarap simpan password ini dengan aman!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();


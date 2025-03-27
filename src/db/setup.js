/**
 * Database setup and migration handling
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.solo-os', 'solo-os.db');

// Ensure directory exists
function ensureDbDirectory() {
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Initialize the database schema
function initializeSchema(db) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      is_admin INTEGER DEFAULT 0
    );
  `);

  // Profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      bio TEXT,
      contact TEXT,
      status TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'post', -- post, announce, status
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Guestbook entries
  db.exec(`
    CREATE TABLE IF NOT EXISTS guestbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Weekly accountability posts
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      last_week TEXT NOT NULL,
      next_week TEXT NOT NULL,
      wins TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, week_number)
    );
  `);

  // Custom commands
  db.exec(`
    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      implementation TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Files
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT NOT NULL,
      description TEXT,
      path TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  console.log('Database schema initialized.');
}

// Create admin user if none exists
function createAdminIfNeeded(db) {
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get();
  
  if (adminExists.count === 0) {
    // In a real application, we would generate a secure password and prompt the user
    // For demo purposes, we'll use a default admin/admin
    const { createUser } = require('../models/user');
    createUser(db, 'admin', 'admin', true);
    console.log('Created default admin user (username: admin, password: admin)');
  }
}

// Setup the database
async function setupDatabase() {
  try {
    ensureDbDirectory();
    const db = new Database(DB_PATH);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Initialize schema
    initializeSchema(db);
    
    // Create admin user if needed
    createAdminIfNeeded(db);
    
    // Make the database connection available globally
    global.db = db;
    
    return db;
  } catch (err) {
    console.error('Database setup failed:', err);
    throw err;
  }
}

module.exports = {
  setupDatabase,
  getDb: () => global.db
};
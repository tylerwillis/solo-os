/**
 * User model for authentication and profile management
 */

const crypto = require('crypto');

// Simple password hashing (in production, use bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Create a new user
function createUser(db, username, password, isAdmin = false) {
  const passwordHash = hashPassword(password);
  
  try {
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, is_admin)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(username, passwordHash, isAdmin ? 1 : 0);
    
    // Create empty profile
    if (result.lastInsertRowid) {
      const profileStmt = db.prepare(`
        INSERT INTO profiles (user_id, bio, contact, status)
        VALUES (?, ?, ?, ?)
      `);
      profileStmt.run(result.lastInsertRowid, '', '', '');
    }
    
    return result.lastInsertRowid;
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`User ${username} already exists`);
    }
    throw err;
  }
}

// Get user by ID
function getUserById(db, id) {
  const user = db.prepare(`
    SELECT u.id, u.username, u.created_at, u.last_login, u.is_admin,
           p.bio, p.contact, p.status
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `).get(id);
  
  return user;
}

// Get user by username
function getUserByUsername(db, username) {
  const user = db.prepare(`
    SELECT u.id, u.username, u.password_hash, u.created_at, u.last_login, u.is_admin,
           p.bio, p.contact, p.status
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.username = ?
  `).get(username);
  
  return user;
}

// Authenticate user
function authenticateUser(db, username, password) {
  const user = getUserByUsername(db, username);
  
  if (!user) {
    return null;
  }
  
  if (user.password_hash === hashPassword(password)) {
    // Update last login time
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    
    // Don't return password hash to caller
    delete user.password_hash;
    return user;
  }
  
  return null;
}

// Update user profile
function updateProfile(db, userId, bio, contact, status) {
  const stmt = db.prepare(`
    UPDATE profiles
    SET bio = ?, contact = ?, status = ?
    WHERE user_id = ?
  `);
  
  return stmt.run(bio, contact, status, userId);
}

// Update user status
function updateStatus(db, userId, status) {
  const stmt = db.prepare(`
    UPDATE profiles
    SET status = ?
    WHERE user_id = ?
  `);
  
  return stmt.run(status, userId);
}

// List all users
function listUsers(db) {
  return db.prepare(`
    SELECT u.id, u.username, u.created_at, u.last_login, u.is_admin,
           p.bio, p.contact, p.status
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    ORDER BY u.username
  `).all();
}

module.exports = {
  createUser,
  getUserById,
  getUserByUsername,
  authenticateUser,
  updateProfile,
  updateStatus,
  listUsers
};
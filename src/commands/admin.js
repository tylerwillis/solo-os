/**
 * Admin command - manage user roles and permissions
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getUserByUsername } = require('../models/user');
const { getDb } = require('../db/setup');

/**
 * Promote a user to admin status
 */
function promoteUser(db, userId) {
  const stmt = db.prepare(`
    UPDATE users 
    SET is_admin = 1
    WHERE id = ?
  `);
  
  return stmt.run(userId);
}

/**
 * Demote a user from admin status
 */
function demoteUser(db, userId) {
  const stmt = db.prepare(`
    UPDATE users 
    SET is_admin = 0
    WHERE id = ?
  `);
  
  return stmt.run(userId);
}

/**
 * List all users with their admin status
 */
function listUsers(db) {
  return db.prepare(`
    SELECT id, username, is_admin, created_at, last_login
    FROM users
    ORDER BY username
  `).all();
}

/**
 * Admin command handler
 */
function adminHandler(args, context) {
  // Require admin privileges
  if (!context.user || !context.user.is_admin) {
    return theme.error('This command requires admin privileges.');
  }

  const db = getDb();
  
  // No arguments - show admin help
  if (args.length === 0) {
    return theme.error('Usage: admin promote <username> | admin demote <username> | admin list');
  }
  
  const action = args[0].toLowerCase();
  
  // List all users with their admin status
  if (action === 'list') {
    const users = listUsers(db);
    
    let output = theme.primary('User List') + '\\n\\n';
    
    for (const user of users) {
      const status = user.is_admin ? theme.accent('(Admin)') : '';
      output += theme.highlight(user.username) + ' ' + status + '\\n';
      output += theme.dim(`Created: ${new Date(user.created_at).toLocaleString()}`);
      
      if (user.last_login) {
        output += theme.dim(` | Last login: ${new Date(user.last_login).toLocaleString()}`);
      }
      
      output += '\\n\\n';
    }
    
    return output;
  }
  
  // Promote a user to admin
  if (action === 'promote' && args.length > 1) {
    const targetUsername = args[1];
    const user = getUserByUsername(db, targetUsername);
    
    if (!user) {
      return theme.error(`User '${targetUsername}' not found`);
    }
    
    if (user.is_admin) {
      return theme.warning(`User '${targetUsername}' is already an admin`);
    }
    
    promoteUser(db, user.id);
    return theme.success(`User '${targetUsername}' has been promoted to admin status`);
  }
  
  // Demote a user from admin
  if (action === 'demote' && args.length > 1) {
    const targetUsername = args[1];
    const user = getUserByUsername(db, targetUsername);
    
    if (!user) {
      return theme.error(`User '${targetUsername}' not found`);
    }
    
    if (!user.is_admin) {
      return theme.warning(`User '${targetUsername}' is not an admin`);
    }
    
    // Prevent user from demoting themselves if they're the only admin
    if (user.id === context.user.id) {
      const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get();
      
      if (adminCount.count <= 1) {
        return theme.error('Cannot demote the last admin user');
      }
    }
    
    demoteUser(db, user.id);
    return theme.success(`User '${targetUsername}' has been demoted from admin status`);
  }
  
  return theme.error('Invalid admin command. Use: admin promote <username> | admin demote <username> | admin list');
}

function register() {
  registerCommand('admin', {
    description: 'Manage user roles and permissions',
    usage: 'admin promote <username> | admin demote <username> | admin list',
    adminOnly: true,
    handler: adminHandler
  });
}

module.exports = {
  register
};
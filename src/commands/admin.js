/**
 * Admin commands - user management and system administration
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getUserByUsername, listUsers } = require('../models/user');
const { getDb } = require('../db/setup');

function listUsersHandler(args, context) {
  // No login required - anyone can see user list
  try {
    const db = getDb();
    const users = listUsers(db);
    
    let output = theme.primary('All Users') + '\n\n';
    output += theme.secondary('Total users: ') + users.length + '\n\n';
    
    for (const user of users) {
      const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
      const created = new Date(user.created_at).toLocaleString();
      
      // If it's the current user, highlight them
      const isCurrentUser = context.user && user.id === context.user.id;
      if (isCurrentUser) {
        output += theme.primary('→ ');
      } else {
        output += '  ';
      }
      
      output += theme.highlight(user.username) + 
                (user.is_admin ? theme.accent(' (Admin)') : '') + '\n';
      
      // Show full details for admins, less details for regular users
      if (context.user && context.user.is_admin) {
        output += theme.dim(`  ID: ${user.id} | Created: ${created} | Last login: ${lastLogin}`) + '\n';
      } else {
        output += theme.dim(`  Created: ${created}`) + '\n';
      }
      
      if (user.status) {
        output += theme.info('  Status: ') + user.status + '\n';
      }
      
      output += '\n';
    }
    
    return output;
  } catch (error) {
    return theme.error(`Failed to list users: ${error.message}`);
  }
}

function promoteUserHandler(args, context) {
  // Require admin privileges
  if (!context.user || !context.user.is_admin) {
    return theme.error('This command requires admin privileges.');
  }
  
  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: promote <username>');
  }
  
  const username = args[0];
  
  try {
    const db = getDb();
    const user = getUserByUsername(db, username);
    
    if (!user) {
      return theme.error(`User '${username}' not found.`);
    }
    
    if (user.is_admin) {
      return theme.warning(`User '${username}' is already an admin.`);
    }
    
    // Promote the user
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(user.id);
    
    return theme.success(`User '${username}' has been promoted to admin.`);
  } catch (error) {
    return theme.error(`Failed to promote user: ${error.message}`);
  }
}

function demoteUserHandler(args, context) {
  // Require admin privileges
  if (!context.user || !context.user.is_admin) {
    return theme.error('This command requires admin privileges.');
  }
  
  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: demote <username>');
  }
  
  const username = args[0];
  
  // Don't allow self-demotion
  if (username === context.user.username) {
    return theme.error('You cannot demote yourself.');
  }
  
  try {
    const db = getDb();
    const user = getUserByUsername(db, username);
    
    if (!user) {
      return theme.error(`User '${username}' not found.`);
    }
    
    if (!user.is_admin) {
      return theme.warning(`User '${username}' is not an admin.`);
    }
    
    // Demote the user
    db.prepare('UPDATE users SET is_admin = 0 WHERE id = ?').run(user.id);
    
    return theme.success(`User '${username}' has been demoted from admin.`);
  } catch (error) {
    return theme.error(`Failed to demote user: ${error.message}`);
  }
}

function register() {
  registerCommand('promote', {
    description: 'Promote a user to admin',
    usage: 'promote <username>',
    handler: promoteUserHandler,
    adminOnly: true
  });
  
  registerCommand('demote', {
    description: 'Demote a user from admin',
    usage: 'demote <username>',
    handler: demoteUserHandler,
    adminOnly: true
  });
  
  registerCommand('users', {
    description: 'List all users in the system',
    usage: 'users',
    aliases: ['list-users', 'who'],
    handler: listUsersHandler,
    adminOnly: false
  });
}

module.exports = {
  register
};
/**
 * Admin commands - consolidated admin operations for user and system management
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getUserByUsername, updateProfile } = require('../models/user');
const { getDb } = require('../db/setup');

// Handler for the admin command
function adminHandler(args, context) {
  // Check if user is an admin
  if (!context.user || !context.user.is_admin) {
    return theme.error('This command requires admin privileges.');
  }

  // If no arguments, show usage
  if (args.length === 0) {
    return showAdminUsage();
  }

  const subcommand = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'promote':
      return handlePromoteUser(subArgs, context);
    case 'demote':
      return handleDemoteUser(subArgs, context);
    case 'edit':
      return handleEditUser(subArgs, context);
    default:
      return showAdminUsage();
  }
}

// Show admin usage information
function showAdminUsage() {
  return theme.error(
    'Usage:\n' +
    '  admin promote <username> - Promote user to admin\n' +
    '  admin demote <username> - Demote user from admin\n' +
    '  admin edit <username> <field> <value> - Edit a user\'s profile'
  );
}

// Handle promoting a user to admin
function handlePromoteUser(args, context) {
  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: admin promote <username>');
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

// Handle demoting a user from admin
function handleDemoteUser(args, context) {
  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: admin demote <username>');
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

// Handle editing another user's profile
function handleEditUser(args, context) {
  // Validate arguments
  if (args.length < 3) {
    return theme.error('Usage: admin edit <username> <field> <value>');
  }
  
  const username = args[0];
  const field = args[1].toLowerCase();
  const value = args.slice(2).join(' ');
  
  // Check if field is valid
  if (!['bio', 'contact', 'status'].includes(field)) {
    return theme.error(`Invalid field: ${field}. Use 'bio', 'contact', or 'status'.`);
  }
  
  try {
    const db = getDb();
    const user = getUserByUsername(db, username);
    
    if (!user) {
      return theme.error(`User '${username}' not found.`);
    }
    
    // Update the specified field
    let bio = user.bio || '';
    let contact = user.contact || '';
    let status = user.status || '';
    
    if (field === 'bio') bio = value;
    if (field === 'contact') contact = value;
    if (field === 'status') status = value;
    
    updateProfile(db, user.id, bio, contact, status);
    
    return theme.success(`Updated ${field} for ${username}`);
  } catch (error) {
    return theme.error(`Failed to update user profile: ${error.message}`);
  }
}

function register() {
  // Register the main admin command
  registerCommand('admin', {
    description: 'Administrative functions',
    usage: 'admin promote <username> | admin demote <username> | admin edit <username> <field> <value>',
    aliases: ['a'],
    adminOnly: true,
    handler: adminHandler
  });
  
  // Keep promote command for backward compatibility
  registerCommand('promote', {
    description: 'Promote a user to admin',
    usage: 'promote <username>',
    handler: (args, context) => handlePromoteUser(args, context),
    adminOnly: true
  });
  
  // Keep demote command for backward compatibility
  registerCommand('demote', {
    description: 'Demote a user from admin',
    usage: 'demote <username>',
    handler: (args, context) => handleDemoteUser(args, context),
    adminOnly: true
  });
}

module.exports = {
  register
};
/**
 * Profile command - view and manage user profiles
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getUserByUsername, updateProfile } = require('../models/user');
const { getDb } = require('../db/setup');

function profileHandler(args, context) {
  const db = getDb();
  let targetUsername;
  
  // If no arguments, show current user's profile
  if (args.length === 0) {
    if (!context.user) {
      return theme.error('Not logged in. Please login first or specify a username.');
    }
    targetUsername = context.user.username;
  } else {
    targetUsername = args[0];
  }
  
  // Fetch user profile
  const user = getUserByUsername(db, targetUsername);
  
  if (!user) {
    return theme.error(`User '${targetUsername}' not found`);
  }
  
  // Check for profile edit operations
  if (args.length > 1 && args[1] === 'edit' && context.user && user.id === context.user.id) {
    const field = args[2];
    const value = args.slice(3).join(' ');
    
    if (!field || !value) {
      return theme.error('Usage: profile edit <field> <value>');
    }
    
    if (['bio', 'contact', 'status'].includes(field)) {
      let bio = user.bio || '';
      let contact = user.contact || '';
      let status = user.status || '';
      
      // Update the specified field
      if (field === 'bio') bio = value;
      if (field === 'contact') contact = value;
      if (field === 'status') status = value;
      
      updateProfile(db, user.id, bio, contact, status);
      return theme.success(`Updated ${field} for ${targetUsername}`);
    } else {
      return theme.error(`Invalid field: ${field}. Use 'bio', 'contact', or 'status'.`);
    }
  }
  
  // Otherwise, display the profile
  let output = '';
  
  // Format the profile display
  output += theme.primary(`Profile: ${user.username}`);
  
  if (user.is_admin) {
    output += theme.highlight(' (Administrator)');
  }
  
  output += '\\n\\n';
  
  if (user.status) {
    output += theme.accent(`Status: ${user.status}`) + '\\n\\n';
  }
  
  if (user.bio) {
    output += theme.secondary('Bio:') + '\\n';
    output += user.bio + '\\n\\n';
  } else {
    output += theme.dim('No bio provided') + '\\n\\n';
  }
  
  if (user.contact) {
    output += theme.secondary('Contact:') + '\\n';
    output += user.contact + '\\n\\n';
  }
  
  output += theme.dim(`Member since: ${new Date(user.created_at).toLocaleString()}`);
  
  if (user.last_login) {
    output += '\\n' + theme.dim(`Last login: ${new Date(user.last_login).toLocaleString()}`);
  }
  
  // Show edit instructions if viewing own profile
  if (context.user && user.id === context.user.id) {
    output += '\\n\\n' + theme.info('To edit your profile:') + '\\n';
    output += theme.highlight('profile edit bio <text>') + ' - Update your bio\\n';
    output += theme.highlight('profile edit contact <text>') + ' - Update contact info\\n';
    output += theme.highlight('profile edit status <text>') + ' - Update your status';
  }
  
  return output;
}

function register() {
  registerCommand('profile', {
    description: 'View or edit user profiles',
    usage: 'profile [username] | profile edit <field> <value>',
    aliases: ['pr', 'user'],
    handler: profileHandler
  });
}

module.exports = {
  register
};
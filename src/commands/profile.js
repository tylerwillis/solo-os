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
  let startArgIndex = 0;
  
  // Check if user is logged in
  if (!context.user) {
    if (args.length === 0) {
      return theme.error('Not logged in. Please login first or specify a username.');
    }
    targetUsername = args[0];
    startArgIndex = 1;
  } else {
    // If first arg is 'edit', it's editing own profile
    if (args.length > 0 && args[0] === 'edit') {
      targetUsername = context.user.username;
    } 
    // If admin is trying to edit someone else's profile
    else if (args.length > 1 && context.user.is_admin && args[1] === 'edit') {
      targetUsername = args[0];
      startArgIndex = 1;
    }
    // Default case - viewing profile
    else if (args.length === 0) {
      targetUsername = context.user.username;
    } else {
      targetUsername = args[0];
      startArgIndex = 1;
    }
  }
  
  // Fetch user profile
  const user = getUserByUsername(db, targetUsername);
  
  if (!user) {
    return theme.error(`User '${targetUsername}' not found`);
  }
  
  // Check for profile edit operations
  if (args.length > startArgIndex && args[startArgIndex] === 'edit') {
    // Only allow edit if user is editing their own profile OR is an admin
    if (!context.user) {
      return theme.error('You must be logged in to edit profiles.');
    }
    
    if (user.id !== context.user.id && !context.user.is_admin) {
      return theme.error('You can only edit your own profile.');
    }
    
    const field = args[startArgIndex + 1];
    const value = args.slice(startArgIndex + 2).join(' ');
    
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
  
  // Show edit instructions 
  if (context.user) {
    if (user.id === context.user.id) {
      // Show instructions for own profile
      output += '\\n\\n' + theme.info('To edit your profile:') + '\\n';
      output += theme.highlight('profile edit bio <text>') + ' - Update your bio\\n';
      output += theme.highlight('profile edit contact <text>') + ' - Update contact info\\n';
      output += theme.highlight('profile edit status <text>') + ' - Update your status';
    } else if (context.user.is_admin) {
      // Show admin instructions for other profiles
      output += '\\n\\n' + theme.info('Admin commands for this profile:') + '\\n';
      output += theme.highlight(`profile ${user.username} edit bio <text>`) + ' - Update bio\\n';
      output += theme.highlight(`profile ${user.username} edit contact <text>`) + ' - Update contact info\\n';
      output += theme.highlight(`profile ${user.username} edit status <text>`) + ' - Update status';
    }
  }
  
  return output;
}

function register() {
  registerCommand('profile', {
    description: 'View or edit user profiles',
    usage: 'profile [username] | profile edit <field> <value> | profile <username> edit <field> <value> (admin only)',
    aliases: ['pr', 'user'],
    handler: profileHandler
  });
}

module.exports = {
  register
};
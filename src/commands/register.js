/**
 * Register command - create new user accounts
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { createUser, getUserByUsername } = require('../models/user');
const { getDb } = require('../db/setup');

function registerHandler(args, context) {
  // Check if already logged in
  if (context.user) {
    return theme.warning(`Already logged in as ${context.user.username}. Use 'logout' first.`);
  }

  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: register <username>');
  }

  const username = args[0];
  const password = args.length > 1 ? args[1] : null;
  
  // If no password provided and we're not in cli.js (which handles the password prompt)
  if (!password) {
    return {
      success: false,
      error: 'No password provided'
    };
  }

  try {
    const db = getDb();
    
    // Check if user already exists
    const existingUser = getUserByUsername(db, username);
    if (existingUser) {
      return theme.error(`Username '${username}' is already taken.`);
    }
    
    // Create the user
    createUser(db, username, password, false);
    
    return theme.success(`User '${username}' registered successfully. You can now login.`);
  } catch (error) {
    return theme.error(`Registration failed: ${error.message}`);
  }
}

function register() {
  registerCommand('register', {
    description: 'Create a new user account',
    usage: 'register <username> [password]',
    aliases: ['signup', 'reg'],
    handler: registerHandler
  });
}

module.exports = {
  register
};
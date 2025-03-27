/**
 * Login command - authenticate users
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { authenticateUser } = require('../models/user');
const { getDb } = require('../db/setup');

function loginHandler(args, context) {
  // Check if already logged in
  if (context.user) {
    return theme.warning(`Already logged in as ${context.user.username}. Use 'logout' first.`);
  }

  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: login <username> [password]');
  }

  const username = args[0];
  // In a real application, we would use a secure method to input the password
  // For this demo, we'll allow passing it as an argument or using the username as the password
  const password = args.length > 1 ? args[1] : username;

  try {
    const db = getDb();
    const user = authenticateUser(db, username, password);

    if (user) {
      context.user = user;
      return theme.success(`Successfully logged in as ${username}`);
    } else {
      return theme.error('Invalid username or password');
    }
  } catch (error) {
    return theme.error(`Login failed: ${error.message}`);
  }
}

function logoutHandler(args, context) {
  if (!context.user) {
    return theme.warning('Not currently logged in');
  }

  const username = context.user.username;
  context.user = null;
  return theme.success(`Logged out from ${username}`);
}

function register() {
  registerCommand('login', {
    description: 'Log in to the system',
    usage: 'login <username> [password]',
    aliases: ['l'],
    handler: loginHandler
  });

  registerCommand('logout', {
    description: 'Log out from the system',
    usage: 'logout',
    aliases: ['exit'],
    handler: logoutHandler
  });
}

module.exports = {
  register
};
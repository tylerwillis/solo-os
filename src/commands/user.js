/**
 * User command - consolidated user operations including register, login, profile
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getUserByUsername, createUser, updateProfile, listUsers, authenticateUser } = require('../models/user');
const { getDb } = require('../db/setup');

// Handler for the user command
function userHandler(args, context) {
  // If no arguments, show usage
  if (args.length === 0) {
    return showUserUsage();
  }

  const subcommand = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'register':
      return handleRegister(subArgs, context);
    case 'profile':
    case 'view':
      return handleProfile(subArgs, context);
    case 'edit':
      return handleProfileEdit(subArgs, context);
    case 'list':
      return handleListUsers(subArgs, context);
    default:
      // If first argument is not a subcommand, assume it's a username
      if (args.length === 1) {
        return handleProfile([args[0]], context);
      }
      // Otherwise show usage
      return showUserUsage();
  }
}

// Show usage information
function showUserUsage() {
  return theme.error(
    'Usage:\n' +
    '  user list - List all users\n' +
    '  user profile [username] - View a user\'s profile\n' +
    '  user edit <field> <value> - Edit your profile\n' +
    '  user register <username> - Register a new user'
  );
}

// Handle user registration
function handleRegister(args, context) {
  // Check if already logged in
  if (context.user) {
    return theme.warning(`Already logged in as ${context.user.username}. Use 'logout' first.`);
  }

  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: user register <username>');
  }

  const username = args[0];
  const password = args.length > 1 ? args[1] : null;
  
  // If no password provided, prompt in CLI
  if (!password) {
    return {
      success: false,
      error: 'No password provided'
    };
  }

  try {
    const db = getDb();
    const userId = createUser(db, username, password);
    
    if (userId) {
      // Auto-login after registration
      const user = getUserByUsername(db, username);
      context.user = user;
      return theme.success(`User ${username} registered successfully. You are now logged in.`);
    } else {
      return theme.error('Failed to register user');
    }
  } catch (error) {
    return theme.error(`Registration failed: ${error.message}`);
  }
}

// Handle profile viewing
function handleProfile(args, context) {
  const db = getDb();
  let targetUsername;
  
  // If no username specified, show current user's profile
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
  
  // Display the profile
  let output = '';
  
  // Format the profile display
  output += theme.primary(`Profile: ${user.username}`);
  
  if (user.is_admin) {
    output += theme.highlight(' (Administrator)');
  }
  
  output += '\n\n';
  
  if (user.status) {
    output += theme.accent(`Status: ${user.status}`) + '\n\n';
  }
  
  if (user.bio) {
    output += theme.secondary('Bio:') + '\n';
    output += user.bio + '\n\n';
  } else {
    output += theme.dim('No bio provided') + '\n\n';
  }
  
  if (user.contact) {
    output += theme.secondary('Contact:') + '\n';
    output += user.contact + '\n\n';
  }
  
  output += theme.dim(`Member since: ${new Date(user.created_at).toLocaleString()}`);
  
  if (user.last_login) {
    output += '\n' + theme.dim(`Last login: ${new Date(user.last_login).toLocaleString()}`);
  }
  
  // Show edit instructions 
  if (context.user) {
    if (user.id === context.user.id) {
      // Show instructions for own profile
      output += '\n\n' + theme.info('To edit your profile:') + '\n';
      output += theme.highlight('user edit bio <text>') + ' - Update your bio\n';
      output += theme.highlight('user edit contact <text>') + ' - Update contact info\n';
      output += theme.highlight('user edit status <text>') + ' - Update your status';
    } else if (context.user.is_admin) {
      // Show admin instructions for other profiles
      output += '\n\n' + theme.info('Admin commands for this profile:') + '\n';
      output += theme.highlight(`admin edit ${user.username} bio <text>`) + ' - Update bio\n';
      output += theme.highlight(`admin edit ${user.username} contact <text>`) + ' - Update contact info\n';
      output += theme.highlight(`admin edit ${user.username} status <text>`) + ' - Update status';
    }
  }
  
  return output;
}

// Handle profile editing
function handleProfileEdit(args, context) {
  // Must be logged in to edit profile
  if (!context.user) {
    return theme.error('You must be logged in to edit your profile.');
  }

  // Need field and value
  if (args.length < 2) {
    return theme.error('Usage: user edit <field> <value>');
  }

  const field = args[0].toLowerCase();
  const value = args.slice(1).join(' ');
  const db = getDb();
  const user = context.user;

  if (['bio', 'contact', 'status'].includes(field)) {
    let bio = user.bio || '';
    let contact = user.contact || '';
    let status = user.status || '';
    
    // Update the specified field
    if (field === 'bio') bio = value;
    if (field === 'contact') contact = value;
    if (field === 'status') status = value;
    
    updateProfile(db, user.id, bio, contact, status);
    return theme.success(`Updated ${field} successfully`);
  } else {
    return theme.error(`Invalid field: ${field}. Use 'bio', 'contact', or 'status'.`);
  }
}

// Handle listing users
function handleListUsers(args, context) {
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

// Login handler (moved from login.js)
function loginHandler(args, context) {
  // Check if already logged in
  if (context.user) {
    return theme.warning(`Already logged in as ${context.user.username}. Use 'logout' first.`);
  }

  // Validate arguments
  if (args.length < 1) {
    return theme.error('Usage: login <username>');
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

// Logout handler (moved from login.js)
function logoutHandler(args, context) {
  if (!context.user) {
    return theme.warning('Not currently logged in');
  }

  const username = context.user.username;
  context.user = null;
  return theme.success(`Logged out from ${username}`);
}

function register() {
  // Register the main user command
  registerCommand('user', {
    description: 'View and manage user accounts',
    usage: 'user list | user profile [username] | user edit <field> <value> | user register <username>',
    aliases: ['u'],
    handler: userHandler
  });

  // Keep existing login command for compatibility
  registerCommand('login', {
    description: 'Log in to the system',
    usage: 'login <username> [password]',
    aliases: ['l'],
    handler: loginHandler
  });

  // Keep existing logout command
  registerCommand('logout', {
    description: 'Log out from the system',
    usage: 'logout',
    aliases: [],
    handler: logoutHandler
  });
  
  // Register the users command as an alias to 'user list'
  registerCommand('users', {
    description: 'List all users in the system',
    usage: 'users',
    aliases: ['list-users', 'who'],
    handler: (args, context) => handleListUsers(args, context)
  });
  
  // Register profile as an alias for backward compatibility
  registerCommand('profile', {
    description: 'View or edit user profiles',
    usage: 'profile [username] | profile edit <field> <value>',
    aliases: ['pr'],
    handler: (args, context) => {
      if (args.length > 0 && args[0] === 'edit') {
        return handleProfileEdit(args.slice(1), context);
      } else {
        return handleProfile(args, context);
      }
    }
  });
  
  // Register register as an alias for backward compatibility
  registerCommand('register', {
    description: 'Register a new user account',
    usage: 'register <username>',
    aliases: ['signup', 'reg'],
    handler: (args, context) => handleRegister(args, context)
  });
}

module.exports = {
  register
};
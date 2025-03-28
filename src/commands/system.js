/**
 * System command - system-related operations and command creation
 */

const { registerCommand, loadCustomCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getDb } = require('../db/setup');
const { version } = require('../../package.json');
const os = require('os');

// Handler for the system command
function systemHandler(args, context) {
  // If no arguments, show usage
  if (args.length === 0) {
    return showSystemUsage();
  }

  const subcommand = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'info':
      return handleSystemInfo(subArgs, context);
    case 'make':
      return handleMakeCommand(subArgs, context);
    default:
      return showSystemUsage();
  }
}

// Show system usage information
function showSystemUsage() {
  return theme.error(
    'Usage:\n' +
    '  system info - Show system information\n' +
    '  system make list - List custom commands\n' +
    '  system make view <name> - View a custom command\n' +
    '  system make <name> <description> <implementation> - Create a new command'
  );
}

// Handle system info
function handleSystemInfo(args, context) {
  const db = getDb();
  
  // Get system stats
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
  const guestbookCount = db.prepare('SELECT COUNT(*) as count FROM guestbook').get().count;
  const weeklyCount = db.prepare('SELECT COUNT(*) as count FROM weekly_posts').get().count;
  const commandCount = db.prepare('SELECT COUNT(*) as count FROM commands').get().count;
  
  let output = theme.primary('SOLO-OS System Information') + '\n\n';
  
  // Version and platform info
  output += theme.secondary('Version: ') + version + '\n';
  output += theme.secondary('Platform: ') + os.platform() + ' ' + os.release() + '\n';
  output += theme.secondary('Node.js: ') + process.version + '\n';
  output += theme.secondary('Uptime: ') + formatUptime(process.uptime()) + '\n\n';
  
  // System statistics
  output += theme.highlight('System Statistics:') + '\n';
  output += theme.secondary('Users: ') + userCount + '\n';
  output += theme.secondary('Posts: ') + postCount + '\n';
  output += theme.secondary('Guestbook Entries: ') + guestbookCount + '\n';
  output += theme.secondary('Weekly Updates: ') + weeklyCount + '\n';
  output += theme.secondary('Custom Commands: ') + commandCount + '\n\n';
  
  // Current session info
  output += theme.highlight('Session Information:') + '\n';
  output += theme.secondary('Logged in as: ') + (context.user ? context.user.username : 'Not logged in') + '\n';
  output += theme.secondary('User role: ') + (context.user ? (context.user.is_admin ? 'Administrator' : 'User') : 'Guest') + '\n';
  
  return output;
}

// Format uptime in a human-readable format
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
  result += `${secs}s`;
  
  return result;
}

// ----- Make Command Functions -----

// Create a custom command
function createCustomCommand(db, creatorId, name, description, implementation) {
  // Ensure the name is valid
  if (!/^[a-z0-9_]+$/.test(name)) {
    throw new Error('Command name must contain only lowercase letters, numbers, and underscores');
  }
  
  // Add prefix to avoid collision with built-in commands
  const commandName = name.startsWith('custom_') ? name : `custom_${name}`;
  
  const stmt = db.prepare(`
    INSERT INTO commands (creator_id, name, description, implementation)
    VALUES (?, ?, ?, ?)
  `);
  
  try {
    const result = stmt.run(creatorId, commandName, description, implementation);
    return result.lastInsertRowid;
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error(`Command '${name}' already exists`);
    }
    throw error;
  }
}

// List custom commands
function listCustomCommands(db) {
  return db.prepare(`
    SELECT c.*, u.username as creator
    FROM commands c
    LEFT JOIN users u ON c.creator_id = u.id
    ORDER BY c.name
  `).all();
}

// Get a custom command by name
function getCustomCommand(db, name) {
  const commandName = name.startsWith('custom_') ? name : `custom_${name}`;
  
  return db.prepare(`
    SELECT c.*, u.username as creator
    FROM commands c
    LEFT JOIN users u ON c.creator_id = u.id
    WHERE c.name = ?
  `).get(commandName);
}

// Handle make command
function handleMakeCommand(args, context) {
  const db = getDb();
  
  // Need to be logged in to create commands
  if (!context.user) {
    return theme.error('You must be logged in to create custom commands');
  }
  
  // make list - List custom commands
  if (args.length === 1 && args[0] === 'list') {
    const commands = listCustomCommands(db);
    
    if (commands.length === 0) {
      return theme.info('No custom commands yet. Create one with "system make <name>".');
    }
    
    let output = theme.primary('Custom Commands') + '\n\n';
    
    for (const cmd of commands) {
      output += theme.highlight(cmd.name.replace('custom_', '')) + '\n';
      output += theme.secondary('Description: ') + cmd.description + '\n';
      output += theme.dim(`Created by ${cmd.creator || 'Unknown'} on ${new Date(cmd.created_at).toLocaleDateString()}`) + '\n\n';
    }
    
    return output;
  }
  
  // make view <name> - View a custom command
  if (args.length === 2 && args[0] === 'view') {
    const commandName = args[1];
    const command = getCustomCommand(db, commandName);
    
    if (!command) {
      return theme.error(`Command '${commandName}' not found`);
    }
    
    let output = theme.primary(`Custom Command: ${command.name.replace('custom_', '')}`) + '\n\n';
    output += theme.secondary('Description: ') + command.description + '\n';
    output += theme.dim(`Created by ${command.creator || 'Unknown'} on ${new Date(command.created_at).toLocaleDateString()}`) + '\n\n';
    output += theme.secondary('Implementation:') + '\n';
    output += theme.dim('```javascript') + '\n';
    output += command.implementation + '\n';
    output += theme.dim('```');
    
    return output;
  }
  
  // make <name> <description> <implementation> - Create a new command
  if (args.length >= 3) {
    const name = args[0];
    const description = args[1];
    const implementation = args.slice(2).join(' ');
    
    try {
      // Try to parse the implementation to ensure it's valid JavaScript
      new Function('args', 'context', implementation);
      
      // Create the command
      createCustomCommand(db, context.user.id, name, description, implementation);
      
      // Load the command
      const command = getCustomCommand(db, name);
      if (command) {
        loadCustomCommand(command);
      }
      
      return theme.success(`Command '${name}' created successfully. Use it with '${name}' or 'custom_${name}'.`);
    } catch (error) {
      return theme.error(`Failed to create command: ${error.message}`);
    }
  }
  
  // Interactive mode (just a prompt for full syntax)
  if (args.length === 1 && args[0] !== 'list' && args[0] !== 'view') {
    const name = args[0];
    
    return (
      theme.primary(`Creating New Command: ${name}`) + '\n\n' +
      theme.info('To create a custom command, use:') + '\n' +
      theme.highlight(`system make ${name} <description> <implementation>`) + '\n\n' +
      theme.secondary('Example:') + '\n' +
      theme.highlight(`system make hello "Says hello to someone" return "Hello, " + (args[0] || "world") + "!";`) + '\n\n' +
      theme.secondary('Available in implementation:') + '\n' +
      theme.dim('- args: Array of command arguments') + '\n' +
      theme.dim('- context: { user, currentView }') + '\n'
    );
  }
  
  // Default: show usage
  return theme.error(
    'Usage:\n' +
    '  system make list - List custom commands\n' +
    '  system make view <name> - View a custom command\n' +
    '  system make <name> <description> <implementation> - Create a new command'
  );
}

function register() {
  // Register the main system command
  registerCommand('system', {
    description: 'System operations and information',
    usage: 'system info | system make <name> | system make list | system make view <name>',
    aliases: ['sys'],
    handler: systemHandler
  });
  
  // Keep make command for backward compatibility
  registerCommand('make', {
    description: 'Create and manage custom commands',
    usage: 'make <name> | make list | make view <name> | make <name> <description> <implementation>',
    aliases: ['m', 'mk'],
    requiresAuth: true,
    handler: (args, context) => handleMakeCommand(args, context)
  });
}

module.exports = {
  register,
  createCustomCommand,
  listCustomCommands,
  getCustomCommand
};
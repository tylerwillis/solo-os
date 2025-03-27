/**
 * Command registration and management system
 */

const fs = require('fs');
const path = require('path');

// Store registered commands
const commands = new Map();
const aliases = new Map();

// Register a command
function registerCommand(name, options = {}) {
  if (commands.has(name)) {
    throw new Error(`Command '${name}' is already registered`);
  }
  
  // Set default options
  const commandOptions = {
    description: 'No description provided',
    usage: name,
    aliases: [],
    handler: () => console.log(`Command '${name}' is not implemented yet`),
    requiresAuth: false,
    adminOnly: false,
    ...options
  };
  
  // Register the command
  commands.set(name, commandOptions);
  
  // Register aliases
  if (Array.isArray(commandOptions.aliases)) {
    for (const alias of commandOptions.aliases) {
      if (aliases.has(alias)) {
        console.warn(`Alias '${alias}' for command '${name}' is already used by another command`);
      } else {
        aliases.set(alias, name);
      }
    }
  }
  
  return commandOptions;
}

// Get a command by name or alias
function getCommand(nameOrAlias) {
  // Check if it's a direct command name
  if (commands.has(nameOrAlias)) {
    return commands.get(nameOrAlias);
  }
  
  // Check if it's an alias
  if (aliases.has(nameOrAlias)) {
    const commandName = aliases.get(nameOrAlias);
    return commands.get(commandName);
  }
  
  return null;
}

// Execute a command
function executeCommand(nameOrAlias, args = [], context = {}) {
  const command = getCommand(nameOrAlias);
  
  if (!command) {
    return {
      success: false,
      error: `Unknown command: ${nameOrAlias}`
    };
  }
  
  // Check if authentication is required
  if (command.requiresAuth && !context.user) {
    return {
      success: false,
      error: 'This command requires authentication. Please login first.'
    };
  }
  
  // Check if admin privileges are required
  if (command.adminOnly && (!context.user || !context.user.is_admin)) {
    return {
      success: false,
      error: 'This command requires admin privileges.'
    };
  }
  
  try {
    const result = command.handler(args, context);
    return {
      success: true,
      result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Command execution failed'
    };
  }
}

// List all available commands
function listCommands(includeAdmin = false, user = null) {
  const result = [];
  
  for (const [name, command] of commands.entries()) {
    // Skip admin commands for non-admin users
    if (command.adminOnly && (!includeAdmin || !user || !user.is_admin)) {
      continue;
    }
    
    result.push({
      name,
      description: command.description,
      usage: command.usage,
      aliases: command.aliases,
      requiresAuth: command.requiresAuth,
      adminOnly: command.adminOnly
    });
  }
  
  return result;
}

// Load a custom command from the database
function loadCustomCommand(commandData) {
  try {
    // This is obviously dangerous in production without proper sandboxing
    // For demonstration purposes only
    const commandFn = new Function('args', 'context', commandData.implementation);
    
    registerCommand(commandData.name, {
      description: commandData.description,
      handler: commandFn,
      requiresAuth: true,
      creator: commandData.creator_id
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to load custom command ${commandData.name}:`, error);
    return false;
  }
}

// Load all custom commands from the database
function loadCustomCommands(db) {
  const customCommands = db.prepare('SELECT * FROM commands').all();
  
  for (const command of customCommands) {
    loadCustomCommand(command);
  }
  
  console.log(`Loaded ${customCommands.length} custom commands`);
}

// Register built-in commands by loading all command files
function registerBuiltinCommands() {
  // Define the commands directory
  const commandsDir = path.join(__dirname);
  
  // Read all .js files in the commands directory (except index.js)
  const commandFiles = fs.readdirSync(commandsDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  
  // Load each command module
  for (const file of commandFiles) {
    try {
      const commandModule = require(path.join(commandsDir, file));
      if (typeof commandModule.register === 'function') {
        commandModule.register();
      }
    } catch (error) {
      console.error(`Failed to load command module ${file}:`, error);
    }
  }
  
  console.log(`Registered ${commandFiles.length} built-in commands`);
  
  // Load custom commands from database
  if (global.db) {
    loadCustomCommands(global.db);
  }
}

module.exports = {
  registerCommand,
  getCommand,
  executeCommand,
  listCommands,
  loadCustomCommand,
  registerBuiltinCommands
};
/**
 * Help command - displays available commands and usage information
 */

const { registerCommand, listCommands, getCommand } = require('./index');
const { theme } = require('../ui/terminal');

function helpHandler(args, context) {
  // If a specific command is provided, show help for that command
  if (args.length > 0) {
    const commandName = args[0];
    const command = getCommand(commandName);
    
    if (!command) {
      return theme.error(`Unknown command: ${commandName}`);
    }
    
    // Display detailed help for the command
    let output = theme.primary(`Help: ${commandName}`) + '\n\n';
    output += theme.secondary('Description: ') + command.description + '\n';
    output += theme.secondary('Usage: ') + command.usage + '\n';
    
    if (command.aliases && command.aliases.length > 0) {
      output += theme.secondary('Aliases: ') + command.aliases.join(', ') + '\n';
    }
    
    if (command.requiresAuth) {
      output += theme.warning('Note: This command requires authentication.') + '\n';
    }
    
    if (command.adminOnly) {
      output += theme.warning('Note: This command requires admin privileges.') + '\n';
    }
    
    return output;
  }
  
  // Otherwise, list all available commands
  const commands = listCommands(true, context.user);
  
  let output = theme.primary('Available Commands') + '\n\n';
  
  // Group commands by category
  const categories = {
    'Core': [],
    'User': [],
    'Content': [],
    'Admin': [],
    'System': [],
    'Custom': []
  };
  
  for (const cmd of commands) {
    if (cmd.adminOnly) {
      categories['Admin'].push(cmd);
    } else if (cmd.name.startsWith('custom_')) {
      categories['Custom'].push(cmd);
    } else if (['post', 'announce', 'status', 'weekly'].includes(cmd.name)) {
      categories['Content'].push(cmd);
    } else if (['user', 'login', 'logout', 'profile', 'register'].includes(cmd.name)) {
      categories['User'].push(cmd);
    } else if (['system', 'make'].includes(cmd.name)) {
      categories['System'].push(cmd);
    } else {
      categories['Core'].push(cmd);
    }
  }
  
  // Display each category
  for (const [category, cmds] of Object.entries(categories)) {
    if (cmds.length === 0) continue;
    
    output += theme.secondary(`${category} Commands:`) + '\n';
    
    for (const cmd of cmds) {
      let cmdText = theme.highlight(cmd.name);
      
      if (cmd.aliases && cmd.aliases.length > 0) {
        cmdText += theme.dim(` (${cmd.aliases.join(', ')})`);
      }
      
      // Pad command names for alignment
      while (cmdText.length < 20) {
        cmdText += ' ';
      }
      
      output += `  ${cmdText} ${cmd.description}\n`;
    }
    
    output += '\n';
  }
  
  output += theme.info('Tip: ') + 'Use ' + theme.highlight('help <command>') + ' for detailed information about a specific command.';
  
  return output;
}

function register() {
  registerCommand('help', {
    description: 'Display available commands and usage information',
    usage: 'help [command]',
    aliases: ['h', '?'],
    handler: helpHandler
  });
}

module.exports = {
  register
};
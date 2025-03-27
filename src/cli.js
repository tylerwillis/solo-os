/**
 * Simple CLI version for testing SOLO-OS
 */

const readline = require('readline');
const chalk = require('chalk');
const { executeCommand, listCommands } = require('./commands');
const { setupDatabase } = require('./db/setup');
const { authenticateUser } = require('./models/user');

let context = {
  user: null,
  currentView: 'main'
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'SOLO-OS> '
});

// Show welcome message
function showWelcome() {
  console.log(chalk.cyan(`
 ███████╗ ██████╗ ██╗      ██████╗        ██████╗ ███████╗
 ██╔════╝██╔═══██╗██║     ██╔═══██╗      ██╔═══██╗██╔════╝
 ███████╗██║   ██║██║     ██║   ██║█████╗██║   ██║███████╗
 ╚════██║██║   ██║██║     ██║   ██║╚════╝██║   ██║╚════██║
 ███████║╚██████╔╝███████╗╚██████╔╝      ╚██████╔╝███████║
 ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝        ╚═════╝ ╚══════╝
`));
  
  console.log(chalk.green('Welcome to SOLO-OS - Terminal BBS for the Solo House!'));
  console.log(chalk.yellow('Type') + ' ' + chalk.bold.white('help') + ' ' + 
              chalk.yellow('to see available commands'));
  console.log();
  console.log(chalk.blue('Popular commands:'));
  console.log(chalk.bold.white('  post (p)') + ' - Create a bulletin board post');
  console.log(chalk.bold.white('  guest (g)') + ' - Sign the guestbook');
  console.log(chalk.bold.white('  make (m)') + ' - Create a new command');
  console.log();
  
  if (!context.user) {
    console.log(chalk.gray('Not logged in. Use') + ' ' + chalk.bold.white('login <username>') + ' ' + 
                chalk.gray('to log in or') + ' ' + chalk.bold.white('guest') + ' ' + 
                chalk.gray('to continue as a visitor'));
  }
}

// Handle a command
function handleCommand(input) {
  // Skip empty commands
  if (!input || input.trim() === '') {
    rl.prompt();
    return;
  }

  // Parse command and arguments
  const parts = input.trim().split(' ');
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Special case for exit
  if (commandName === 'exit' || commandName === 'quit') {
    console.log(chalk.green('Goodbye!'));
    rl.close();
    process.exit(0);
    return;
  }

  // Execute the command
  const result = executeCommand(commandName, args, context);

  // Display the result
  if (result.success) {
    if (result.result && typeof result.result === 'string') {
      // Replace \n with actual newlines for the CLI output
      console.log(result.result.replace(/\\n/g, '\n'));
    }
  } else {
    console.log(chalk.red('Error: ') + result.error);
  }

  // Update prompt based on login status
  let promptText = context.user ? 
    `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
    'SOLO-OS> ';
  
  rl.setPrompt(promptText);
  rl.prompt();
}

// Start the CLI
async function startCLI() {
  try {
    // Setup database
    await setupDatabase();
    
    // Register built-in commands
    require('./commands').registerBuiltinCommands();
    
    // Show welcome
    showWelcome();
    
    // Start the prompt
    rl.prompt();
    
    // Handle input
    rl.on('line', (line) => {
      handleCommand(line);
    });
    
    rl.on('close', () => {
      console.log(chalk.green('\nGoodbye!'));
      process.exit(0);
    });
    
  } catch (err) {
    console.error('Failed to initialize SOLO-OS CLI:', err);
    process.exit(1);
  }
}

// Start the application
module.exports = { startCLI };
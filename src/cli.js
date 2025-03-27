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

// Handle password obfuscation for login and register commands
async function handlePasswordCommand(commandName, args) {
  if (commandName === 'login' && args.length === 1) {
    // Get username from args, prompt for password
    const username = args[0];
    
    // Close the readline interface temporarily
    rl.close();
    
    // Create a new interface for password input
    const pwRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Prompt for password with obfuscation
    return new Promise((resolve) => {
      // Hack to disable echo (works in many terminals)
      process.stdout.write(`Enter password for ${username}: `);
      process.stdin.setRawMode(true);
      let password = '';
      
      // Handle keypress events
      process.stdin.on('data', function handler(ch) {
        ch = ch.toString();
        
        // On enter, finish input
        if (ch === '\r' || ch === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', handler);
          console.log('');
          pwRl.close();
          
          // Recreate the main readline interface
          rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: context.user ? 
              `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
              'SOLO-OS> '
          });
          
          // Execute the login command with password
          const result = executeCommand('login', [username, password], context);
          resolve({result, args: []});
        } 
        // On backspace, remove last character
        else if (ch === '\b' || ch === '\x7f') {
          if (password.length > 0) {
            password = password.substring(0, password.length - 1);
            process.stdout.write('\b \b'); // Erase the character from screen
          }
        }
        // Otherwise, add character to password and show asterisk
        else if (ch && ch.length === 1 && !ch.match(/[\x00-\x1F]/)) { // Only visible characters
          password += ch;
          process.stdout.write('*');
        }
      });
    });
  }
  else if (commandName === 'register' && args.length === 1) {
    // Similar to login, but for registration
    const username = args[0];
    
    rl.close();
    
    const pwRl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      // Get password
      process.stdout.write(`Create password for ${username}: `);
      process.stdin.setRawMode(true);
      let password = '';
      
      process.stdin.on('data', function handler(ch) {
        ch = ch.toString();
        
        if (ch === '\r' || ch === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', handler);
          console.log('');
          
          // Confirm password
          process.stdout.write(`Confirm password: `);
          let confirmPassword = '';
          
          process.stdin.setRawMode(true);
          process.stdin.on('data', function confirmHandler(ch) {
            ch = ch.toString();
            
            if (ch === '\r' || ch === '\n') {
              process.stdin.setRawMode(false);
              process.stdin.removeListener('data', confirmHandler);
              console.log('');
              pwRl.close();
              
              // Recreate the main readline interface
              rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                prompt: context.user ? 
                  `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
                  'SOLO-OS> '
              });
              
              // Check if passwords match
              if (password !== confirmPassword) {
                resolve({
                  result: {
                    success: false,
                    error: 'Passwords do not match. Please try again.'
                  },
                  args: []
                });
              } else {
                // Execute the register command
                const result = executeCommand('register', [username, password], context);
                resolve({result, args: []});
              }
            }
            else if (ch === '\b' || ch === '\x7f') {
              if (confirmPassword.length > 0) {
                confirmPassword = confirmPassword.substring(0, confirmPassword.length - 1);
                process.stdout.write('\b \b');
              }
            }
            else if (ch && ch.length === 1 && !ch.match(/[\x00-\x1F]/)) {
              confirmPassword += ch;
              process.stdout.write('*');
            }
          });
        }
        else if (ch === '\b' || ch === '\x7f') {
          if (password.length > 0) {
            password = password.substring(0, password.length - 1);
            process.stdout.write('\b \b');
          }
        }
        else if (ch && ch.length === 1 && !ch.match(/[\x00-\x1F]/)) {
          password += ch;
          process.stdout.write('*');
        }
      });
    });
  }
  
  return null;
}

// Handle a command
async function handleCommand(input) {
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

  // Handle password commands specially
  if ((commandName === 'login' && args.length === 1) ||
      (commandName === 'register' && args.length === 1)) {
    const pwResult = await handlePasswordCommand(commandName, args);
    if (pwResult) {
      const { result } = pwResult;
      
      // Display the result
      if (result.success) {
        if (result.result && typeof result.result === 'string') {
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
      return;
    }
  }

  // Execute regular command
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
    rl.on('line', async (line) => {
      await handleCommand(line);
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
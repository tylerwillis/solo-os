/**
 * CLI version of SOLO-OS with improved password handling
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
let rl = readline.createInterface({
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
  console.log(chalk.bold.white('  user') + ' - User management and profiles');
  console.log(chalk.bold.white('  post') + ' - Create and view posts, announcements, and status updates');
  console.log(chalk.bold.white('  guest') + ' - Sign the guestbook');
  console.log(chalk.bold.white('  system') + ' - System info and creating commands');
  console.log(chalk.bold.white('  quit') + ' - Exit SOLO-OS (or use Ctrl+C)');
  console.log();
  
  if (!context.user) {
    console.log(chalk.gray('Not logged in. Use') + ' ' + chalk.bold.white('login <username>') + ' ' + 
                chalk.gray('to log in or') + ' ' + chalk.bold.white('guest') + ' ' + 
                chalk.gray('to continue as a visitor'));
  }
}

// Simpler password input approach that doesn't close the readline interface
async function getPasswordSecurely(prompt) {
  return new Promise((resolve) => {
    // Mark that we're in password mode
    isInPasswordMode = true;
    
    console.log(chalk.blue('\nEntering password mode. Your input will be masked.'));
    
    // Save the original prompt and create a password prompt
    const originalPrompt = rl.getPrompt();
    rl.setPrompt(prompt);
    rl.prompt();
    
    // Use a special mode to handle password entry
    const originalLineHandler = rl._events.line;
    rl.removeAllListeners('line');
    
    // Save current raw mode state
    const stdinIsTTY = process.stdin.isTTY;
    let originalRawMode = false;
    
    // Enable raw mode to prevent character echo
    if (stdinIsTTY && process.stdin.setRawMode) {
      try {
        originalRawMode = Boolean(process.stdin.isRaw);
        process.stdin.setRawMode(true);
      } catch (e) {
        console.error('Failed to set raw mode:', e.message);
      }
    }
    
    // Track password characters
    let inputChars = [];
    
    // Handle keypress to mask the password
    const keypressHandler = (char, key) => {
      // Skip if we don't have a proper key object
      if (!key) return;
      
      // If we get a ctrl+c, cancel the password entry
      if (key.ctrl && key.name === 'c') {
        rl.write('\n');
        
        // Restore raw mode to its original state if we're in TTY
        if (stdinIsTTY && process.stdin.setRawMode) {
          try {
            process.stdin.setRawMode(originalRawMode);
          } catch (e) {
            console.error('Failed to restore raw mode:', e.message);
          }
        }
        
        rl.setPrompt(originalPrompt);
        rl.on('line', originalLineHandler);
        process.stdin.removeListener('keypress', keypressHandler);
        isInPasswordMode = false;
        
        // Redisplay prompt
        setTimeout(() => {
          rl.prompt();
        }, 10);
        
        resolve('');
        return;
      }
      
      // Handle backspace
      if (key.name === 'backspace' || key.name === 'delete') {
        if (inputChars.length > 0) {
          inputChars.pop();
          rl.write('\b \b'); // Erase the asterisk
        }
        return;
      }
      
      // Handle enter (complete password entry)
      if (key.name === 'enter' || key.name === 'return') {
        rl.write('\n');
        const password = inputChars.join('');
        
        // Restore raw mode to its original state if we're in TTY
        if (stdinIsTTY && process.stdin.setRawMode) {
          try {
            process.stdin.setRawMode(originalRawMode);
          } catch (e) {
            console.error('Failed to restore raw mode:', e.message);
          }
        }
        
        // Restore normal line handling
        rl.setPrompt(originalPrompt);
        rl.on('line', originalLineHandler);
        process.stdin.removeListener('keypress', keypressHandler);
        isInPasswordMode = false;
        
        // Allow a short delay before resolving to ensure terminal is ready
        setTimeout(() => {
          resolve(password);
        }, 10);
        
        return;
      }
      
      // Regular characters - mask with asterisk
      // Only accept printable ASCII and basic typing keys
      if (char && 
          key.name !== 'backspace' && 
          key.name !== 'delete' && 
          key.name !== 'enter' && 
          key.name !== 'return' &&
          !key.ctrl && 
          !key.meta && 
          !key.shift &&
          char.length === 1 && 
          char.charCodeAt(0) >= 32 && 
          char.charCodeAt(0) <= 126) {
        
        inputChars.push(char);
        
        // Delete the actual character that was printed
        rl.write('\b \b'); 
        
        // Write an asterisk instead
        rl.write('*');
      }
    };
    
    // Start listening for keypresses
    process.stdin.on('keypress', keypressHandler);
  });
}

// Global backup variable for console.log used in login/register flow
let _globalSavedConsoleLog = null;

// Handle login with secure password entry
async function handleLogin(username) {
  try {
    // Display processing message
    console.log(chalk.blue(`Attempting login for user: ${username}`));
    
    // Get password securely
    const password = await getPasswordSecurely(`Enter password for ${username}: `);
    
    // Handle canceled or empty password
    if (!password || password.trim() === '') {
      console.log(chalk.yellow('Login canceled or password empty'));
      rl.prompt();
      return;
    }
    
    // Execute the login command with the password
    const result = executeCommand('login', [username, password], context);
    
    // Display the result
    if (result.success) {
      if (result.result && typeof result.result === 'string') {
        console.log(result.result.replace(/\\n/g, '\n'));
      } else {
        console.log(chalk.green(`Successfully logged in as ${username}`));
      }
    } else {
      console.log(chalk.red('Error: ') + (result.error || 'Login failed'));
    }
    
    // Update prompt based on login status
    updatePrompt();
  } catch (error) {
    console.log(chalk.red('Login error: ') + (error ? error.message : 'Unknown error'));
    
    // Ensure password mode flag is cleared
    isInPasswordMode = false;
    
    // Ensure the prompt is restored
    rl.prompt();
  }
}

// Handle registration with secure password entry and confirmation
async function handleRegister(username) {
  try {
    // Display processing message
    console.log(chalk.blue(`Starting registration for: ${username}`));
    
    // Get password securely
    const password = await getPasswordSecurely(`Create password for ${username}: `);
    
    // Handle canceled or empty password
    if (!password || password.trim() === '') {
      console.log(chalk.yellow('Registration canceled or password empty'));
      rl.prompt();
      return;
    }
    
    // Confirm password
    const confirmPassword = await getPasswordSecurely('Confirm password: ');
    
    // Handle canceled confirmation
    if (!confirmPassword) {
      console.log(chalk.yellow('Registration canceled during confirmation'));
      rl.prompt();
      return;
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
      console.log(chalk.red('Error: ') + 'Passwords do not match. Please try again.');
      rl.prompt();
      return;
    }
    
    // Execute the register command with the password
    const result = executeCommand('register', [username, password], context);
    
    // Display the result
    if (result.success) {
      if (result.result && typeof result.result === 'string') {
        console.log(result.result.replace(/\\n/g, '\n'));
      } else {
        console.log(chalk.green(`User ${username} registered successfully`));
      }
    } else {
      console.log(chalk.red('Error: ') + (result.error || 'Registration failed'));
    }
    
    // Update prompt based on login status
    updatePrompt();
  } catch (error) {
    console.log(chalk.red('Registration error: ') + (error ? error.message : 'Unknown error'));
    
    // Ensure password mode flag is cleared
    isInPasswordMode = false;
    
    // Ensure the prompt is restored
    rl.prompt();
  }
}

// Handle user registration with secure password entry
async function handleUserRegister(username) {
  // Just use the regular register handler with the user command
  try {
    // Display processing message
    console.log(chalk.blue(`Starting registration for: ${username}`));
    
    // Get password securely
    const password = await getPasswordSecurely(`Create password for ${username}: `);
    
    // Handle canceled or empty password
    if (!password || password.trim() === '') {
      console.log(chalk.yellow('Registration canceled or password empty'));
      rl.prompt();
      return;
    }
    
    // Confirm password
    const confirmPassword = await getPasswordSecurely('Confirm password: ');
    
    // Handle canceled confirmation
    if (!confirmPassword) {
      console.log(chalk.yellow('Registration canceled during confirmation'));
      rl.prompt();
      return;
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
      console.log(chalk.red('Error: ') + 'Passwords do not match. Please try again.');
      rl.prompt();
      return;
    }
    
    // Execute the user register command with the password
    const result = executeCommand('user', ['register', username, password], context);
    
    // Display the result
    if (result.success) {
      if (result.result && typeof result.result === 'string') {
        console.log(result.result.replace(/\\n/g, '\n'));
      } else {
        console.log(chalk.green(`User ${username} registered successfully`));
      }
    } else {
      console.log(chalk.red('Error: ') + (result.error || 'Registration failed'));
    }
    
    // Update prompt based on login status
    updatePrompt();
  } catch (error) {
    console.log(chalk.red('Registration error: ') + (error ? error.message : 'Unknown error'));
    
    // Ensure password mode flag is cleared
    isInPasswordMode = false;
    
    // Ensure the prompt is restored
    rl.prompt();
  }
}

// Update the prompt based on login status
function updatePrompt() {
  // Make sure we have a valid readline interface
  if (!rl || typeof rl.prompt !== 'function') {
    console.log('Recreating readline interface...');
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: context.user ? 
        `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
        'SOLO-OS> '
    });
    setupReadlineHandlers();
  }
  
  // Make sure stdin is flowing
  if (process.stdin.isPaused()) {
    process.stdin.resume();
  }
  
  // Update the prompt text
  let promptText = context.user ? 
    `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
    'SOLO-OS> ';
  
  // Set and display the prompt
  rl.setPrompt(promptText);
  
  // Use a small delay to ensure the prompt appears after any previous output
  setTimeout(() => {
    try {
      rl.prompt(true); // Force prompt redisplay
    } catch (e) {
      console.error('Error displaying prompt:', e.message);
    }
  }, 10);
}

// Global flag to track password entry mode
let isInPasswordMode = false;

// Handle a command
async function handleCommand(input) {
  // Skip empty commands
  if (!input || input.trim() === '') {
    rl.prompt();
    return;
  }

  // Skip command processing if we're in password mode
  if (isInPasswordMode) {
    console.log(chalk.yellow('Password entry in progress. Please complete or cancel it first.'));
    return;
  }

  // Parse command and arguments
  const parts = input.trim().split(' ');
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Special cases for exit and clear
  if (commandName === 'exit' || commandName === 'quit') {
    console.log(chalk.green('Goodbye!'));
    rl.close();
    process.exit(0);
    return;
  }
  
  if (commandName === 'clear' || commandName === 'cls') {
    console.clear();
    showWelcome();
    rl.prompt();
    return;
  }

  // Handle special commands that need password handling
  if (commandName === 'login' && args.length === 1) {
    isInPasswordMode = true;
    await handleLogin(args[0]);
    isInPasswordMode = false;
    return;
  }
  
  if (commandName === 'register' && args.length === 1) {
    isInPasswordMode = true;
    await handleRegister(args[0]);
    isInPasswordMode = false;
    return;
  }
  
  if (commandName === 'user' && args.length >= 2) {
    if (args[0] === 'login' && args.length === 2) {
      isInPasswordMode = true;
      await handleLogin(args[1]);
      isInPasswordMode = false;
      return;
    } else if (args[0] === 'register' && args.length === 2) {
      isInPasswordMode = true;
      await handleUserRegister(args[1]);
      isInPasswordMode = false;
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
  updatePrompt();
}

// Start the CLI
async function startCLI() {
  try {
    // Setup database
    await setupDatabase();
    
    // Register built-in commands
    require('./commands').registerBuiltinCommands();
    
    // Set up readline for keypress events (needed for password handling)
    readline.emitKeypressEvents(process.stdin);
    
    // Set stdin to raw mode if it's a TTY
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    // Add signal handler for Ctrl+C
    process.on('SIGINT', () => {
      console.log(chalk.green('\nGoodbye!'));
      process.exit(0);
    });
    
    // Show welcome
    showWelcome();
    
    // Set up the readline interface event handlers
    setupReadlineHandlers();
    
    // Start the prompt
    rl.prompt();
  } catch (err) {
    console.error('Failed to initialize SOLO-OS CLI:', err);
    process.exit(1);
  }
}

// Set up readline event handlers
function setupReadlineHandlers() {
  try {
    // First check if rl is defined and has event methods
    if (!rl || typeof rl.on !== 'function') {
      console.error('Readline interface is not properly initialized');
      
      // Create a new readline interface if needed
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: context.user ? 
          `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
          'SOLO-OS> '
      });
    }
    
    // Remove any existing handlers to prevent duplicates
    if (typeof rl.removeAllListeners === 'function') {
      rl.removeAllListeners('line');
      rl.removeAllListeners('close');
      rl.removeAllListeners('error');
      rl.removeAllListeners('SIGINT');
    }
    
    // Handle input
    rl.on('line', async (line) => {
      try {
        await handleCommand(line);
      } catch (error) {
        console.error('Error handling command:', error);
        // Force prompt after error
        setTimeout(() => {
          rl.prompt(true);
        }, 10);
      }
    });
    
    // Handle errors
    rl.on('error', (error) => {
      console.error('Readline error:', error.message);
      
      // Try to recover from error
      try {
        if (rl) {
          rl.close();
        }
        
        // Create a new readline interface
        rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          prompt: context.user ? 
            `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
            'SOLO-OS> '
        });
        
        // Set up event handlers for new interface
        setupReadlineHandlers();
        
        // Show prompt
        rl.prompt();
      } catch (e) {
        console.error('Failed to recover from readline error:', e.message);
      }
    });
    
    // Handle close - BUT DON'T IMMEDIATELY EXIT
    // This seems to be causing issues - let Node exit naturally
    rl.on('close', () => {
      // Only display "Goodbye!" if we're not in password mode
      if (!isInPasswordMode) {
        console.log(chalk.green('\nGoodbye!'));
      }
      
      // If we're not exiting on purpose, try to restart
      if (!isInPasswordMode && rl) {
        // Try to recreate the readline interface
        try {
          rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: context.user ? 
              `${chalk.magenta(context.user.username)}@SOLO-OS> ` : 
              'SOLO-OS> '
          });
          
          // Set up event handlers for new interface
          setupReadlineHandlers();
          
          // Ensure stdin is in the right state
          if (process.stdin.isPaused()) {
            process.stdin.resume();
          }
          
          // Show prompt
          setTimeout(() => {
            rl.prompt(true);
          }, 10);
        } catch (e) {
          console.error('Failed to restart after close:', e.message);
        }
      }
      
      // Don't force exit - let it happen naturally
      // process.exit(0);
    });
  } catch (error) {
    console.error('Error setting up readline handlers:', error);
    
    // Last resort recovery - try to set up a completely new readline interface
    try {
      // Make sure stdin is in a good state
      process.stdin.setRawMode && process.stdin.setRawMode(false);
      if (process.stdin.isPaused()) {
        process.stdin.resume();
      }
      
      // Create brand new readline interface
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'SOLO-OS> '
      });
      
      // Basic event handlers
      rl.on('line', async (line) => {
        try {
          await handleCommand(line);
        } catch (e) {
          console.error('Error handling command:', e.message);
          rl.prompt();
        }
      });
      
      // Show prompt
      rl.prompt();
    } catch (e) {
      console.error('Fatal error setting up readline:', e.message);
    }
  }
}

// Start the application
module.exports = { startCLI };
/**
 * Terminal UI implementation using blessed with improved text formatting
 */

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const chalk = require('chalk');
const { executeCommand, listCommands } = require('../commands');
const { getDb } = require('../db/setup');
const { authenticateUser } = require('../models/user');

// Terminal context
let screen;
let commandInput;
let outputBox;
let statusBar;
let sidePanel;
let context = {
  user: null,
  currentView: 'main'
};

// ANSI color theme
const theme = {
  primary: chalk.cyan,
  secondary: chalk.yellow,
  accent: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  success: chalk.green,
  dim: chalk.gray,
  highlight: chalk.bold.white,
  username: chalk.bold.magenta
};

// ASCII art logo
const logo = `
 ███████╗ ██████╗ ██╗      ██████╗        ██████╗ ███████╗
 ██╔════╝██╔═══██╗██║     ██╔═══██╗      ██╔═══██╗██╔════╝
 ███████╗██║   ██║██║     ██║   ██║█████╗██║   ██║███████╗
 ╚════██║██║   ██║██║     ██║   ██║╚════╝██║   ██║╚════██║
 ███████║╚██████╔╝███████╗╚██████╔╝      ╚██████╔╝███████║
 ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝        ╚═════╝ ╚══════╝
`;

// Show welcome screen
function showWelcome() {
  outputBox.setContent(
    theme.primary(logo) + '\n\n' +
    theme.accent('Welcome to SOLO-OS - Terminal BBS for the Solo House!') + '\n\n' +
    theme.secondary('Type') + ' ' + theme.highlight('help') + ' ' + 
    theme.secondary('to see available commands') + '\n\n' +
    theme.info('Popular commands:') + '\n' +
    theme.highlight('  user') + ' - User management and profiles\n' +
    theme.highlight('  post') + ' - Create and view posts, announcements, and status updates\n' +
    theme.highlight('  guest') + ' - Sign the guestbook\n' +
    theme.highlight('  system') + ' - System info and creating commands\n' +
    theme.highlight('  quit') + ' - Exit SOLO-OS (or use Ctrl+C)\n\n' +
    (context.user ? '' : 
      theme.dim('Not logged in. Use') + ' ' + theme.highlight('login <username>') + ' ' + 
      theme.dim('to log in or') + ' ' + theme.highlight('guest') + ' ' + theme.dim('to continue as a visitor'))
  );
  screen.render();
}

// Update status bar
function updateStatusBar() {
  const userStatus = context.user 
    ? theme.username(context.user.username) + (context.user.is_admin ? ' (admin)' : '') 
    : theme.dim('Not logged in');
  
  statusBar.setContent(
    ' ' + theme.primary('SOLO-OS') + ' | ' + 
    'User: ' + userStatus + ' | ' +
    'View: ' + theme.info(context.currentView) + ' | ' +
    theme.dim('Press Ctrl+C to exit')
  );
  screen.render();
}

// Initialize UI components
function initializeUI() {
  // Create screen
  screen = blessed.screen({
    smartCSR: true,
    title: 'SOLO-OS Terminal BBS'
  });

  // Create layout
  const layout = blessed.layout({
    parent: screen,
    width: '100%',
    height: '100%'
  });

  // Output box (main content area)
  outputBox = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '95%-3',
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      bg: 'blue'
    },
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: 'blue'
      }
    }
  });

  // Command input
  commandInput = blessed.textbox({
    parent: screen,
    bottom: 2,
    left: 0,
    height: 3,
    width: '100%',
    keys: true,
    inputOnFocus: true,
    style: {
      fg: 'white',
      bg: 'black',
      focus: {
        bg: 'blue'
      }
    }
  });

  // Status bar
  statusBar = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    style: {
      fg: 'white',
      bg: 'blue'
    }
  });

  // Configure key handlers
  screen.key(['escape', 'q', 'C-c'], () => {
    // Clean up blessed/screen
    screen.destroy();
    console.log(chalk.green('Goodbye!'));
    // Exit the process
    process.exit(0);
  });
  
  // Also listen for SIGINT at this level
  process.on('SIGINT', () => {
    // Clean up blessed/screen
    if (screen) screen.destroy();
    console.log(chalk.green('\nGoodbye!'));
    // Exit the process
    process.exit(0);
  });

  commandInput.key('enter', () => {
    const command = commandInput.getValue();
    handleCommand(command);
    commandInput.clearValue();
    commandInput.focus();
  });

  // Focus the input
  commandInput.focus();

  // Initial render
  updateStatusBar();
  showWelcome();
}

// Get password securely using more direct stdin handling
function getPasswordSecurely(prompt, callback) {
  let password = '';
  let inPasswordInput = true;
  
  // Show the prompt
  appendToOutput(prompt + " (typing is hidden)");
  
  // Disable normal input handling temporarily
  commandInput.hide();
  
  // Block other keyboard handlers temporarily
  const originalKeypress = screen._events.keypress;
  screen._events.keypress = function() {}; // No-op function
  
  // Create a simple text display for input feedback
  const inputFeedback = blessed.box({
    parent: screen,
    bottom: 2,
    left: 0,
    height: 1,
    width: '100%',
    content: '> ',
    style: {
      fg: 'white',
      bg: 'blue'
    }
  });
  
  // Function to clean up and restore normal mode
  function cleanup(showCommandInput = true) {
    // Prevent multiple cleanups
    if (!inPasswordInput) return;
    inPasswordInput = false;
    
    try {
      // Remove our input handler
      process.stdin.removeListener('data', inputHandler);
      
      // Restore original stdin state
      if (!wasRaw) {
        process.stdin.setRawMode(false);
      }
      
      // Restore original destroy method
      screen.destroy = originalDestroy;
      
      // Restore original keypress handler
      screen._events.keypress = originalKeypress;
      
      // Remove feedback display
      if (inputFeedback.parent) {
        inputFeedback.destroy();
      }
      
      // Reset terminal state
      process.stdout.write('\u001b[?25h'); // Show cursor
      
      // Show command input again if requested
      if (showCommandInput) {
        // Delay slightly to ensure previous input is fully processed
        setTimeout(() => {
          commandInput.show();
          commandInput.clearValue();
          commandInput.focus();
          screen.render();
        }, 10);
      }
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  }
  
  // Store current stdin state
  const wasRaw = process.stdin.isRaw;
  
  // Handle input events directly from stdin
  const inputHandler = function(data) {
    // Skip if we're no longer in password input mode
    if (!inPasswordInput) return;
    
    // Get the character as a string
    const ch = String(data);
    
    // Handle control characters and special keys
    if (ch === '\r' || ch === '\n') {  // Enter
      // Full cleanup
      cleanup();
      
      // Process password with small delay to ensure cleanup completes
      setTimeout(() => callback(password), 20);
      return;
    } 
    else if (ch === '\u001b') {  // Escape
      // Full cleanup
      cleanup();
      
      // Cancel operation with small delay
      setTimeout(() => {
        appendToOutput(theme.warning('Password entry cancelled'));
        callback('');
      }, 20);
      return;
    }
    else if (ch === '\b' || ch === '\x7f') {  // Backspace
      if (password.length > 0) {
        password = password.substring(0, password.length - 1);
        // Update display
        let stars = '*'.repeat(password.length);
        inputFeedback.setContent(`> ${stars}`);
        screen.render();
      }
      return;
    }
    
    // Regular character (visible characters only)
    if (ch && ch.length === 1 && !ch.match(/[\x00-\x1F]/)) {
      password += ch;
      // Update display with stars
      let stars = '*'.repeat(password.length);
      inputFeedback.setContent(`> ${stars}`);
      screen.render();
    }
  };
  
  // Backup original screen destroy function
  const originalDestroy = screen.destroy;
  
  // Override screen destroy to ensure cleanup
  screen.destroy = function() {
    cleanup(false);
    return originalDestroy.apply(this, arguments);
  };
  
  // Set raw mode for direct character input
  if (!wasRaw) {
    process.stdin.setRawMode(true);
  }
  
  // Ensure stdin is paused for our custom handling
  const wasPaused = process.stdin.isPaused();
  if (!wasPaused) {
    process.stdin.pause();
  }
  
  // Resume stdin for our handler
  process.stdin.resume();
  
  // Add our raw input handler
  process.stdin.on('data', inputHandler);
  
  // Render the screen
  screen.render();
}

// Handle login with password prompt
function handleLogin(username) {
  appendToOutput(theme.info(`Login requested for ${username}`));
  
  getPasswordSecurely(`Enter password for ${username}: `, (password) => {
    // Check if password was provided (or cancelled)
    if (!password || password.trim() === '') {
      appendToOutput(theme.error('Login cancelled or empty password provided'));
      return;
    }
    
    // Show processing message
    appendToOutput(theme.dim('Authenticating...'));
    
    // Execute the login command with password
    const result = executeCommand('login', [username, password], context);
    
    // Display the result
    if (result.success) {
      if (result.result && typeof result.result === 'string') {
        appendToOutput(result.result);
      } else {
        appendToOutput(theme.success(`Logged in as ${username}`));
      }
    } else {
      appendToOutput(theme.error('Error: ') + result.error);
    }
    
    // Update UI
    updateStatusBar();
  });
}

// Handle user registration
function handleRegister(username) {
  appendToOutput(theme.info(`Registration requested for ${username}`));
  
  getPasswordSecurely(`Create password for ${username}: `, (password) => {
    // Check if password was provided (or cancelled)
    if (!password || password.trim() === '') {
      appendToOutput(theme.error('Registration cancelled or empty password provided'));
      return;
    }
    
    // Ask for confirmation
    getPasswordSecurely('Confirm password: ', (confirmPassword) => {
      // Check if confirmation was provided (or cancelled)
      if (!confirmPassword || confirmPassword.trim() === '') {
        appendToOutput(theme.error('Registration cancelled'));
        return;
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        appendToOutput(theme.error('Passwords do not match. Please try again.'));
        return;
      }
      
      // Show processing message
      appendToOutput(theme.dim('Creating account...'));
      
      // Execute the register command with password
      const result = executeCommand('register', [username, password], context);
      
      // Display the result
      if (result.success) {
        if (result.result && typeof result.result === 'string') {
          appendToOutput(result.result);
        } else {
          appendToOutput(theme.success(`User ${username} registered successfully`));
        }
      } else {
        appendToOutput(theme.error('Error: ') + result.error);
      }
      
      // Update UI
      updateStatusBar();
    });
  });
}

// Handle command input
function handleCommand(input) {
  // Skip empty commands
  if (!input || input.trim() === '') {
    return;
  }

  // Parse command and arguments
  const parts = input.trim().split(' ');
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Special handling for login and register commands
  if (commandName === 'login' && args.length === 1) {
    handleLogin(args[0]);
    return;
  }
  
  if (commandName === 'register' && args.length === 1) {
    handleRegister(args[0]);
    return;
  }
  
  if (commandName === 'user' && args.length === 2 && args[0] === 'register') {
    handleRegister(args[1]);
    return;
  }

  // Execute regular command
  const result = executeCommand(commandName, args, context);

  // Display the result
  if (result.success) {
    if (result.result && typeof result.result === 'string') {
      appendToOutput(result.result);
    }
  } else {
    appendToOutput(theme.error('Error: ') + result.error);
  }

  // Update UI
  updateStatusBar();
}

// Append text to the output box with proper newline handling
function appendToOutput(text) {
  // Replace any explicit \n with actual newlines
  const processedText = String(text).replace(/\\n/g, '\n');
  
  const currentContent = outputBox.getContent();
  outputBox.setContent(currentContent + '\n\n' + processedText);
  outputBox.scrollTo(outputBox.getScrollHeight());
  screen.render();
}

// Clear the output
function clearOutput() {
  outputBox.setContent('');
  screen.render();
}

// Set the output content
function setOutput(content) {
  // Replace any explicit \n with actual newlines
  const processedContent = String(content).replace(/\\n/g, '\n');
  
  outputBox.setContent(processedContent);
  outputBox.scrollTo(0);
  screen.render();
}

// Start the terminal UI
function startUI(options = {}) {
  // Make sure we capture SIGINT/Ctrl+C globally before initializing UI
  process.removeAllListeners('SIGINT');
  process.on('SIGINT', () => {
    if (screen) screen.destroy();
    console.log(chalk.green('\nGoodbye!'));
    process.exit(0);
  });

  // Initialize the UI components
  initializeUI();

  // Handle auto-login if username provided
  if (options.user) {
    // In a real app, we'd prompt for password
    // For demo, we'll try to authenticate with same password as username
    const db = getDb();
    const user = authenticateUser(db, options.user, options.user);
    
    if (user) {
      context.user = user;
      appendToOutput(theme.success(`Logged in as ${user.username}`));
    } else {
      appendToOutput(theme.error(`Failed to authenticate as ${options.user}`));
    }
    
    updateStatusBar();
  }

  // Show welcome screen
  showWelcome();
}

module.exports = {
  startUI,
  appendToOutput,
  clearOutput,
  setOutput,
  updateStatusBar,
  theme
};
/**
 * Terminal UI implementation using blessed
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
    theme.highlight('  post (p)') + ' - Create a bulletin board post\n' +
    theme.highlight('  guest (g)') + ' - Sign the guestbook\n' +
    theme.highlight('  make (m)') + ' - Create a new command\n' +
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

  // Execute the command
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

// Append text to the output box
function appendToOutput(text) {
  // Replace literal \n with actual newlines
  const processedText = text.replace(/\\n/g, '\n');
  
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
  outputBox.setContent(content);
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
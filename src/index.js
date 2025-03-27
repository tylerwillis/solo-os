/**
 * SOLO-OS - Terminal-based Bulletin Board System for the Solo house
 */

const { Command } = require('commander');
const { startUI } = require('./ui/terminal');
const { setupDatabase } = require('./db/setup');
const { registerBuiltinCommands } = require('./commands');
const { version } = require('../package.json');

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});

// Initialize the application
async function init() {
  try {
    // Setup database
    await setupDatabase();
    
    // Register built-in commands
    registerBuiltinCommands();

    // Configure CLI program
    const program = new Command();
    program
      .version(version)
      .description('SOLO-OS: A terminal-based BBS for the Solo house')
      .option('-u, --user <username>', 'Log in as user')
      .option('-g, --guest', 'Enter as guest')
      .parse(process.argv);

    const options = program.opts();
    
    // Start the terminal UI
    startUI(options);
  } catch (err) {
    console.error('Failed to initialize SOLO-OS:', err);
    process.exit(1);
  }
}

// Start the application
init();
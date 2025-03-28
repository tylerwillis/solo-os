/**
 * Guest command - simplified digital guestbook for visitors
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getDb } = require('../db/setup');

// Add a guestbook entry
function addGuestbookEntry(db, name, message) {
  const stmt = db.prepare(`
    INSERT INTO guestbook (name, message)
    VALUES (?, ?)
  `);
  
  const result = stmt.run(name, message);
  return result.lastInsertRowid;
}

// List guestbook entries
function listGuestbookEntries(db, limit = 20) {
  return db.prepare(`
    SELECT * FROM guestbook
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

// Handler for guest command
function guestHandler(args, context) {
  // If no arguments, show the guestbook
  if (args.length === 0) {
    return handleListGuestbook(context);
  }

  const subcommand = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'list':
      return handleListGuestbook(context);
    case 'sign':
      return handleSignGuestbook(subArgs, context);
    default:
      // If first argument is not a subcommand, assume it's a name for signing
      if (args.length >= 1) {
        return handleSignGuestbook(args, context);
      }
      // Otherwise show usage
      return showGuestUsage();
  }
}

// Show guest usage information
function showGuestUsage() {
  return theme.error(
    'Usage:\n' +
    '  guest - View the guestbook\n' +
    '  guest list - View the guestbook\n' +
    '  guest sign <name> <message> - Sign the guestbook\n' +
    '  guest <name> <message> - Sign the guestbook (shorthand)'
  );
}

// Handle listing guestbook entries
function handleListGuestbook(context) {
  const db = getDb();
  const entries = listGuestbookEntries(db);
  
  if (entries.length === 0) {
    return theme.info('The guestbook is empty. Be the first to sign!');
  }
  
  let output = theme.primary('📖 SOLO House Guestbook 📖') + '\n\n';
  
  for (const entry of entries) {
    const date = new Date(entry.created_at).toLocaleDateString();
    output += theme.highlight(`${entry.name} (${date}):`) + '\n';
    output += entry.message + '\n\n';
  }
  
  output += theme.info(`To sign the guestbook: 'guest <your name> <your message>'`);
  
  return output;
}

// Handle signing the guestbook
function handleSignGuestbook(args, context) {
  const db = getDb();
  
  // Case: guest sign <name> <message>
  if (args.length >= 2 && args[0] === 'sign') {
    const name = args[1];
    const message = args.slice(2).join(' ');
    
    try {
      addGuestbookEntry(db, name, message);
      return theme.success(`Thanks for signing the guestbook, ${name}!`);
    } catch (error) {
      return theme.error(`Failed to sign guestbook: ${error.message}`);
    }
  }
  
  // Case: guest <name> <message>
  if (args.length >= 2) {
    const name = args[0];
    const message = args.slice(1).join(' ');
    
    try {
      addGuestbookEntry(db, name, message);
      return theme.success(`Thanks for signing the guestbook, ${name}!`);
    } catch (error) {
      return theme.error(`Failed to sign guestbook: ${error.message}`);
    }
  }
  
  // Not enough arguments
  return theme.error('Usage: guest <name> <message> - Sign the guestbook');
}

function register() {
  registerCommand('guest', {
    description: 'Sign or view the digital guestbook',
    usage: 'guest | guest sign <name> <message> | guest <name> <message>',
    aliases: ['g', 'gb', 'guestbook'],
    handler: guestHandler
  });
}

module.exports = {
  register,
  addGuestbookEntry,
  listGuestbookEntries
};
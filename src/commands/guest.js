/**
 * Guest/Guestbook command - digital guestbook for visitors
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

// Handle guestbook command
function guestbookHandler(args, context) {
  const db = getDb();
  
  // guestbook sign <name> <message> - Add a new entry
  if (args.length >= 3 && args[0] === 'sign') {
    const name = args[1];
    const message = args.slice(2).join(' ');
    
    try {
      addGuestbookEntry(db, name, message);
      return theme.success(`Thanks for signing the guestbook, ${name}!`);
    } catch (error) {
      return theme.error(`Failed to sign guestbook: ${error.message}`);
    }
  }
  
  // Special shorthand: guest <name> <message> - Add a new entry
  if (args.length >= 2 && args[0] !== 'view' && args[0] !== 'list') {
    const name = args[0];
    const message = args.slice(1).join(' ');
    
    try {
      addGuestbookEntry(db, name, message);
      return theme.success(`Thanks for signing the guestbook, ${name}!`);
    } catch (error) {
      return theme.error(`Failed to sign guestbook: ${error.message}`);
    }
  }
  
  // Default: list guestbook entries
  const entries = listGuestbookEntries(db);
  
  if (entries.length === 0) {
    return theme.info('The guestbook is empty. Be the first to sign!');
  }
  
  let output = theme.primary('📖 SOLO House Guestbook 📖') + '\\n\\n';
  
  for (const entry of entries) {
    const date = new Date(entry.created_at).toLocaleDateString();
    output += theme.highlight(`${entry.name} (${date}):`) + '\\n';
    output += entry.message + '\\n\\n';
  }
  
  output += theme.info(`To sign the guestbook: 'guest <your name> <your message>'`);
  
  return output;
}

function register() {
  registerCommand('guest', {
    description: 'Sign or view the digital guestbook',
    usage: 'guest [name] [message] | guest sign <name> <message>',
    aliases: ['g', 'gb', 'guestbook'],
    handler: guestbookHandler
  });
}

module.exports = {
  register,
  addGuestbookEntry,
  listGuestbookEntries
};
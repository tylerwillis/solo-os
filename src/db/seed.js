/**
 * Seed script to populate the database with initial data
 */

const { createUser, updateProfile } = require('../models/user');
const { createPost } = require('../commands/post');
const { addGuestbookEntry } = require('../commands/guest');
const { createWeeklyPost, getCurrentWeekNumber } = require('../commands/weekly');

function seedDatabase(db) {
  console.log('Seeding database with initial data...');
  
  // Create default admin user if it doesn't exist
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    createUser(db, 'admin', 'admin', true);
    console.log('Created default admin user (username: admin, password: admin)');
  }
  
  // Create Tyler's user account
  const tylerExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('tyler');
  if (tylerExists.count === 0) {
    const tyler_id = createUser(db, 'tyler', 'tyler', true);
    
    // Update Tyler's profile
    const tylerBio = `
Founder of SOLO-OS and creator of Unsupervised. I've raised $60M and built AI Agent for data analysis and Chat Better (www.chatbetter.com), a better way to use LLMs.

I did ODS1, ODP, and I help out the mkdir team. I'm a techno-optimist and believe in skill and tool optimism.

Find me at www.tyler.is
`;

    const tylerContact = `
Twitter: @tylerwillis
LinkedIn: /in/tylerwillis
Website: www.tyler.is
Location: Bainbridge Island, WA
`;

    updateProfile(db, tyler_id, tylerBio, tylerContact, "Building AI tools that empower people");
    console.log('Created tyler account with full profile');
    
    // Add a post from Tyler
    createPost(db, tyler_id, "Welcome to SOLO-OS", "Welcome to SOLO-OS, a nostalgic BBS for the Solo house! I built this to help solo founders connect, share, and stay accountable. Enjoy!", 'post');
    
    // Add a welcome announcement
    createPost(db, tyler_id, "ANNOUNCEMENT", "Welcome to the Solo house! Make yourself at home, and don't forget to sign the guestbook.", 'announce');
    
    // Add a weekly post
    const currentWeek = getCurrentWeekNumber();
    createWeeklyPost(
      db, 
      tyler_id, 
      currentWeek, 
      "Built and deployed SOLO-OS, a terminal BBS for the Solo house. Made progress on AI projects at Unsupervised and Chat Better.", 
      "Improve SOLO-OS with new features, work on AI agent capabilities, and prepare for next mentor session.",
      "Successfully launched SOLO-OS and got great feedback from users."
    );
  }
  
  // Add Tyler to guestbook if not already there
  const tylerGuestExists = db.prepare('SELECT COUNT(*) as count FROM guestbook WHERE name = ?').get('Tyler Willis');
  if (tylerGuestExists.count === 0) {
    addGuestbookEntry(db, "Tyler Willis", "Founder of SOLO-OS. Living in Bainbridge Island, WA. Excited to see this community grow!");
    console.log('Added Tyler to the guestbook');
  }
  
  console.log('Database seeding completed.');
}

module.exports = { seedDatabase };
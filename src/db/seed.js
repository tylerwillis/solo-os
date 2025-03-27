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
    
    // Add a first post referencing Jack's first tweet
    createPost(db, tyler_id, "just setting up my solo", "First post on SOLO-OS! Building a nostalgic BBS for the Solo house. Excited to see how founders use this for connecting and sharing.", 'post');
    
    // Add another post
    createPost(db, tyler_id, "Chat Better Update", "Made great progress on Chat Better (www.chatbetter.com) this week - our better way to use LLMs is gaining traction. Check it out if you're working with AI!", 'post');
    
    // Add a welcome announcement
    createPost(db, tyler_id, "ANNOUNCEMENT", "Welcome to the Solo house! I'm Tyler, creator of SOLO-OS and founder of Unsupervised. Feel free to reach out if you need anything during your stay.", 'announce');
    
    // Add status update
    createPost(db, tyler_id, "Status Update", "Working on AI agent improvements and enjoying Bainbridge Island views this morning.", 'status');
    
    // Add a weekly post
    const currentWeek = getCurrentWeekNumber();
    createWeeklyPost(
      db, 
      tyler_id, 
      currentWeek, 
      "Built and deployed SOLO-OS for the Solo house, improved AI agent capabilities at Unsupervised, and enhanced Chat Better's interface. Mentored two ODP founders on AI integration.", 
      "Add extensibility features to SOLO-OS, work on AI agent natural language processing improvements, prepare for next mkdir team sync.",
      "SOLO-OS MVP completed on schedule, Chat Better seeing 23% week-over-week user growth."
    );
  }
  
  // Add Tyler to guestbook if not already there
  const tylerGuestExists = db.prepare('SELECT COUNT(*) as count FROM guestbook WHERE name = ?').get('Tyler Willis');
  if (tylerGuestExists.count === 0) {
    addGuestbookEntry(db, "Tyler Willis", "Founder of Unsupervised ($60M raised) and creator of SOLO-OS and Chat Better. Helping out the mkdir team. Greetings from Bainbridge Island, WA!");
    console.log('Added Tyler to the guestbook');
  }
  
  console.log('Database seeding completed.');
}

module.exports = { seedDatabase };
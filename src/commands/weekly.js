/**
 * Weekly command - founder accountability posts
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getDb } = require('../db/setup');

// Create a weekly post
function createWeeklyPost(db, userId, weekNumber, lastWeek, nextWeek, wins) {
  // Check if already exists
  const existing = db.prepare(`
    SELECT id FROM weekly_posts 
    WHERE user_id = ? AND week_number = ?
  `).get(userId, weekNumber);
  
  if (existing) {
    // Update existing post
    const stmt = db.prepare(`
      UPDATE weekly_posts
      SET last_week = ?, next_week = ?, wins = ?
      WHERE id = ?
    `);
    stmt.run(lastWeek, nextWeek, wins || '', existing.id);
    return existing.id;
  } else {
    // Create new post
    const stmt = db.prepare(`
      INSERT INTO weekly_posts (user_id, week_number, last_week, next_week, wins)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(userId, weekNumber, lastWeek, nextWeek, wins || '');
    return result.lastInsertRowid;
  }
}

// Get a weekly post
function getWeeklyPost(db, userId, weekNumber) {
  return db.prepare(`
    SELECT w.*, u.username
    FROM weekly_posts w
    JOIN users u ON w.user_id = u.id
    WHERE w.user_id = ? AND w.week_number = ?
  `).get(userId, weekNumber);
}

// Get the latest weekly posts from all users
function getLatestWeeklyPosts(db) {
  return db.prepare(`
    SELECT w.*, u.username
    FROM weekly_posts w
    JOIN users u ON w.user_id = u.id
    WHERE w.id IN (
      SELECT MAX(id) 
      FROM weekly_posts 
      GROUP BY user_id
    )
    ORDER BY w.created_at DESC
  `).all();
}

// Get current week number
function getCurrentWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
}

// Handle weekly command
function weeklyHandler(args, context) {
  const db = getDb();
  
  // Need to be logged in to use weekly
  if (!context.user) {
    return theme.error('You must be logged in to use the weekly command');
  }
  
  const currentWeek = getCurrentWeekNumber();
  
  // weekly new <last_week> | <next_week> [| <wins>] - Create a new weekly post
  if (args.length >= 1 && args[0] === 'new') {
    // We expect the content in the format: <last_week> | <next_week> [| <wins>]
    const fullContent = args.slice(1).join(' ');
    const parts = fullContent.split('|').map(part => part.trim());
    
    if (parts.length < 2) {
      return theme.error('Usage: weekly new <last_week> | <next_week> [| <wins>]');
    }
    
    const lastWeek = parts[0];
    const nextWeek = parts[1];
    const wins = parts[2] || '';
    
    try {
      createWeeklyPost(db, context.user.id, currentWeek, lastWeek, nextWeek, wins);
      return theme.success('Weekly accountability post created');
    } catch (error) {
      return theme.error(`Failed to create weekly post: ${error.message}`);
    }
  }
  
  // weekly view [username] [week] - View a specific weekly post
  if (args.length >= 1 && args[0] === 'view') {
    let targetUsername = context.user.username;
    let weekNumber = currentWeek;
    
    if (args.length >= 2) {
      // Check if the second arg is a number or a username
      if (/^\\d+$/.test(args[1])) {
        weekNumber = parseInt(args[1]);
      } else {
        targetUsername = args[1];
        
        if (args.length >= 3 && /^\\d+$/.test(args[2])) {
          weekNumber = parseInt(args[2]);
        }
      }
    }
    
    // Find the user ID for the username
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(targetUsername);
    
    if (!user) {
      return theme.error(`User ${targetUsername} not found`);
    }
    
    const weeklyPost = getWeeklyPost(db, user.id, weekNumber);
    
    if (!weeklyPost) {
      return theme.error(`No weekly post found for ${targetUsername} for week ${weekNumber}`);
    }
    
    let output = '';
    output += theme.primary(`Weekly Accountability: ${weeklyPost.username} - Week ${weeklyPost.week_number}`) + '\\n';
    output += theme.dim(`Posted on ${new Date(weeklyPost.created_at).toLocaleString()}`) + '\\n\\n';
    
    output += theme.secondary('Last Week:') + '\\n';
    output += weeklyPost.last_week + '\\n\\n';
    
    output += theme.secondary('Next Week:') + '\\n';
    output += weeklyPost.next_week + '\\n\\n';
    
    if (weeklyPost.wins) {
      output += theme.secondary('Wins:') + '\\n';
      output += weeklyPost.wins + '\\n';
    }
    
    return output;
  }
  
  // Default: list latest weekly posts
  const posts = getLatestWeeklyPosts(db);
  
  if (posts.length === 0) {
    return theme.info('No weekly accountability posts yet. Create one with "weekly new".');
  }
  
  let output = theme.primary('Latest Weekly Accountability Posts') + '\\n\\n';
  
  for (const post of posts) {
    const date = new Date(post.created_at).toLocaleDateString();
    output += theme.highlight(`${post.username} - Week ${post.week_number} (${date}):`) + '\\n';
    output += theme.secondary('Last Week:') + ' ' + post.last_week.substring(0, 50) + (post.last_week.length > 50 ? '...' : '') + '\\n';
    output += theme.secondary('Next Week:') + ' ' + post.next_week.substring(0, 50) + (post.next_week.length > 50 ? '...' : '') + '\\n';
    
    if (post.wins) {
      output += theme.secondary('Wins:') + ' ' + post.wins.substring(0, 50) + (post.wins.length > 50 ? '...' : '') + '\\n';
    }
    
    output += '\\n';
  }
  
  output += theme.info(`View full post: 'weekly view <username> [week]'`) + '\\n';
  output += theme.info(`Create your post: 'weekly new <last_week> | <next_week> [| <wins>]'`);
  
  return output;
}

function register() {
  registerCommand('weekly', {
    description: 'Weekly accountability posts for founders',
    usage: 'weekly | weekly view [username] [week] | weekly new <last_week> | <next_week> [| <wins>]',
    aliases: ['w', 'accountability'],
    requiresAuth: true,
    handler: weeklyHandler
  });
}

module.exports = {
  register,
  createWeeklyPost,
  getWeeklyPost,
  getLatestWeeklyPosts,
  getCurrentWeekNumber
};
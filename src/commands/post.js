/**
 * Post command - consolidated post operations for different post types
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getDb } = require('../db/setup');
const { createWeeklyPost, getWeeklyPost, getLatestWeeklyPosts, getCurrentWeekNumber } = require('./weekly');

// Create a new post
function createPost(db, userId, title, content, type = 'post') {
  const stmt = db.prepare(`
    INSERT INTO posts (user_id, title, content, type)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(userId, title, content, type);
  return result.lastInsertRowid;
}

// Get a post by ID
function getPostById(db, postId) {
  return db.prepare(`
    SELECT p.*, u.username 
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(postId);
}

// List recent posts
function listPosts(db, type = 'post', limit = 10) {
  return db.prepare(`
    SELECT p.id, p.title, p.created_at, u.username
    FROM posts p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.type = ?
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(type, limit);
}

// Handle post command
function postHandler(args, context) {
  // If no arguments, show usage
  if (args.length === 0) {
    return showPostUsage();
  }

  const subcommand = args[0].toLowerCase();
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'list':
      return handleListPosts(subArgs, context);
    case 'view':
      return handleViewPost(subArgs, context);
    case 'new':
      return handleNewPost(subArgs, context);
    case 'announce':
      return handleAnnouncement(subArgs, context);
    case 'status':
      return handleStatus(subArgs, context);
    case 'weekly':
      return handleWeekly(subArgs, context);
    default:
      return showPostUsage();
  }
}

// Show usage information
function showPostUsage() {
  return theme.error(
    'Usage:\n' +
    '  post list [limit] - List recent posts\n' +
    '  post view <id> - View a specific post\n' +
    '  post new <title> <content> - Create a new post\n' +
    '  post announce <message> - Send an announcement\n' +
    '  post status <message> - Update your status\n' +
    '  post weekly - Weekly accountability posts'
  );
}

// Handle listing posts
function handleListPosts(args, context) {
  const db = getDb();
  const limit = args[0] ? parseInt(args[0]) : 10;
  const posts = listPosts(db, 'post', Math.min(limit, 50));
  
  if (posts.length === 0) {
    return theme.info('No posts found. Be the first to post something!');
  }
  
  let output = theme.primary('Recent Posts') + '\n\n';
  
  for (const post of posts) {
    const date = new Date(post.created_at).toLocaleDateString();
    output += theme.highlight(`#${post.id}: ${post.title}`) + '\n';
    output += theme.dim(`  Posted by ${post.username || 'Anonymous'} on ${date}`) + '\n';
  }
  
  output += '\n' + theme.info(`Use 'post view <id>' to read a post`);
  
  return output;
}

// Handle viewing a post
function handleViewPost(args, context) {
  const db = getDb();
  
  if (args.length < 1) {
    return theme.error('Usage: post view <id>');
  }
  
  const postId = parseInt(args[0]);
  
  if (isNaN(postId)) {
    return theme.error('Invalid post ID');
  }
  
  const post = getPostById(db, postId);
  
  if (!post) {
    return theme.error(`Post #${postId} not found`);
  }
  
  let output = '';
  output += theme.primary(`Post #${post.id}: ${post.title}`) + '\n';
  output += theme.dim(`Posted by ${post.username || 'Anonymous'} on ${new Date(post.created_at).toLocaleString()}`) + '\n\n';
  output += post.content;
  
  return output;
}

// Handle creating a new post
function handleNewPost(args, context) {
  const db = getDb();
  
  // Need to be logged in to post
  if (!context.user) {
    return theme.error('You must be logged in to create a post');
  }
  
  if (args.length < 2) {
    return theme.error('Usage: post new <title> <content>');
  }
  
  const title = args[0];
  const content = args.slice(1).join(' ');
  
  try {
    createPost(db, context.user.id, title, content, 'post');
    return theme.success('Post created successfully');
  } catch (error) {
    return theme.error(`Failed to create post: ${error.message}`);
  }
}

// Handle creating an announcement
function handleAnnouncement(args, context) {
  const db = getDb();
  
  // Need to be logged in to announce
  if (!context.user) {
    return theme.error('You must be logged in to make announcements');
  }
  
  if (args.length < 1) {
    // If no arguments, show recent announcements
    const announcements = listPosts(db, 'announce', 5);
  
    if (announcements.length === 0) {
      return theme.info('No announcements yet');
    }
    
    let output = theme.primary('Recent Announcements') + '\n\n';
    
    for (const announcement of announcements) {
      const post = getPostById(db, announcement.id);
      const date = new Date(post.created_at).toLocaleDateString();
      
      output += theme.highlight(`Announcement from ${post.username || 'Anonymous'} on ${date}:`) + '\n';
      output += post.content + '\n\n';
    }
    
    return output;
  }
  
  const message = args.join(' ');
  
  try {
    createPost(db, context.user.id, 'ANNOUNCEMENT', message, 'announce');
    return theme.success('Announcement sent successfully');
  } catch (error) {
    return theme.error(`Failed to create announcement: ${error.message}`);
  }
}

// Handle updating status
function handleStatus(args, context) {
  const db = getDb();
  
  // Need to be logged in to set status
  if (!context.user) {
    return theme.error('You must be logged in to set a status');
  }
  
  if (args.length < 1) {
    // If no arguments, show recent status updates
    const statuses = listPosts(db, 'status', 5);
  
    if (statuses.length === 0) {
      return theme.info('No status updates yet');
    }
    
    let output = theme.primary('Recent Status Updates') + '\n\n';
    
    for (const status of statuses) {
      const post = getPostById(db, status.id);
      const date = new Date(post.created_at).toLocaleDateString();
      
      output += theme.highlight(`${post.username || 'Anonymous'} (${date}):`) + '\n';
      output += post.content + '\n\n';
    }
    
    return output;
  }
  
  const status = args.join(' ');
  
  try {
    // Update profile status
    db.prepare(`
      UPDATE profiles
      SET status = ?
      WHERE user_id = ?
    `).run(status, context.user.id);
    
    // Also create a status post
    createPost(db, context.user.id, 'Status Update', status, 'status');
    
    return theme.success('Status updated successfully');
  } catch (error) {
    return theme.error(`Failed to update status: ${error.message}`);
  }
}

// Handle weekly accountability posts
function handleWeekly(args, context) {
  const db = getDb();
  
  // Need to be logged in to use weekly
  if (!context.user) {
    return theme.error('You must be logged in to use weekly accountability posts');
  }
  
  const currentWeek = getCurrentWeekNumber();
  
  // weekly new <last_week> | <next_week> [| <wins>] - Create a new weekly post
  if (args.length >= 1 && args[0] === 'new') {
    // We expect the content in the format: <last_week> | <next_week> [| <wins>]
    const fullContent = args.slice(1).join(' ');
    const parts = fullContent.split('|').map(part => part.trim());
    
    if (parts.length < 2) {
      return theme.error('Usage: post weekly new <last_week> | <next_week> [| <wins>]');
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
      if (/^\d+$/.test(args[1])) {
        weekNumber = parseInt(args[1]);
      } else {
        targetUsername = args[1];
        
        if (args.length >= 3 && /^\d+$/.test(args[2])) {
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
    output += theme.primary(`Weekly Accountability: ${weeklyPost.username} - Week ${weeklyPost.week_number}`) + '\n';
    output += theme.dim(`Posted on ${new Date(weeklyPost.created_at).toLocaleString()}`) + '\n\n';
    
    output += theme.secondary('Last Week:') + '\n';
    output += weeklyPost.last_week + '\n\n';
    
    output += theme.secondary('Next Week:') + '\n';
    output += weeklyPost.next_week + '\n\n';
    
    if (weeklyPost.wins) {
      output += theme.secondary('Wins:') + '\n';
      output += weeklyPost.wins + '\n';
    }
    
    return output;
  }
  
  // Default: list latest weekly posts
  const posts = getLatestWeeklyPosts(db);
  
  if (posts.length === 0) {
    return theme.info('No weekly accountability posts yet. Create one with "post weekly new".');
  }
  
  let output = theme.primary('Latest Weekly Accountability Posts') + '\n\n';
  
  for (const post of posts) {
    const date = new Date(post.created_at).toLocaleDateString();
    output += theme.highlight(`${post.username} - Week ${post.week_number} (${date}):`) + '\n';
    output += theme.secondary('Last Week:') + ' ' + post.last_week.substring(0, 50) + (post.last_week.length > 50 ? '...' : '') + '\n';
    output += theme.secondary('Next Week:') + ' ' + post.next_week.substring(0, 50) + (post.next_week.length > 50 ? '...' : '') + '\n';
    
    if (post.wins) {
      output += theme.secondary('Wins:') + ' ' + post.wins.substring(0, 50) + (post.wins.length > 50 ? '...' : '') + '\n';
    }
    
    output += '\n';
  }
  
  output += theme.info(`View full post: 'post weekly view <username> [week]'`) + '\n';
  output += theme.info(`Create your post: 'post weekly new <last_week> | <next_week> [| <wins>]'`);
  
  return output;
}

function register() {
  // Register the main post command
  registerCommand('post', {
    description: 'Create and view various types of posts',
    usage: 'post list | post view <id> | post new <title> <content> | post announce <message> | post status <message> | post weekly',
    aliases: ['p'],
    handler: postHandler
  });
  
  // Keep announce command for backward compatibility
  registerCommand('announce', {
    description: 'Make or view announcements',
    usage: 'announce [message]',
    aliases: ['a'],
    requiresAuth: true,
    handler: (args, context) => handleAnnouncement(args, context)
  });
  
  // Keep status command for backward compatibility
  registerCommand('status', {
    description: 'Update your status or view recent statuses',
    usage: 'status [message]',
    aliases: ['s'],
    requiresAuth: true,
    handler: (args, context) => handleStatus(args, context)
  });
  
  // Keep weekly command for backward compatibility
  registerCommand('weekly', {
    description: 'Weekly accountability posts for founders',
    usage: 'weekly | weekly view [username] [week] | weekly new <last_week> | <next_week> [| <wins>]',
    aliases: ['w', 'accountability'],
    requiresAuth: true,
    handler: (args, context) => handleWeekly(args, context)
  });
}

module.exports = {
  register,
  createPost,
  getPostById,
  listPosts
};
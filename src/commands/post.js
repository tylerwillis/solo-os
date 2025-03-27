/**
 * Post command - create and view bulletin board posts
 */

const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');
const { getDb } = require('../db/setup');

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
  const db = getDb();
  
  // post new <title> <content> - Create a new post
  if (args.length >= 3 && args[0] === 'new') {
    // Need to be logged in to post
    if (!context.user) {
      return theme.error('You must be logged in to create a post');
    }
    
    const title = args[1];
    const content = args.slice(2).join(' ');
    
    try {
      createPost(db, context.user.id, title, content, 'post');
      return theme.success('Post created successfully');
    } catch (error) {
      return theme.error(`Failed to create post: ${error.message}`);
    }
  }
  
  // post view <id> - View a specific post
  if (args.length >= 2 && args[0] === 'view') {
    const postId = parseInt(args[1]);
    
    if (isNaN(postId)) {
      return theme.error('Invalid post ID');
    }
    
    const post = getPostById(db, postId);
    
    if (!post) {
      return theme.error(`Post #${postId} not found`);
    }
    
    let output = '';
    output += theme.primary(`Post #${post.id}: ${post.title}`) + '\\n';
    output += theme.dim(`Posted by ${post.username || 'Anonymous'} on ${new Date(post.created_at).toLocaleString()}`) + '\\n\\n';
    output += post.content;
    
    return output;
  }
  
  // post list - List recent posts
  if (args.length === 0 || args[0] === 'list') {
    const limit = args[1] ? parseInt(args[1]) : 10;
    const posts = listPosts(db, 'post', Math.min(limit, 50));
    
    if (posts.length === 0) {
      return theme.info('No posts found. Be the first to post something!');
    }
    
    let output = theme.primary('Recent Posts') + '\\n\\n';
    
    for (const post of posts) {
      const date = new Date(post.created_at).toLocaleDateString();
      output += theme.highlight(`#${post.id}: ${post.title}`) + '\\n';
      output += theme.dim(`  Posted by ${post.username || 'Anonymous'} on ${date}`) + '\\n';
    }
    
    output += '\\n' + theme.info(`Use 'post view <id>' to read a post`);
    
    return output;
  }
  
  // Invalid usage
  return theme.error(
    'Usage:\\n' +
    '  post list [limit] - List recent posts\\n' +
    '  post view <id> - View a specific post\\n' +
    '  post new <title> <content> - Create a new post'
  );
}

// Handle announce command
function announceHandler(args, context) {
  const db = getDb();
  
  // Need to be logged in to announce
  if (!context.user) {
    return theme.error('You must be logged in to make announcements');
  }
  
  // announce <message> - Create a new announcement
  if (args.length > 0) {
    const message = args.join(' ');
    
    try {
      createPost(db, context.user.id, 'ANNOUNCEMENT', message, 'announce');
      return theme.success('Announcement sent successfully');
    } catch (error) {
      return theme.error(`Failed to create announcement: ${error.message}`);
    }
  }
  
  // If no arguments, show recent announcements
  const announcements = listPosts(db, 'announce', 5);
  
  if (announcements.length === 0) {
    return theme.info('No announcements yet');
  }
  
  let output = theme.primary('Recent Announcements') + '\\n\\n';
  
  for (const announcement of announcements) {
    const post = getPostById(db, announcement.id);
    const date = new Date(post.created_at).toLocaleDateString();
    
    output += theme.highlight(`Announcement from ${post.username || 'Anonymous'} on ${date}:`) + '\\n';
    output += post.content + '\\n\\n';
  }
  
  return output;
}

// Handle status command
function statusHandler(args, context) {
  const db = getDb();
  
  // Need to be logged in to set status
  if (!context.user) {
    return theme.error('You must be logged in to set a status');
  }
  
  // status <message> - Set status
  if (args.length > 0) {
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
  
  // If no arguments, show recent status updates
  const statuses = listPosts(db, 'status', 5);
  
  if (statuses.length === 0) {
    return theme.info('No status updates yet');
  }
  
  let output = theme.primary('Recent Status Updates') + '\\n\\n';
  
  for (const status of statuses) {
    const post = getPostById(db, status.id);
    const date = new Date(post.created_at).toLocaleDateString();
    
    output += theme.highlight(`${post.username || 'Anonymous'} (${date}):`) + '\\n';
    output += post.content + '\\n\\n';
  }
  
  return output;
}

function register() {
  registerCommand('post', {
    description: 'Create and view bulletin board posts',
    usage: 'post list | post view <id> | post new <title> <content>',
    aliases: ['p'],
    handler: postHandler
  });
  
  registerCommand('announce', {
    description: 'Make or view announcements',
    usage: 'announce [message]',
    aliases: ['a'],
    requiresAuth: true,
    handler: announceHandler
  });
  
  registerCommand('status', {
    description: 'Update your status or view recent statuses',
    usage: 'status [message]',
    aliases: ['s'],
    requiresAuth: true,
    handler: statusHandler
  });
}

module.exports = {
  register,
  createPost,
  getPostById,
  listPosts
};
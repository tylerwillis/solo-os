# SOLO-OS Usage Guide

This guide will help you get started with SOLO-OS, the terminal-based BBS for the Solo house.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solo-os.git
cd solo-os

# Install dependencies
npm install

# Make the CLI executable
npm run link

# Start SOLO-OS
solo-os
```

## Quick Start

When you first launch SOLO-OS, you'll be presented with the welcome screen. Here are some basic commands to get started:

1. **Login**:
   ```
   login <username> [password]
   ```
   For demo purposes, try using the default admin account: `login admin admin`

2. **View available commands**:
   ```
   help
   ```

3. **Sign the guestbook**:
   ```
   guest <your name> <your message>
   ```

4. **Create a post**:
   ```
   post new <title> <content>
   ```

5. **View recent posts**:
   ```
   post list
   ```

6. **Update your status**:
   ```
   status <your status>
   ```

7. **Create a weekly accountability post**:
   ```
   weekly new <what you did last week> | <what you plan to do next week> | <wins/celebrations>
   ```

## Command Reference

### Core Commands

- `help` (H) - Display available commands and usage information
- `login <username> [password]` (L) - Log in to the system
- `logout` - Log out from the system
- `profile [username]` (PR) - View user profiles
- `profile edit <field> <value>` - Edit your profile (bio, contact, status)

### Messaging

- `post list [limit]` (P) - List recent posts
- `post view <id>` - View a specific post
- `post new <title> <content>` - Create a new post
- `announce <message>` (A) - Make an announcement to all users
- `status <message>` (S) - Update your status

### Visitor Features

- `guest <name> <message>` (G) - Sign the guestbook
- `guest list` - View the guestbook

### Founder Tools

- `weekly` (W) - View recent weekly accountability posts
- `weekly view [username] [week]` - View a specific weekly post
- `weekly new <last_week> | <next_week> [| <wins>]` - Create a weekly accountability post

### Extensibility

- `make list` (M/MK) - List all custom commands
- `make view <name>` - View a specific custom command
- `make <name> <description> <implementation>` - Create a new command

## Creating Custom Commands

You can extend SOLO-OS by creating custom commands using the `make` command. Here's a simple example:

```
make hello "Says hello to someone" return "Hello, " + (args[0] || "world") + "!";
```

After creating this command, you can use it with:

```
hello John
```

The custom command will have access to:
- `args`: Array of command arguments
- `context`: Object containing user info and current view

## Tips

- Most commands have short aliases (shown in parentheses in the help)
- Use tab completion to navigate faster
- Type `help <command>` to get detailed help for any command

## Troubleshooting

- If you encounter database errors, try deleting the `.solo-os` directory in your home folder and restart
- For permission issues with the executable, run `chmod +x ./bin/solo-os`
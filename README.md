# SOLO-OS

A nostalgic, terminal-based bulletin board system (BBS) for the Solo house in San Francisco. This system facilitates community building, knowledge sharing, and productivity tracking for solo founders while embracing the retro aesthetic of early computing.

## Features

- Terminal-based UI with ASCII art branding
- Message board system with posts, announcements, and status updates
- Digital guestbook for visitors
- User profiles with activity tracking
- Weekly accountability system for founders
- Extensible command system that allows users to create new commands

## Core Commands

- `help` (H) - View available commands
- `login` (L) - Log into the system
- `post` (P) - Create and view bulletin board posts
- `announce` (A) - Send notifications to all users
- `status` (S) - Update your quick status
- `guest`/`guestbook`/`gb` (G) - View or sign the digital guestbook
- `weekly` (W) - Create and view weekly accountability posts 
- `make` (M/MK) - Create new custom commands

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solo-os.git
cd solo-os

# Install dependencies
npm install

# Create symlink to make the command available globally
npm run link

# Run the BBS
solo-os
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev
```

## Technical Details

- Built with Node.js
- Terminal UI using blessed/blessed-contrib
- SQLite database for data storage
- Command pattern for extensibility

## License

ISC
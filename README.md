# SOLO-OS

<div align="center">
  <pre>
 ███████╗ ██████╗ ██╗      ██████╗        ██████╗ ███████╗
 ██╔════╝██╔═══██╗██║     ██╔═══██╗      ██╔═══██╗██╔════╝
 ███████╗██║   ██║██║     ██║   ██║█████╗██║   ██║███████╗
 ╚════██║██║   ██║██║     ██║   ██║╚════╝██║   ██║╚════██║
 ███████║╚██████╔╝███████╗╚██████╔╝      ╚██████╔╝███████║
 ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝        ╚═════╝ ╚══════╝
  </pre>
</div>

A nostalgic, terminal-based bulletin board system (BBS) for the Solo house in San Francisco. This system facilitates community building, knowledge sharing, and productivity tracking for solo founders while embracing the retro aesthetic of early computing.

## 📺 Screenshot

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                    │
│  ███████╗ ██████╗ ██╗      ██████╗        ██████╗ ███████╗                        │
│  ██╔════╝██╔═══██╗██║     ██╔═══██╗      ██╔═══██╗██╔════╝                        │
│  ███████╗██║   ██║██║     ██║   ██║█████╗██║   ██║███████╗                        │
│  ╚════██║██║   ██║██║     ██║   ██║╚════╝██║   ██║╚════██║                        │
│  ███████║╚██████╔╝███████╗╚██████╔╝      ╚██████╔╝███████║                        │
│  ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝        ╚═════╝ ╚══════╝                        │
│                                                                                    │
│ Welcome to SOLO-OS - Terminal BBS for the Solo House!                              │
│                                                                                    │
│ Type help to see available commands                                                │
│                                                                                    │
│ Popular commands:                                                                  │
│   post (p) - Create a bulletin board post                                          │
│   guest (g) - Sign the guestbook                                                   │
│   make (m) - Create a new command                                                  │
│                                                                                    │
```

## ✨ Features

- 📟 Terminal-based UI with ASCII art branding
- 📝 Message board system with posts, announcements, and status updates
- 📖 Digital guestbook for visitors
- 👤 User profiles with activity tracking
- 📊 Weekly accountability system for founders
- 🔧 Extensible command system that allows users to create new commands

## 🚀 Core Commands

- `help` (H) - View available commands
- `login` (L) - Log into the system
- `post` (P) - Create and view bulletin board posts
- `announce` (A) - Send notifications to all users
- `status` (S) - Update your quick status
- `guest`/`guestbook`/`gb` (G) - View or sign the digital guestbook
- `weekly` (W) - Create and view weekly accountability posts 
- `make` (M/MK) - Create new custom commands

## 💻 Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/solo-os.git
cd solo-os

# Install dependencies
npm install

# Create symlink to make the command available globally
npm run link

# Run the BBS
solo-os

# Or try the simplified CLI version for testing
npm run cli
```

## 🧑‍💻 Development

```bash
# Run in development mode with auto-reload
npm run dev
```

## 🏠 About the Solo House

Solo is a house in San Francisco's Mission district where 6-7 solo founders live together for 3-month cohorts. The house provides both living quarters and an office space, creating a collaborative environment for independent entrepreneurs.

The SOLO-OS system was created to provide a fun, nostalgic way for residents and visitors to connect, share information, and maintain accountability for their projects.

## 🔍 Technical Details

- Built with Node.js
- Terminal UI using blessed/blessed-contrib
- SQLite database for data storage
- Command pattern for extensibility

## 📄 Documentation

For more detailed documentation and examples, see [USAGE.md](USAGE.md).

## 📝 License

ISC
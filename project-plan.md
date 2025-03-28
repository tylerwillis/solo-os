# SOLO-OS: Terminal-based Bulletin Board System

## Vision
Create a nostalgic, terminal-based bulletin board system (BBS) called "SOLO-OS" for the Solo house residents and visitors. This system will facilitate community building, knowledge sharing, and productivity tracking while embracing the retro aesthetic of early computing and the unix/linux themes associated with the "mkdir" brand.

## User Personas

1. **Solo Founder (Resident)**
   - 20-40 years old
   - Living in the house for a 3-month cohort
   - Building a company independently
   - Needs: Productivity tools, community connection, resource sharing

2. **Mentor**
   - Industry expert visiting to provide guidance
   - Delivers talks and workshops
   - Needs: Way to share materials, gather questions, leave lasting advice

3. **Guest/Friend**
   - Working from the house temporarily
   - May collaborate with residents
   - Needs: Quick onboarding, way to connect and contribute

## Core Features

### 1. Terminal Interface
- ASCII art welcome screen with Solo and mkdir branding
- Command-line interface with unix-style commands
- Color ANSI text support
- Keyboard navigation
- Command history and autocompletion

### 2. Message System
- `post` (P): Create bulletin board posts
- `announce` (A): Send notifications to all users
- `status` (S): Update quick status message
- Board categories: general, cohort-specific, mentors
- Integration with real terminal `wall` command

### 3. User Management
- User registration with `register` command
- Advanced secure login with:
  - Complete password isolation during sensitive operations
  - Password masking with asterisks in both terminal UI and CLI modes
  - Prevention of keystroke leakage to command processor
  - Robust error handling and state management
- Password confirmation during registration with identical security measures
- User roles (admin and regular users)
- Administrative user management with `admin` command

### 4. User Profiles
- Bio/current project description
- Contact information
- Automatic activity tracking (posts, commands created)
- Status display
- Simplified profile editing (`profile edit bio <text>`)
- Admin ability to edit other profiles

### 5. Visitor Features
- `guest`/`guestbook`/`gb` (G): Digital guestbook for visitors
- Visitor announcements/introductions

### 6. Founder Tools
- Weekly accountability post system
  - Record what you did last week
  - Plan what you'll do next week
  - Celebrate wins and milestones

### 7. Extensibility
- `make` (M/MK): Create new commands within the system
  - Automatically adds to help documentation
  - Prompts for help text and implementation code
  - Allows the community to extend the system organically

## Technical Architecture

### System Components
1. **Backend**
   - Node.js server
   - SQLite database for simplicity and portability
   - File storage system
   - Authentication service with secure password handling

2. **Frontend/Client**
   - Terminal-based TUI using blessed/blessed-contrib
   - CLI-based alternative interface for compatibility
   - ANSI color support
   - Keyboard shortcut system
   - Enhanced secure password handling:
     - Advanced password masking in both TUI and CLI modes
     - Raw mode management for secure input processing
     - Keypress event interception for character-by-character control
     - Secure terminal state management throughout authentication
     - Multi-layered input handling for maximum security and usability

3. **Infrastructure**
   - Local network hosting on house server
   - GitHub repository for sharing and contributions
   - Simple installation process via npm

### Command Structure
Simplified and consolidated command set with subcommands:

#### Core Commands
- `help` (H): View available commands and usage information
- `login` (L): Log into the system with password obfuscation
- `logout`: Log out from the system
- `quit`/`exit`: Safely exit the application
- `clear`/`cls`: Clear the terminal screen

#### User Commands
- `user` (U): User management and profiles
  - `user list`: List all users in the system (replaces `users`/`list-users`/`who`)
  - `user profile [username]`: View a user's profile (replaces `profile`/`pr`)
  - `user edit <field> <value>`: Edit your profile (replaces `profile edit`)
  - `user register <username>`: Register a new user (replaces `register`/`signup`/`reg`)

#### Content Commands
- `post` (P): Create and view various types of posts
  - `post list`: List recent posts
  - `post view <id>`: View a specific post
  - `post new <title> <content>`: Create a new post
  - `post announce <message>`: Send an announcement (replaces `announce`)
  - `post status <message>`: Update your status (replaces `status`)
  - `post weekly`: Weekly accountability posts (replaces `weekly`)

- `guest` (G): Guestbook functionality
  - `guest list`: View guestbook entries
  - `guest sign <name> <message>`: Sign the guestbook

#### Admin Commands
- `admin` (A): Administrative functions
  - `admin promote <username>`: Promote user to admin (replaces `promote`)
  - `admin demote <username>`: Demote user from admin (replaces `demote`)
  - `admin edit <username> <field> <value>`: Edit another user's profile

#### System Commands
- `system` (SYS): System operations
  - `system info`: Show system information
  - `system make <name>`: Create a new command (replaces `make`)

## Implementation Status

### Phase 1: Core Infrastructure ✅
- Set up development environment
- Implement basic terminal UI
- Create user authentication system
- Develop database schema
- Implement basic command structure

### Phase 2: Essential Features ✅
- Message system (post, announce, status)
- User profiles
- Guestbook functionality
- Help system and command discovery

### Phase 3: Enhanced Features ✅
- Weekly accountability posts
- Make command for extensibility
- User registration system
- Advanced profile editing
- Password security with obfuscation

### Phase 4: Administrative Features & Polish ✅
- Admin user management
- User role hierarchy
- GitHub repository setup
- Documentation and onboarding materials
- Personalized content for Tyler Willis

## Branding & Experience

### Design Principles
1. **Nostalgic but Functional**: Embrace retro aesthetics while ensuring modern usability
2. **Minimal but Expressive**: Use ASCII art and limited color palette effectively
3. **Unix Philosophy**: Simple, modular tools that do one thing well
4. **Community-Focused**: Features that facilitate connections and collaboration
5. **Extensible**: Allow users to extend the system with new commands
6. **Secure**: Modern security practices with nostalgic UI

### Visual Elements
- Custom ASCII art Solo house logo
- mkdir-themed welcome screen
- Consistent color scheme (limited palette for authentic BBS feel)
- Custom prompts and system messages

## Current Status
SOLO-OS is now fully implemented with all planned features, plus additional security, administrative capabilities, and improved usability. The system is available on GitHub at github.com/tylerwillis/solo-os and can be installed and run on any system with Node.js using the simple `solo` command.

### Latest Improvements
- **Consolidated Command Structure**: Simplified user experience with logical command groupings
- **Consistent Subcommand Pattern**: All commands now follow the same `command subcommand [args]` pattern
- **Advanced Password Security**: 
  - Complete isolation of password input from regular command processing
  - Secure password masking with asterisks in both TUI and CLI modes
  - Prevention of keystroke leakage during sensitive operations
  - Robust error handling and recovery for all authentication flows
  - Safe terminal state management throughout login and registration
- **Fixed Text Formatting**: Proper newline handling and consistent output formatting
- **Enhanced Error Handling**: Better validation and error reporting
- **System Command**: Added system info and improved command creation
- **Backward Compatibility**: Maintained old command aliases for ease of transition
- **Perfected CLI Password Handling**:
  - Redesigned password input system that maintains the readline interface
  - Fixed double character rendering during password entry
  - Implemented proper raw mode management for secure input
  - Eliminated issues with input after authentication
  - Added comprehensive error recovery mechanisms
  - Enhanced keypress event handling for secure character processing

## Future Expansion Ideas
- Integration with productivity tools (GitHub, Notion, etc.)
- Mobile access client
- API for custom integrations
- Voice announcements via house speakers
- More robust database with migration support
- Enhanced file sharing capabilities
- Multi-user chat functionality
- Enhanced search capabilities across all content types
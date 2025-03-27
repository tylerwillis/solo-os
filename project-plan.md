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
- Secure login with password obfuscation
- Password confirmation during registration
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
   - Password obfuscation in terminal

3. **Infrastructure**
   - Local network hosting on house server
   - GitHub repository for sharing and contributions
   - Simple installation process via npm

### Command Structure
Core command set with abbreviations:

- `help` (H): View available commands
- `login` (L): Log into the system with password obfuscation
- `logout`: Log out from the system
- `register`/`signup`/`reg`: Create a new user account
- `post` (P): Create a new post
- `announce` (A): Send notification to all users
- `status` (S): Update your quick status
- `make` (M/MK): Create a new command
- `guest`/`guestbook`/`gb` (G): View or sign guestbook
- `weekly` (W): Create weekly accountability post
- `profile`/`pr`: View or update user profile
- `admin`: Manage user roles and permissions (admin only)

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
SOLO-OS is now fully implemented with all planned features, plus additional security and administrative capabilities. The system is available on GitHub at github.com/tylerwillis/solo-os and can be installed and run on any system with Node.js.

## Future Expansion Ideas
- Integration with productivity tools (GitHub, Notion, etc.)
- Mobile access client
- API for custom integrations
- Voice announcements via house speakers
- More robust database with migration support
- Enhanced file sharing capabilities
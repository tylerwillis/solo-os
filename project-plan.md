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

### 3. User Profiles
- Bio/current project description
- Contact information
- Automatic activity tracking (posts, commands created)
- Status display

### 4. File Exchange
- Upload/download resources (articles, tools, code snippets)
- Mentor presentation materials
- Tagging and search functionality

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
   - Authentication service

2. **Frontend/Client**
   - Terminal-based TUI using a library like blessed/blessed-contrib
   - ANSI color support
   - Keyboard shortcut system
   - Offline capability for basic functions

3. **Infrastructure**
   - Local network hosting on house server
   - Optional cloud backup
   - Simple installation process

### Command Structure
Core command set with abbreviations:

- `help` (H): View available commands
- `login` (L): Log into the system
- `post` (P): Create a new post
- `announce` (A): Send notification to all users
- `status` (S): Update your quick status
- `ls`: List resources or users
- `cat`: View a post or resource
- `make` (M/MK): Create a new command
- `guest`/`guestbook`/`gb` (G): View or sign guestbook
- `weekly` (W): Create weekly accountability post
- `profile` (PR): View or update user profile

## Implementation Plan

### Phase 1: Core Infrastructure (Weeks 1-2)
- Set up development environment
- Implement basic terminal UI
- Create user authentication system
- Develop database schema
- Implement basic command structure

### Phase 2: Essential Features (Weeks 3-4)
- Message system (post, announce, status)
- User profiles
- Guestbook functionality
- Help system and command discovery

### Phase 3: Enhanced Features (Weeks 5-6)
- Weekly accountability posts
- File sharing system
- Make command for extensibility
- Search functionality

### Phase 4: Polish & Testing (Weeks 7-8)
- Performance optimization
- Documentation and onboarding materials
- Beta testing with house residents
- Bug fixes and usability improvements

## Branding & Experience

### Design Principles
1. **Nostalgic but Functional**: Embrace retro aesthetics while ensuring modern usability
2. **Minimal but Expressive**: Use ASCII art and limited color palette effectively
3. **Unix Philosophy**: Simple, modular tools that do one thing well
4. **Community-Focused**: Features that facilitate connections and collaboration
5. **Extensible**: Allow users to extend the system with new commands

### Visual Elements
- Custom ASCII art Solo house logo
- mkdir-themed welcome screen
- Consistent color scheme (limited palette for authentic BBS feel)
- Custom prompts and system messages

## Success Metrics
- Daily active users (% of house residents)
- Posts per user per week
- Custom commands created
- Visitor engagement (guestbook entries)
- Feature usage statistics
- Qualitative feedback from residents

## Future Expansion Ideas
- Integration with productivity tools (GitHub, Notion, etc.)
- Mobile access client
- API for custom integrations
- Voice announcements via house speakers
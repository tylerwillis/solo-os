# Contributing to SOLO-OS

Thank you for your interest in contributing to SOLO-OS! This document provides guidelines for contributions to the project.

## Code of Conduct

Be kind, respectful, and considerate of others. We're building a fun, inclusive system for the Solo house community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant screenshots or error messages
- Your environment (OS, Node.js version, etc.)

### Suggesting Features

Have an idea for a new feature? Create an issue with:

- A clear, descriptive title
- Detailed description of the feature
- Any relevant examples, mockups, or use cases
- How this feature benefits the Solo house community

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests and ensure your code follows the project style
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

## Development Guidelines

### Command Structure

When adding a new command, follow the existing pattern:

1. Create a new file in `src/commands/`
2. Export a `register` function that registers the command
3. Implement a handler function for the command
4. Use the theme colors for consistent UI
5. Update help documentation

Example:

```javascript
const { registerCommand } = require('./index');
const { theme } = require('../ui/terminal');

function exampleHandler(args, context) {
  // Command implementation
  return theme.success('Command executed successfully');
}

function register() {
  registerCommand('example', {
    description: 'An example command',
    usage: 'example [args]',
    aliases: ['ex'],
    handler: exampleHandler
  });
}

module.exports = {
  register
};
```

### Styling Guidelines

- Use 2 spaces for indentation
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing patterns in the codebase

### Testing

- Test your changes manually before submitting a PR
- Ensure your command works in both the terminal UI and CLI versions
- Verify error handling and edge cases

## Getting Help

If you need help with contributing, feel free to:

- Ask questions in the GitHub issues
- Reach out to the project maintainers
- Ask other residents of the Solo house for guidance

Thank you for helping make SOLO-OS better!
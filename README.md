# Claude Code Toolkit

Productivity tools for Claude Code development workflows.

## Features

### 📝 Slash Commands

#### `/claude-code-toolkit:dev-docs`
Create comprehensive strategic plans with structured task breakdown.

**Usage**:
```
/claude-code-toolkit:dev-docs refactor authentication system
/claude-code-toolkit:dev-docs implement microservices architecture
```

**What it does**:
- Analyzes requirements and context
- Examines relevant files
- Creates actionable, structured plans
- Breaks down complex tasks into phases
- Provides implementation guidance

#### `/claude-code-toolkit:dev-docs-update`
Update development documentation before context compaction.

**Usage**:
```
/claude-code-toolkit:dev-docs-update
/claude-code-toolkit:dev-docs-update focus on API changes
```

**What it does**:
- Reviews recent changes
- Updates project documentation
- Maintains development context
- Prepares for context optimization

### 🪝 Automation Hooks

#### Skill Activation Prompt
**Event**: `UserPromptSubmit`

Automatically suggests relevant skills based on your prompts by analyzing keywords and intent patterns.

**Features**:
- Keyword matching for skill activation
- Intent pattern recognition
- Priority-based skill suggestions (Critical, Recommended, Suggested, Optional)
- Configurable via `.claude/skills/skill-rules.json`

#### Post-Tool-Use Tracker
**Event**: `PostToolUse` (Edit, MultiEdit, Write)

Tracks file modifications and automatically detects available Python/UV project commands.

**Features**:
- Monitors Python project edits
- Auto-detects project structure
- Identifies available commands (ruff, pytest, mypy, etc.)
- Session-based file tracking
- Smart skip patterns for cache/generated files

See [hooks/README.md](claude-code-toolkit/hooks/README.md) for detailed hook documentation.

## Installation

### 1. Add Marketplace

In Claude Code settings:
```
Settings → Plugins → Add Marketplace
```

Add this GitHub repository:
```
https://github.com/drag88/claude-code-toolkit
```

Or using command:
```
/plugin marketplace add drag88/claude-code-toolkit
```

### 2. Install Plugin

```
/plugin install claude-code-toolkit
```

### 3. Verify Installation

Commands should now be available:
```
/claude-code-toolkit:dev-docs
/claude-code-toolkit:dev-docs-update
```

Hooks will activate automatically on configured events.

## Configuration

### Hook Dependencies

Install TypeScript dependencies for hooks:
```bash
cd ~/.claude/plugins/claude-code-toolkit/hooks/
npm install
```

### Skill Rules Configuration

To enable skill activation suggestions, create `.claude/skills/skill-rules.json` in your project:

```json
{
  "version": "1.0.0",
  "skills": {
    "your-skill": {
      "type": "domain",
      "enforcement": "suggest",
      "priority": "high",
      "description": "Your skill description",
      "promptTriggers": {
        "keywords": ["keyword1", "keyword2"],
        "intentPatterns": ["(create|generate).*?pattern"]
      }
    }
  }
}
```

## Requirements

- **Claude Code**: Latest version
- **Node.js**: For TypeScript hooks
- **jq**: For JSON parsing in bash hooks
- **UV**: For Python project command detection (optional)

## Project Structure

```
claude-code-toolkit/
├── .claude-plugin/
│   └── marketplace.json       # Marketplace configuration
├── claude-code-toolkit/
│   ├── commands/
│   │   ├── dev-docs.md       # Strategic planning command
│   │   └── dev-docs-update.md # Documentation update command
│   └── hooks/
│       ├── hooks.json        # Hook configuration
│       ├── package.json      # TypeScript dependencies
│       ├── skill-activation-prompt.ts
│       ├── skill-activation-prompt.sh
│       ├── post-tool-use-tracker.sh
│       └── README.md         # Detailed hook documentation
├── README.md
└── LICENSE
```

## Use Cases

### Development Workflow
- Plan complex features with `/dev-docs`
- Automatic skill activation for specialized tasks
- Track file changes across sessions
- Auto-detect available project commands

### Python/UV Projects
- Automatic detection of ruff, pytest, mypy
- FastAPI dev server identification
- Project structure awareness
- Session-based command tracking

### Team Collaboration
- Consistent planning methodology
- Standardized documentation updates
- Shared hook configurations
- Reproducible development workflows

## Troubleshooting

### Commands Not Available
- Verify marketplace is added: Settings → Plugins → Marketplaces
- Reinstall plugin: `/plugin uninstall claude-code-toolkit` then `/plugin install claude-code-toolkit`
- Check plugin list: `/plugin list`

### Hooks Not Triggering
- Verify hook scripts are executable
- Check Node.js installation: `node --version`
- Install hook dependencies: `cd hooks/ && npm install`
- Review Claude Code logs for hook errors

### Skill Activation Not Working
- Create `.claude/skills/skill-rules.json` in your project
- Verify JSON syntax is valid
- Test with configured keywords in prompts

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Author

**Aswin Sreenivas**
- Email: awinsreenivas@gmail.com
- GitHub: [@drag88](https://github.com/drag88)

## Version History

- **1.0.0** (2025-01-11): Initial release
  - Strategic planning commands
  - Skill activation hook
  - Python project tracker hook

## Support

For issues or questions:
- Open an issue on [GitHub](https://github.com/drag88/claude-code-toolkit/issues)
- Check [hooks/README.md](claude-code-toolkit/hooks/README.md) for detailed documentation

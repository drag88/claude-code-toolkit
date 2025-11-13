# Claude Code Toolkit Hooks

This directory contains event hooks that automate workflows in Claude Code.

## Available Hooks

### 1. Setup Skill Rules (`setup-skill-rules`)

**Event**: `SessionStart`

**Purpose**: Automatically initializes or updates `.claude/skills/skill-rules.json` by analyzing your project and asking clarifying questions.

**How it works**:
- Runs at the start of each Claude Code session
- Analyzes project dependencies (`package.json`, `pyproject.toml`, `requirements.txt`)
- Examines directory structure to detect project type (Frontend, Backend, Data Science, etc.)
- Scans README.md for project objectives
- Detects existing skills in `.claude/skills/` directory
- Identifies relevant technologies and frameworks
- Generates or updates skill-rules.json with appropriate configurations

**Intelligent Behavior**:
- **First run**: Prompts Claude to ask about project goals and generate initial skill-rules.json
- **Existing config**: Detects project changes (new dependencies, structure changes) and offers updates
- **Up-to-date**: Runs silently without output when no changes detected
- **Interactive**: Works with Claude to gather user preferences through Q&A

**What it detects**:
- **Technologies**: React, Vue, Angular, Next.js, Django, FastAPI, TensorFlow, etc.
- **Project types**: Frontend, Backend, API, Testing, Data Science, Documentation
- **Structure**: frontend/, backend/, tests/, docs/, scripts/, database/ directories
- **Existing skills**: Any custom skills already defined in `.claude/skills/`

**Generated skill-rules.json includes**:
- Auto-detected skills based on project analysis
- Appropriate enforcement levels (critical/recommend/suggest)
- Priority levels (high/medium/low)
- Smart keyword triggers relevant to your tech stack
- Intent pattern matching for natural language prompts

**Requirements**:
- Node.js and npm/npx available in environment
- Project files to analyze (package.json, README.md, etc.)

**Example Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SKILL RULES SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Analyzing Project
  → Detected project types: Frontend, Backend
  → Detected technologies: React, FastAPI, Pytest
  → Found existing skills: custom-skill-1

📚 Initial Setup
No skill rules found. Setting up for the first time.

ACTION: Ask user about project goals and generate skill-rules.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**For other users installing this toolkit**:
This hook makes it easy for new users to get started. When they clone a project using this toolkit, the hook will automatically:
1. Detect what kind of project it is
2. Prompt Claude to ask about their specific needs
3. Generate a customized skill-rules.json tailored to their project
4. Keep it updated as the project evolves

### 2. Skill Activation Prompt (`skill-activation-prompt`)

**Event**: `UserPromptSubmit`

**Purpose**: Automatically suggests relevant skills based on user prompts by analyzing keywords and intent patterns.

**How it works**:
- Reads `.claude/skills/skill-rules.json` from your project
- Matches user prompts against configured keywords and intent patterns
- Displays prioritized skill suggestions (Critical, Recommended, Suggested, Optional)
- Helps Claude proactively activate the right skills for each task

**Requirements**:
- Project must have `.claude/skills/skill-rules.json` configured
- Node.js and npm/npx available in environment

**Example Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SKILL ACTIVATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 RECOMMENDED SKILLS:
  → starhub-comms
  → starhub-campaign-creatives

ACTION: Use Skill tool BEFORE responding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Post-Tool-Use Tracker (`post-tool-use-tracker`)

**Event**: `PostToolUse` (Edit, MultiEdit, Write)

**Purpose**: Tracks file modifications and automatically detects available Python/UV project commands.

**How it works**:
- Monitors file edits in Python projects
- Detects project structure (backend, frontend, tests, etc.)
- Identifies available commands from `pyproject.toml`:
  - `ruff format` and `ruff check` (formatting/linting)
  - `pytest` (testing)
  - `mypy` (type checking)
  - `black` (alternative formatter)
  - `uvicorn` (FastAPI dev server)
- Stores available commands in `.claude/tsc-cache/`
- Logs edited files for session tracking

**Detected Project Types**:
- Backend: `backend/`, `server/`, `api/`, `src/`, `app/`
- Frontend: `frontend/`, `client/`, `web/`, `ui/`
- Tests: `tests/`, `test/`
- Scripts: `scripts/`, `tools/`, `bin/`
- Database: `database/`, `migrations/`, `alembic/`

**Requirements**:
- Python projects with `pyproject.toml`
- UV package manager installed
- `jq` command available for JSON parsing

**Skip Patterns**:
- Markdown files (`.md`, `.markdown`)
- Python cache files (`__pycache__`, `.pyc`, `.pyo`, `.pyd`, `.egg-info`)

## Configuration

Hooks are configured in `hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/setup-skill-rules.sh"
      }]
    }],
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/skill-activation-prompt.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Edit|MultiEdit|Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/post-tool-use-tracker.sh"
      }]
    }]
  }
}
```

## Environment Variables

- `${CLAUDE_PROJECT_DIR}`: Current project directory (provided by Claude Code)

## Dependencies

Install TypeScript dependencies:
```bash
cd hooks/
npm install
```

## Customization

### Adding New Skill Rules

Create or update `.claude/skills/skill-rules.json` in your project:

```json
{
  "version": "1.0.0",
  "skills": {
    "your-skill-name": {
      "type": "domain",
      "enforcement": "suggest",
      "priority": "high",
      "description": "What your skill does",
      "promptTriggers": {
        "keywords": ["keyword1", "keyword2"],
        "intentPatterns": [
          "(create|generate).*?(something)"
        ]
      }
    }
  }
}
```

### Extending Post-Tool-Use Tracker

Modify `post-tool-use-tracker.sh` to:
- Add new project type detection in `detect_repo()`
- Add new command detection in `get_python_commands()`
- Change skip patterns for different file types

## Troubleshooting

**Setup skill rules not generating:**
- Check Node.js is available: `node --version`
- Verify npx is working: `npx --version`
- Ensure hook script is executable: `chmod +x setup-skill-rules.sh`
- Check for errors in Claude Code console

**Skill activation not working:**
- Verify `.claude/skills/skill-rules.json` exists in project
- Run setup hook manually if needed (it should auto-run on SessionStart)
- Check JSON syntax is valid
- Ensure keywords/patterns match your prompts

**Post-tool-use tracker not detecting commands:**
- Verify `pyproject.toml` exists in project
- Check dependencies are listed in `pyproject.toml`
- Ensure UV is installed: `uv --version`

**Hook execution errors:**
- Check hook scripts are executable: `chmod +x *.sh`
- Verify `jq` is installed: `jq --version`
- Check Node.js is available: `node --version`

## For Repository Maintainers

When users clone this repository and use it in their own projects:

1. **Automatic Setup**: The `setup-skill-rules` hook will run automatically on their first session
2. **Project Detection**: It will analyze their specific project structure and dependencies
3. **Interactive Configuration**: Claude will ask them questions to understand their needs
4. **Customized Output**: A skill-rules.json will be generated tailored to their project
5. **Continuous Updates**: As their project evolves, the hook will offer to update the configuration

This makes the toolkit immediately useful for new users without manual configuration!

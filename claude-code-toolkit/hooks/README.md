# Claude Code Toolkit Hooks

This directory contains event hooks that automate workflows in Claude Code.

## Available Hooks

### 1. Skill Activation Prompt (`skill-activation-prompt`)

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

### 2. Post-Tool-Use Tracker (`post-tool-use-tracker`)

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
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/skill-activation-prompt.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Edit|MultiEdit|Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/post-tool-use-tracker.sh"
      }]
    }]
  }
}
```

## Environment Variables

- `${CLAUDE_PLUGIN_ROOT}`: Plugin installation directory (provided by Claude Code)
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

**Skill activation not working:**
- Verify `.claude/skills/skill-rules.json` exists in project
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

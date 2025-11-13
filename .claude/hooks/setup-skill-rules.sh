#!/bin/bash

# Setup Skill Rules Hook
# Runs on SessionStart to initialize or update .claude/skills/skill-rules.json

# Exit on error, but don't fail the hook
set +e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if npx is available
if ! command -v npx &> /dev/null; then
    exit 0
fi

# Run TypeScript script
npx --yes tsx "${SCRIPT_DIR}/setup-skill-rules.ts" 2>/dev/null

exit 0

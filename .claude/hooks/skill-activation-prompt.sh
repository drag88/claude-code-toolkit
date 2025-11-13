#!/bin/bash
set -e

cd "${CLAUDE_PLUGIN_ROOT}/hooks"
cat | npx tsx skill-activation-prompt.ts

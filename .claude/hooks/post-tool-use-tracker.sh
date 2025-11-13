#!/bin/bash
set -e

# Post-tool-use hook for Python/UV projects
# Tracks edited files and manages Python commands


# Read tool information from stdin
tool_info=$(cat)


# Extract relevant data
tool_name=$(echo "$tool_info" | jq -r '.tool_name // empty')
file_path=$(echo "$tool_info" | jq -r '.tool_input.file_path // empty')
session_id=$(echo "$tool_info" | jq -r '.session_id // empty')


# Skip if not an edit tool or no file path
if [[ ! "$tool_name" =~ ^(Edit|MultiEdit|Write)$ ]] || [[ -z "$file_path" ]]; then
    exit 0
fi

# Skip markdown files
if [[ "$file_path" =~ \.(md|markdown)$ ]]; then
    exit 0
fi

# Skip Python cache and generated files
if [[ "$file_path" =~ (__pycache__|\.pyc$|\.pyo$|\.pyd$|\.egg-info) ]]; then
    exit 0
fi

# Create cache directory
cache_dir="$CLAUDE_PROJECT_DIR/.claude/tsc-cache/${session_id:-default}"
mkdir -p "$cache_dir"

# Function to detect repo from file path (Python project structure)
detect_repo() {
    local file="$1"
    local project_root="$CLAUDE_PROJECT_DIR"
    local relative_path="${file#$project_root/}"
    local repo=$(echo "$relative_path" | cut -d'/' -f1)

    case "$repo" in
        # Backend variations
        backend|server|api|src|app)
            echo "$repo"
            ;;
        # Frontend variations
        frontend|client|web|ui)
            echo "$repo"
            ;;
        # Tests directory
        tests|test)
            echo "$repo"
            ;;
        # Scripts/tools
        scripts|tools|bin)
            echo "$repo"
            ;;
        # Database/migrations
        database|migrations|alembic)
            echo "$repo"
            ;;
        *)
            # Check if it's a source file in root
            if [[ ! "$relative_path" =~ / ]]; then
                echo "root"
            else
                echo "unknown"
            fi
            ;;
    esac
}

# Function to get Python commands for repo
get_python_commands() {
    local repo="$1"
    local project_root="$CLAUDE_PROJECT_DIR"
    local repo_path="$project_root/$repo"

    # Use root if repo is root
    if [[ "$repo" == "root" ]]; then
        repo_path="$project_root"
    fi

    local commands=()

    # Check for pyproject.toml (UV project indicator)
    if [[ -f "$repo_path/pyproject.toml" ]]; then
        # Ruff format command
        if grep -q 'ruff' "$repo_path/pyproject.toml" 2>/dev/null; then
            commands+=("$repo:ruff-format:cd $repo_path && uv run ruff format .")
            commands+=("$repo:ruff-check:cd $repo_path && uv run ruff check . --fix")
        fi

        # Pytest command
        if grep -q 'pytest' "$repo_path/pyproject.toml" 2>/dev/null; then
            # Check if it's the root backend directory with special PYTHONPATH requirement
            if [[ "$repo" == "backend" ]] && [[ -f "$project_root/pyproject.toml" ]]; then
                commands+=("$repo:pytest:cd $project_root && PYTHONPATH=\"\$PWD/backend\" uv run python -m pytest")
            else
                commands+=("$repo:pytest:cd $repo_path && uv run pytest")
            fi
        fi

        # Mypy command
        if grep -q 'mypy' "$repo_path/pyproject.toml" 2>/dev/null; then
            commands+=("$repo:mypy:cd $repo_path && uv run mypy .")
        fi

        # Black formatter (if used instead of ruff)
        if grep -q 'black' "$repo_path/pyproject.toml" 2>/dev/null && ! grep -q 'ruff' "$repo_path/pyproject.toml" 2>/dev/null; then
            commands+=("$repo:black:cd $repo_path && uv run black .")
        fi

        # Build command (if package is buildable)
        if grep -q '\[build-system\]' "$repo_path/pyproject.toml" 2>/dev/null; then
            commands+=("$repo:build:cd $repo_path && uv run python -m build")
        fi
    fi

    # FastAPI specific: Check for main.py or app/main.py
    if [[ -f "$repo_path/main.py" ]] || [[ -f "$repo_path/app/main.py" ]]; then
        if grep -q 'fastapi\|uvicorn' "$repo_path/pyproject.toml" 2>/dev/null || grep -q 'from fastapi' "$repo_path"/*.py 2>/dev/null; then
            commands+=("$repo:dev-server:cd $repo_path && uv run uvicorn main:app --reload")
        fi
    fi

    # Output commands
    for cmd in "${commands[@]}"; do
        echo "$cmd"
    done
}

# Detect repo
repo=$(detect_repo "$file_path")

# Skip if unknown
[[ "$repo" == "unknown" ]] || [[ -z "$repo" ]] && exit 0

# Log edited file
echo "$(date +%s):$file_path:$repo" >> "$cache_dir/edited-files.log"

# Update affected repos
if ! grep -q "^$repo$" "$cache_dir/affected-repos.txt" 2>/dev/null; then
    echo "$repo" >> "$cache_dir/affected-repos.txt"
fi

# Store commands
python_cmds=$(get_python_commands "$repo")

if [[ -n "$python_cmds" ]]; then
    echo "$python_cmds" >> "$cache_dir/commands.txt.tmp"
fi

# Remove duplicates
if [[ -f "$cache_dir/commands.txt.tmp" ]]; then
    sort -u "$cache_dir/commands.txt.tmp" > "$cache_dir/commands.txt"
    rm -f "$cache_dir/commands.txt.tmp"
fi

exit 0

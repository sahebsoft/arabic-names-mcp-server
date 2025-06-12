#!/bin/bash

# Set up logging
LOG_FILE="/srv/projects/arabic-names/mcp-server/claude_cron.log"
ERROR_LOG="/srv/projects/arabic-names/mcp-server/claude_cron_error.log"


export HOME="/home/ubuntu" 
export USER="ubuntu"
export PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.local/bin:$HOME/bin"
export SHELL="/bin/bash"

# Add timestamp to logs
echo "$(date): Starting Claude Code job" >> "$LOG_FILE"

# Run Claude Code in print mode with your query
# Replace "your query here" with your actual task

#claude -p --dangerously-skip-permissions --permission-prompt-tool mcp__arabic-names__procces-names --permission-prompt-tool mcp__arabic-names__submit-name-details "procces 1 arabic name , and submit its details"  >> "$LOG_FILE" 2>> "$ERROR_LOG"

# Log completion
echo "$(date): Claude Code job completed" >> "$LOG_FILE"
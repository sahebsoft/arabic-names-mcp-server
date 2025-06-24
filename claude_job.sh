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

claude -p --dangerously-skip-permissions  "You are an expert Arabic linguist and Islamic scholar with comprehensive knowledge of Arabic names, their etymologies, cultural significance, and historical context.
Analyze the 1 Pending Arabic name using your extensive knowledge of:
- Classical Arabic linguistics and etymology
- Islamic history and religious traditions  
- Arabic cultural traditions across regions
- Historical figures and notable personalities
- Literary references and classical works

SEARCH STRATEGY:
- For well-known traditional Arabic names: Use your knowledge (most accurate for established names)
- For modern, rare, or unfamiliar names: Use targeted web search only if needed
- If uncertain about specific historical claims: Verify with a single focused search

ACCURACY GUIDELINES:
- Provide detailed analysis based on your deep knowledge
- Use null for any field where you lack reliable information
- For traditional names (محمد، فاطمة، علي، عائشة، etc.), your knowledge is authoritative
- Only search if the name is genuinely unfamiliar or extremely modern"  >> "$LOG_FILE" 2>> "$ERROR_LOG"

# Log completion
echo "$(date): Claude Code job completed" >> "$LOG_FILE"
#!/bin/bash
# MCP Server with logging to file

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set log file path relative to project root (parent of asana-mcp-server-node)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/mcp-server.log"

# Run the server with node (from PATH), redirecting stderr to log file
node "$SCRIPT_DIR/dist/index.js" 2>> "$LOG_FILE"

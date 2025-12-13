#!/bin/bash
# MCP Server with logging to file
LOG_FILE="/Users/fumiharu/dev/mcp-asana/mcp-server.log"
/Users/fumiharu/.nvm/versions/node/v22.21.1/bin/node /Users/fumiharu/dev/mcp-asana/asana-mcp-server-node/dist/index.js 2>> "$LOG_FILE"

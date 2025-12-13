# Asana MCP Server (Node.js/TypeScript)

MCP (Model Context Protocol) server implementation for Asana task management, built with Node.js and TypeScript.

This is the Node.js/TypeScript version of the Asana MCP server. A Python version is also available in the parent directory.

## Features

- **Resources**: Browse tasks by workspace with URI-based access
- **Tools**: 6 powerful tools for task management
  - Get tasks assigned to you
  - Search tasks by keywords
  - Create new tasks
  - Update existing tasks
  - Get detailed task information
  - Add comments to tasks

## Prerequisites

- Node.js >= 16.0.0
- npm (comes with Node.js)
- Asana account with API access token

## Installation

### Development Mode (recommended for local development)

```bash
cd asana-mcp-server-node
npm install
npm run build
```

### Production Mode

```bash
cd asana-mcp-server-node
npm install
npm run build
```

## Configuration

### 1. Get Your Asana Access Token

1. Go to [Asana Developer Console](https://app.asana.com/0/my-apps)
2. Click "Create new personal access token"
3. Give it a name and copy the token
4. Keep this token secure - you'll need it for configuration

### 2. Running Locally (Standalone)

You can run the MCP server directly on your local machine for testing or development:

```bash
# Set your Asana access token
export ASANA_ACCESS_TOKEN="your_asana_personal_access_token_here"

# Run the server
npm start
```

Or in development mode with auto-reload:

```bash
export ASANA_ACCESS_TOKEN="your_asana_personal_access_token_here"
npm run dev
```

The server will start and communicate via stdio (standard input/output). It's designed to be used by MCP clients like Claude Desktop, Claude Code CLI, or VSCode.

**Note**: Running standalone is mainly useful for debugging. For actual usage, configure it with a client (see below).

### 3. Configure for Claude Desktop

Add the following to your Claude Desktop configuration file:

**Configuration file location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "asana": {
      "command": "node",
      "args": [
        "/absolute/path/to/asana-mcp-server-node/dist/index.js"
      ],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_personal_access_token_here"
      }
    }
  }
}
```

**Important**:
- Replace `/absolute/path/to/asana-mcp-server-node` with the actual absolute path to your installation directory
- Replace `your_asana_personal_access_token_here` with your actual Asana token
- Example path: `/Users/yourname/dev/mcp-asana/asana-mcp-server-node/dist/index.js`

After updating the configuration, restart Claude Desktop for the changes to take effect.

### 4. Configure for Claude Code CLI

Claude Code CLI uses a configuration file at `~/.claude/config.json`.

Add the following to your configuration:

```json
{
  "mcpServers": {
    "asana": {
      "command": "node",
      "args": [
        "/absolute/path/to/asana-mcp-server-node/dist/index.js"
      ],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_personal_access_token_here"
      }
    }
  }
}
```

**Quick setup steps**:

1. Create the config directory if it doesn't exist:
   ```bash
   mkdir -p ~/.claude
   ```

2. Create or edit `~/.claude/config.json`:
   ```bash
   nano ~/.claude/config.json

   # Or use your preferred editor
   code ~/.claude/config.json
   ```

3. Add the configuration above with your actual paths and token

4. Verify the configuration:
   ```bash
   # List available MCP servers
   claude mcp list
   ```

5. Use it in Claude Code:
   ```bash
   # Start a conversation with MCP access
   claude

   # Then ask: "Show me my Asana tasks"
   ```

### 5. Configure for VSCode

VSCode can use MCP servers through the Claude Code extension or other MCP-compatible extensions.

#### Option A: Using Claude Code Extension for VSCode

1. Install the Claude Code extension from the VSCode marketplace

2. Open VSCode settings (`Cmd + ,`)

3. Search for "Claude Code MCP"

4. Add the server configuration in `settings.json`:
   ```json
   {
     "claude.mcpServers": {
       "asana": {
         "command": "node",
         "args": [
           "/absolute/path/to/asana-mcp-server-node/dist/index.js"
         ],
         "env": {
           "ASANA_ACCESS_TOKEN": "your_asana_personal_access_token_here"
         }
       }
     }
   }
   ```

5. Reload VSCode window

#### Option B: Using .vscode/settings.json (Project-specific)

Create or edit `.vscode/settings.json` in your project root:

```json
{
  "claude.mcpServers": {
    "asana": {
      "command": "node",
      "args": [
        "/absolute/path/to/asana-mcp-server-node/dist/index.js"
      ],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_personal_access_token_here"
      }
    }
  }
}
```

**Security Note**: If using project-specific settings, be careful not to commit your access token to version control. Consider using environment variables or a `.env` file instead:

```json
{
  "claude.mcpServers": {
    "asana": {
      "command": "node",
      "args": [
        "/absolute/path/to/asana-mcp-server-node/dist/index.js"
      ],
      "env": {
        "ASANA_ACCESS_TOKEN": "${env:ASANA_ACCESS_TOKEN}"
      }
    }
  }
}
```

Then set the environment variable in your shell:
```bash
export ASANA_ACCESS_TOKEN="your_token_here"
```

## Usage

Once configured, you can interact with Asana through any MCP-compatible client:

### Example Prompts

These work in Claude Desktop, Claude Code CLI, or VSCode:

- "Show me my Asana tasks"
- "Create a new task called 'Review PR' in project XYZ"
- "Search for tasks containing 'bug fix'"
- "Update task 1234567890 to mark it as complete"
- "Add a comment to task 1234567890: 'Working on this now'"
- "Show me details for task 1234567890"

### Client-Specific Usage

**Claude Desktop**: Simply chat with Claude and use natural language commands like above.

**Claude Code CLI**:
```bash
claude
# Then type your requests in the interactive session
```

**VSCode**: Use the Claude Code extension's chat interface or command palette.

### Available Tools

1. **get_my_tasks**: Get tasks assigned to you
   - Optional: workspace_id, limit (default 50)

2. **search_tasks**: Search for tasks using keywords
   - Required: query
   - Optional: workspace_id

3. **create_task**: Create a new task
   - Required: name
   - Optional: notes, due_on (YYYY-MM-DD), project_id, workspace_id

4. **update_task**: Update an existing task
   - Required: task_id
   - Optional: name, notes, completed, due_on

5. **get_task_details**: Get full details of a task
   - Required: task_id

6. **add_comment**: Add a comment to a task
   - Required: task_id, text

### Resource URIs

The server exposes the following URI patterns for resource access:

- `asana://workspaces/{workspace_id}/tasks` - List tasks in a workspace
- `asana://tasks/{task_id}` - Get details of a specific task
- `asana://projects/{project_id}/tasks` - List tasks in a project

## Development

### Project Structure

```
asana-mcp-server-node/
├── src/
│   ├── index.ts        # Entry point
│   ├── client.ts       # Asana API client wrapper
│   ├── server.ts       # MCP server implementation
│   └── types.ts        # TypeScript type definitions
├── tests/
│   └── client.test.ts  # Unit tests
├── dist/               # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Run the server in development mode with ts-node
- `npm test` - Run tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run clean` - Remove compiled files

### Running Tests

```bash
npm test
```

### Testing with MCP Inspector

You can test the server interactively using the MCP Inspector:

```bash
ASANA_ACCESS_TOKEN=your_token npx @modelcontextprotocol/inspector node dist/index.js
```

This will open a web UI where you can test the server's resources and tools.

## Architecture

### Core Components

- **client.ts**: Singleton wrapper around the official Asana Node.js SDK
  - Handles authentication via environment variable
  - Provides 10 methods for Asana API operations
  - Implements workspace defaulting (uses first workspace if not specified)
  - Conditionally includes optional fields (e.g., notes only if provided)

- **server.ts**: MCP server implementation
  - 4 request handlers: list_resources, read_resource, list_tools, call_tool
  - URI parsing for resource access
  - Error handling to prevent protocol interruption
  - JSON response formatting

- **types.ts**: TypeScript interfaces
  - Asana entity types (User, Workspace, Task, Project, Story)
  - Tool input schemas
  - Type safety throughout the codebase

### Design Patterns

- **Singleton Pattern**: AsanaClient uses singleton pattern for single instance per process
- **Lazy Initialization**: Client created on first use, not at module load
- **Workspace Defaulting**: Automatically uses first workspace when not specified
- **Conditional Fields**: Only includes optional fields in API calls when provided
- **Error Wrapping**: Catches exceptions and returns as text content to avoid protocol errors

## Troubleshooting

### "ASANA_ACCESS_TOKEN environment variable is required"

Make sure you've added your Asana access token to your client's configuration file:
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Code CLI**: `~/.claude/config.json`
- **VSCode**: `settings.json` or `.vscode/settings.json`

Or set it as an environment variable when running standalone:
```bash
export ASANA_ACCESS_TOKEN="your_token_here"
```

### "No workspace found for user"

Your Asana account needs to have at least one workspace. Check your Asana account at https://app.asana.com

### TypeScript compilation errors

Make sure you have all dependencies installed:
```bash
npm install
```

Then rebuild:
```bash
npm run build
```

### Server not showing up in Claude Desktop

1. Check that the path in `claude_desktop_config.json` is absolute and correct
2. Make sure you've run `npm run build` to compile the TypeScript
3. Restart Claude Desktop after configuration changes
4. Check the Claude Desktop logs for error messages:
   - Log location: `~/Library/Logs/Claude/mcp*.log`

### Server not working in Claude Code CLI

1. Verify the configuration file exists:
   ```bash
   cat ~/.claude/config.json
   ```

2. Check that the path is absolute and correct

3. List configured MCP servers:
   ```bash
   claude mcp list
   ```

4. Test the server manually:
   ```bash
   ASANA_ACCESS_TOKEN="your_token" node dist/index.js
   ```

### Server not working in VSCode

1. Check VSCode settings:
   - Open settings (`Cmd + ,`)
   - Search for "Claude MCP"
   - Verify the configuration is correct

2. Check VSCode output logs:
   - View → Output
   - Select "Claude Code" from the dropdown

3. Reload VSCode window:
   - `Cmd + Shift + P` → "Reload Window"

### Permission denied errors

Make sure the compiled index.js is executable:
```bash
chmod +x dist/index.js
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Related Projects

- [Python Asana MCP Server](../asana-mcp-server) - Python implementation of the same server
- [MCP](https://modelcontextprotocol.io) - Model Context Protocol documentation
- [Asana API](https://developers.asana.com/docs) - Official Asana API documentation

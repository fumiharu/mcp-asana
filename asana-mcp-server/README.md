# Asana MCP Server

An MCP server to interact with Asana.

## Configuration

You need an Asana Personal Access Token (PAT).

## Usage

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "asana": {
      "command": "python",
      "args": ["-m", "asana_mcp_server"],
      "env": {
        "ASANA_ACCESS_TOKEN": "your_asana_pat_here"
      }
    }
  }
}
```

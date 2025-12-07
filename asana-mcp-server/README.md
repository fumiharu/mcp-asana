# Asana MCP Server

An MCP server to interact with Asana.

## Configuration

You need an Asana Personal Access Token (PAT).

## Running Locally

To run the server locally for development or testing:

1. Install dependencies:
   ```bash
   pip install .
   ```
   Or for development:
   ```bash
   pip install -e .
   ```

2. Run the server with your Asana PAT:
   ```bash
   ASANA_ACCESS_TOKEN=your_asana_pat_here python -m asana_mcp_server
   ```

## Debugging with MCP Inspector

To test the server using the MCP Inspector web interface:

```bash
ASANA_ACCESS_TOKEN=your_asana_pat_here npx @modelcontextprotocol/inspector python -m asana_mcp_server
```

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

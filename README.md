# MCP File-Server Connector

A sandboxed Model Context Protocol (MCP) server that provides AI agents with persistent file storage and a structured handoff protocol for multi-session tasks.

## Architecture

This server connects an MCP client (like Claude Desktop) to a local workspace.

*   **Runtime:** Node.js (compiled to `build/server.js`)
*   **Language:** TypeScript
*   **Routing:** Switch-statement based tool routing (`src/toolHandlers.ts`)
*   **Validation:** Strict path normalization to prevent directory traversal escapes.
*   **Tools:** 10 core tools handling file operations and workspace navigation.

## Setup Instructions

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Build the server:**
    ```bash
    npm run build
    ```
3.  **Connect to Claude Desktop:**
    Add the absolute path of `build/server.js` to your `claude_desktop_config.json` under the `mcpServers` object.

## Handoff Protocol

To prevent agents from overwriting each other, the workspace strictly enforces this structure:
*   `PROJECT_STATE.md`: The current source of truth. Read at session start, updated at session end.
*   `PLAN_LOG/`: Directory for numbered markdown plans before execution.
*   `CHECKPOINTS/`: Directory for progress records.
*   `DECISIONS/`: Directory for architectural or logic choices.

## Included Tools
*   `list_directory`, `read_file`, `write_file`, `replace_string`, `delete_file`, `move_file`, `read_chunk`, `search_workspace`, `generate_tree`, `read_handoff_state`.
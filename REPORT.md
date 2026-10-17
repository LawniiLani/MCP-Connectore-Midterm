# MCP File-Server Connector — Technical Report

## 1. Technology Stack and Architecture

**Runtime & Language:** Node.js with TypeScript (ES2022). TypeScript enforces strict type-checking on the JSON-RPC tool schemas, catching mismatches at compile time before they reach the agent. 

**Transport & Networking:** 
The server supports both standard I/O (for local desktop clients) and Server-Sent Events (SSE) over HTTP. The HTTP transport utilizes Express to handle routing and `@ngrok/ngrok` to programmaticly establish a secure tunnel, exposing the server to remote clients without requiring manual CLI tunnel configuration.

**Routing Architecture:**
Instead of chaining `if/else` conditions, the tool handler (`src/toolHandlers.ts`) uses a centralized `switch` statement (`routeToolCall`). This guarantees $O(1)$ dispatch time for tool execution and keeps the codebase modular—adding a new tool only requires appending a new case block and updating the schema array.

## 2. Tool Design Implementation

The server exposes 10 distinct tools designed around the principle of context conservation. 

*   **File Operations:** `list_directory`, `read_file`, `write_file`, `delete_file`, `move_file`. 
*   **Context Management:** `read_chunk` and `replace_string` allow the agent to read specific line ranges and surgically edit files without dumping entire file contents into the LLM context window. 
*   **Navigation:** `search_workspace` (exact string matching across all files) and `generate_tree` (visual directory mapping) replace complex shell commands.
*   **Protocol:** `read_handoff_state` explicitly targets `PROJECT_STATE.md` to orient the agent at the beginning of a session.

Every tool returns explicit success or error strings, leveraging the `isError` flag so the agent can autonomously recover from failures (e.g., trying to replace a string that does not exist).

## 3. Security and Sandboxing

Providing file system access to an autonomous agent requires strict boundaries. The server mitigates directory traversal and unauthorized access through the `enforceSandbox` function.

**Path Traversal Protection:**
Raw string manipulation is avoided. Every requested path is resolved into an absolute path using Node's `path.resolve`. 

```typescript
function enforceSandbox(requestedPath: string): string {
  const rootBoundary = path.resolve(WORKSPACE) + path.sep;
  const target = path.resolve(WORKSPACE, requestedPath);
  // ...
}
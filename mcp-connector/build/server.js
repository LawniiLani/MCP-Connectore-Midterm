import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import ngrok from "@ngrok/ngrok";
import { fileURLToPath } from "url";
import { availableTools, routeToolCall } from "./toolHandlers.js";
const __filename = fileURLToPath(import.meta.url);
const WORKSPACE = path.resolve(path.dirname(__filename), "../../workspace");
const TOKEN = process.env.MCP_AUTH_TOKEN || "dev-token-only";
function enforceSandbox(requestedPath) {
    const rootBoundary = path.resolve(WORKSPACE) + path.sep;
    const target = path.resolve(WORKSPACE, requestedPath);
    if (target !== path.resolve(WORKSPACE) && !target.startsWith(rootBoundary)) {
        throw new Error(`Sandbox violation: Cannot access ${requestedPath}`);
    }
    return target;
}
const mcp = new Server({ name: "my-mcp-connector", version: "1.0.0" }, { capabilities: { tools: {} } });
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: availableTools }));
mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    try {
        if (availableTools.find(t => t.name === name)) {
            return await routeToolCall(name, args, enforceSandbox);
        }
    }
    catch (err) {
        return { isError: true, content: [{ type: "text", text: err.message }] };
    }
    throw new Error(`Unknown tool: ${name}`);
});
async function boot() {
    if (!fs.existsSync(WORKSPACE))
        fs.mkdirSync(WORKSPACE, { recursive: true });
    if (!process.env.PM2_HOME && process.env.MCP_TRANSPORT !== "sse") {
        await mcp.connect(new StdioServerTransport());
        console.error("Running in local Stdio mode.");
    }
    else {
        const app = express();
        app.use((req, res, next) => {
            if (req.headers.authorization !== `Bearer ${TOKEN}`)
                return res.status(401).send("Unauthorized");
            next();
        });
        let sseTransport;
        app.get("/sse", async (req, res) => {
            sseTransport = new SSEServerTransport("/messages", res);
            await mcp.connect(sseTransport);
        });
        app.post("/messages", async (req, res) => {
            if (!sseTransport)
                return res.status(400).send("No SSE connection");
            await sseTransport.handlePostMessage(req, res);
        });
        const port = parseInt(process.env.PORT || "3000", 10);
        app.listen(port, async () => {
            console.log(`Server on port ${port}`);
            try {
                const tunnel = await ngrok.connect({ addr: port, authtoken_from_env: true });
                console.log(`Live at: ${tunnel.url()}/sse | Token: ${TOKEN}`);
            }
            catch (e) {
                console.error("Ngrok failed:", e);
            }
        });
    }
}
boot().catch(console.error);
//# sourceMappingURL=server.js.map
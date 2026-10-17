import * as fs from "fs";
import * as path from "path";
export const availableTools = [
    {
        name: "list_directory",
        description: "List files and directories in a given path within the workspace.",
        inputSchema: {
            type: "object",
            properties: {
                targetPath: { type: "string", description: "Relative path to list. Defaults to workspace root." },
            },
        },
    },
    {
        name: "read_file",
        description: "Read the full contents of a file.",
        inputSchema: {
            type: "object",
            properties: {
                targetPath: { type: "string" },
            },
            required: ["targetPath"],
        },
    },
    {
        name: "write_file",
        description: "Write content to a file, overwriting it if it exists.",
        inputSchema: {
            type: "object",
            properties: {
                targetPath: { type: "string" },
                content: { type: "string" },
            },
            required: ["targetPath", "content"],
        },
    },
    {
        name: "replace_string",
        description: "Replace exactly one occurrence of a string in a file.",
        inputSchema: {
            type: "object",
            properties: {
                targetPath: { type: "string" },
                oldStr: { type: "string" },
                newStr: { type: "string" },
            },
            required: ["targetPath", "oldStr", "newStr"],
        },
    },
    {
        name: "delete_file",
        description: "Remove a file from the workspace.",
        inputSchema: {
            type: "object",
            properties: { targetPath: { type: "string" } },
            required: ["targetPath"],
        },
    },
    {
        name: "move_file",
        description: "Rename or relocate a file.",
        inputSchema: {
            type: "object",
            properties: {
                sourcePath: { type: "string" },
                destPath: { type: "string" },
            },
            required: ["sourcePath", "destPath"],
        },
    },
    {
        name: "read_chunk",
        description: "Read a specific line range from a file (1-indexed).",
        inputSchema: {
            type: "object",
            properties: {
                targetPath: { type: "string" },
                startLine: { type: "number" },
                endLine: { type: "number" },
            },
            required: ["targetPath", "startLine", "endLine"],
        },
    },
    {
        name: "search_workspace",
        description: "Search for an exact string across all workspace files.",
        inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
        },
    },
    {
        name: "generate_tree",
        description: "Return a visual tree of the workspace files.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "read_handoff_state",
        description: "Read PROJECT_STATE.md to orient the agent.",
        inputSchema: { type: "object", properties: {} },
    },
];
function traverseDirectory(dir, fileList = []) {
    if (!fs.existsSync(dir))
        return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === "node_modules" || file === ".git")
            continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath, fileList);
        }
        else {
            fileList.push(fullPath);
        }
    }
    return fileList;
}
export async function routeToolCall(name, args, validatePath) {
    switch (name) {
        case "list_directory": {
            const p = validatePath(args.targetPath || ".");
            const items = fs.readdirSync(p, { withFileTypes: true });
            const out = items.map(i => `${i.isDirectory() ? "[DIR]" : "[FILE]"} ${i.name}`).join("\n");
            return { content: [{ type: "text", text: out || "(empty directory)" }] };
        }
        case "read_file": {
            const content = fs.readFileSync(validatePath(args.targetPath), "utf-8");
            return { content: [{ type: "text", text: content }] };
        }
        case "write_file": {
            const p = validatePath(args.targetPath);
            fs.mkdirSync(path.dirname(p), { recursive: true });
            fs.writeFileSync(p, args.content, "utf-8");
            return { content: [{ type: "text", text: `Wrote to ${args.targetPath}` }] };
        }
        case "replace_string": {
            const p = validatePath(args.targetPath);
            const content = fs.readFileSync(p, "utf-8");
            const matches = content.split(args.oldStr).length - 1;
            if (matches === 0)
                return { isError: true, content: [{ type: "text", text: "Match not found." }] };
            if (matches > 1)
                return { isError: true, content: [{ type: "text", text: "Multiple matches found. Be more specific." }] };
            fs.writeFileSync(p, content.replace(args.oldStr, args.newStr), "utf-8");
            return { content: [{ type: "text", text: "Replacement successful." }] };
        }
        case "delete_file": {
            fs.unlinkSync(validatePath(args.targetPath));
            return { content: [{ type: "text", text: "File deleted." }] };
        }
        case "move_file": {
            const src = validatePath(args.sourcePath);
            const dest = validatePath(args.destPath);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.renameSync(src, dest);
            return { content: [{ type: "text", text: "File moved." }] };
        }
        case "read_chunk": {
            const lines = fs.readFileSync(validatePath(args.targetPath), "utf-8").split("\n");
            const chunk = lines.slice(args.startLine - 1, args.endLine).join("\n");
            return { content: [{ type: "text", text: chunk }] };
        }
        case "search_workspace": {
            const root = validatePath(".");
            const allFiles = traverseDirectory(root);
            const hits = allFiles
                .filter(f => fs.readFileSync(f, "utf-8").includes(args.query))
                .map(f => path.relative(root, f));
            return { content: [{ type: "text", text: hits.length ? hits.join("\n") : "No matches." }] };
        }
        case "generate_tree": {
            const root = validatePath(".");
            const map = traverseDirectory(root).map(f => path.relative(root, f)).join("\n");
            return { content: [{ type: "text", text: map || "(empty)" }] };
        }
        case "read_handoff_state": {
            const p = validatePath("PROJECT_STATE.md");
            if (!fs.existsSync(p))
                return { content: [{ type: "text", text: "No state file found." }] };
            return { content: [{ type: "text", text: fs.readFileSync(p, "utf-8") }] };
        }
        default:
            throw new Error(`Tool ${name} not implemented.`);
    }
}
//# sourceMappingURL=toolHandlers.js.map
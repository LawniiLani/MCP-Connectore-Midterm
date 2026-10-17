import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const availableTools: Tool[];
export declare function routeToolCall(name: string, args: any, validatePath: (p: string) => string): Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: boolean;
}>;
//# sourceMappingURL=toolHandlers.d.ts.map
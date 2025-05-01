import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// In-memory session storage (will be replaced with Redis later)
const sessions: Record<string, StreamableHTTPServerTransport> = {};

// Create MCP server
export const createMcpServer = () => {
    const server = new McpServer({
        name: 'FPL-MCP-Server',
        version: '1.0.0',
    });

    // Add a simple tool for testing
    server.tool('echo', { message: z.string() }, async ({ message }) => ({
        content: [{ type: 'text', text: `Echo: ${message}` }],
    }));

    return server;
};

// Create a new transport for a session
export const createTransport = (
    sessionId: string = randomUUID()
): StreamableHTTPServerTransport => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
    });

    // Store transport in sessions object
    sessions[sessionId] = transport;

    // Setup cleanup when transport is closed
    transport.onclose = () => {
        delete sessions[sessionId];
        console.log(`Session ${sessionId} closed`);
    };

    return transport;
};

// Get transport by session ID
export const getTransport = (
    sessionId: string
): StreamableHTTPServerTransport | undefined => {
    return sessions[sessionId];
};

// Get all active session IDs
export const getActiveSessions = (): string[] => {
    return Object.keys(sessions);
};

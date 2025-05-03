// fpl-mcp-server/src/server.ts
import express from 'express';
import cors from 'cors';
import { config } from './config';
import mcpRouter from './routes/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from './tools';
import { registerResources } from './resources';
import { registerPrompts } from './prompts';
import bodyParser from 'body-parser';
import { cacheInvalidator } from './lib/fpl-api/cache-invalidator';
import { fplApiService } from './lib/fpl-api/service';

const app = express();
const port = config.port || 3001;

// CORS middleware
// In server.ts
app.use(
    cors({
        origin: [
            config.nextjsUrl,
            'http://localhost:3000',
            'http://localhost:8080',
        ],
        methods: ['GET', 'POST', 'DELETE'],
        allowedHeaders: ['Content-Type', 'mcp-session-id'],
        exposedHeaders: ['mcp-session-id'],
    })
);

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.use('/mcp', mcpRouter);

// Cache warming function - wrapped in a try/catch to prevent server failure
async function warmCache() {
    console.log('Starting cache warming process...');

    try {
        // Use the updateAllData method to warm the cache
        await fplApiService.updateAllData();

        // Run cache optimization to clean up stale data
        await cacheInvalidator.optimizeLiveDataCaching();

        console.log('Cache warming completed successfully');
    } catch (error) {
        console.error('Cache warming failed:', error);
        // Important: We don't re-throw the error to ensure server startup continues
    }
}

// Start server
app.listen(port, () => {
    console.log(`FPL MCP Server running on port ${port}`);
});

// Create MCP server
export const createMcpServer = () => {
    const server = new McpServer({
        name: 'FPL-MCP-Server',
        version: '1.0.0',
    });

    // Register all components
    registerTools(server);
    registerResources(server);
    registerPrompts(server);

    return server;
};

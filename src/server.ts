// fpl-mcp-server/src/server.ts
import express from 'express';
import cors from 'cors';
import { config } from './config';
import mcpRouter from './routes/mcp';

const app = express();
const port = config.port || 3001;

// CORS middleware
// In server.ts
app.use(
    cors({
        origin: [config.nextjsUrl, 'https://your-nextjs-app.railway.app'],
        methods: ['GET', 'POST', 'DELETE'],
        allowedHeaders: ['Content-Type', 'mcp-session-id'],
        exposedHeaders: ['mcp-session-id'],
    })
);

// Middleware
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.use('/mcp', mcpRouter);

// Start server
app.listen(port, () => {
    console.log(`FPL MCP Server running on port ${port}`);
});

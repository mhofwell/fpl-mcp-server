import express from 'express';
import routes from './routes/index';

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Use routes
app.use('/', routes);

// Error handling middleware
app.use(
    (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error(err.stack);
        res.status(500).json({
            message: 'An unexpected error occurred',
            error: process.env.NODE_ENV === 'production' ? {} : err.stack,
        });
    }
);

// Start the server
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// For graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

export default app;

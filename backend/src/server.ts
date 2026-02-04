import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import authRoutes from './routes/auth';
import datasetRoutes from './routes/datasets';
import forecastRoutes from './routes/forecasts';
import { logger } from './config/logger';
import { initializeS3 } from './config/s3';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/forecasts', forecastRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Error: ${err.message}`, { stack: err.stack });
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Database connection and server start
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        logger.info('Database connection established successfully');

        // Sync models (in production, use migrations instead)
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync();
            logger.info('Database models synchronized');
        }

        // Initialize S3 storage
        logger.info('Calling initializeS3()...');
        await initializeS3();
        logger.info('initializeS3() completed.');

        // Start server
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error('Unable to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;

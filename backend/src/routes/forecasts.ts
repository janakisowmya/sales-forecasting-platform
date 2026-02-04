import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Forecast } from '../models/Forecast';
import { Dataset } from '../models/Dataset';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireAnalyst } from '../middleware/rbac';
import { getPresignedUrl } from '../config/s3';
import { runForecast } from '../services/mlService';
import { logger } from '../config/logger';

const router = Router();

/**
 * POST /api/forecasts/run
 * Submit a new forecast job
 * Requires: analyst or admin role
 */
router.post(
    '/run',
    authenticateToken,
    requireAnalyst,
    [
        body('datasetId').isInt(),
        body('modelType').isIn(['baseline', 'arima', 'xgboost']),
        body('horizon').isInt({ min: 1, max: 365 }),
        body('granularity').isIn(['daily', 'weekly', 'monthly'])
    ],
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { datasetId, modelType, horizon, granularity } = req.body;

            // Verify dataset exists
            const dataset = await Dataset.findByPk(datasetId);
            if (!dataset) {
                res.status(404).json({ error: 'Dataset not found' });
                return;
            }

            // Create forecast record
            const forecast = await Forecast.create({
                datasetId,
                userId: req.userId!,
                modelType,
                horizon,
                granularity,
                status: 'pending'
            });

            logger.info(`Forecast job created: ${forecast.id}`);

            // Run forecast asynchronously
            (async () => {
                try {
                    // Update status to running
                    await forecast.update({ status: 'running' });

                    // Get presigned URL for dataset
                    const datasetUrl = await getPresignedUrl(dataset.s3Key);

                    // Call ML service
                    const result = await runForecast({
                        datasetUrl,
                        modelType,
                        horizon,
                        granularity
                    });

                    // Update forecast with results
                    await forecast.update({
                        status: 'completed',
                        resultsJson: result.predictions,
                        metricsJson: result.metrics,
                        completedAt: new Date()
                    });

                    logger.info(`Forecast job completed: ${forecast.id}`);
                } catch (error) {
                    logger.error(`Forecast job failed: ${forecast.id}`, error);
                    await forecast.update({
                        status: 'failed',
                        errorMessage: error instanceof Error ? error.message : 'Unknown error',
                        completedAt: new Date()
                    });
                }
            })();

            res.status(202).json({
                message: 'Forecast job submitted',
                forecast: {
                    id: forecast.id,
                    status: forecast.status,
                    modelType: forecast.modelType,
                    horizon: forecast.horizon,
                    granularity: forecast.granularity
                }
            });
        } catch (error) {
            logger.error('Forecast submission error:', error);
            res.status(500).json({ error: 'Failed to submit forecast job' });
        }
    }
);

/**
 * GET /api/forecasts
 * List all forecasts with pagination
 */
router.get(
    '/',
    authenticateToken,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            const { count, rows: forecasts } = await Forecast.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                include: [
                    { association: 'dataset', attributes: ['id', 'name'] },
                    { association: 'user', attributes: ['id', 'email'] }
                ]
            });

            res.json({
                forecasts,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            logger.error('Forecast list error:', error);
            res.status(500).json({ error: 'Failed to fetch forecasts' });
        }
    }
);

/**
 * GET /api/forecasts/:id
 * Get forecast details and results
 */
router.get(
    '/:id',
    authenticateToken,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const forecast = await Forecast.findByPk(id, {
                include: [
                    { association: 'dataset', attributes: ['id', 'name'] },
                    { association: 'user', attributes: ['id', 'email'] }
                ]
            });

            if (!forecast) {
                res.status(404).json({ error: 'Forecast not found' });
                return;
            }

            res.json({ forecast });
        } catch (error) {
            logger.error('Forecast fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch forecast' });
        }
    }
);

/**
 * GET /api/forecasts/:id/metrics
 * Get forecast metrics
 */
router.get(
    '/:id/metrics',
    authenticateToken,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const forecast = await Forecast.findByPk(id);

            if (!forecast) {
                res.status(404).json({ error: 'Forecast not found' });
                return;
            }

            if (forecast.status !== 'completed') {
                res.status(400).json({
                    error: 'Forecast not completed',
                    status: forecast.status
                });
                return;
            }

            res.json({
                metrics: forecast.metricsJson,
                modelType: forecast.modelType,
                horizon: forecast.horizon
            });
        } catch (error) {
            logger.error('Metrics fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch metrics' });
        }
    }
);

export default router;

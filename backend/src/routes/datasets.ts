import { Router, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { Dataset } from '../models/Dataset';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireAnalyst, requireAdmin } from '../middleware/rbac';
import { uploadToS3, getPresignedUrl } from '../config/s3';
import { logger } from '../config/logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/datasets/upload
 * Upload a dataset file to S3
 * Requires: analyst or admin role
 */
router.post(
    '/upload',
    authenticateToken,
    requireAnalyst,
    upload.single('file'),
    [
        body('name').notEmpty().trim()
    ],
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            const { name } = req.body;
            const file = req.file;

            // Generate unique S3 key
            const timestamp = Date.now();
            const s3Key = `datasets/${req.userId}/${timestamp}-${file.originalname}`;

            // Upload to S3
            await uploadToS3(s3Key, file.buffer, file.mimetype);

            // Count rows (simple CSV row count)
            const rowCount = file.buffer.toString().split('\n').length - 1; // Subtract header

            // Create dataset record
            const dataset = await Dataset.create({
                name,
                s3Key,
                uploadedBy: req.userId!,
                rowCount,
                fileSize: file.size
            });

            logger.info(`Dataset uploaded: ${name} by user ${req.userId}`);

            res.status(201).json({
                message: 'Dataset uploaded successfully',
                dataset: {
                    id: dataset.id,
                    name: dataset.name,
                    rowCount: dataset.rowCount,
                    fileSize: dataset.fileSize,
                    createdAt: dataset.createdAt
                }
            });
        } catch (error) {
            logger.error('Dataset upload error:', error);
            res.status(500).json({ error: 'Failed to upload dataset' });
        }
    }
);

/**
 * GET /api/datasets
 * List all datasets with pagination
 */
router.get(
    '/',
    authenticateToken,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;

            const { count, rows: datasets } = await Dataset.findAndCountAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                include: [{ association: 'uploader', attributes: ['id', 'email'] }]
            });

            res.json({
                datasets,
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            logger.error('Dataset list error:', error);
            res.status(500).json({ error: 'Failed to fetch datasets' });
        }
    }
);

/**
 * GET /api/datasets/:id
 * Get dataset details and presigned download URL
 */
router.get(
    '/:id',
    authenticateToken,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const dataset = await Dataset.findByPk(id, {
                include: [{ association: 'uploader', attributes: ['id', 'email'] }]
            });

            if (!dataset) {
                res.status(404).json({ error: 'Dataset not found' });
                return;
            }

            // Generate presigned URL for download
            const downloadUrl = await getPresignedUrl(dataset.s3Key);

            res.json({
                dataset,
                downloadUrl
            });
        } catch (error) {
            logger.error('Dataset fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch dataset' });
        }
    }
);

/**
 * DELETE /api/datasets/:id
 * Delete a dataset
 * Requires: admin role
 */
router.delete(
    '/:id',
    authenticateToken,
    requireAdmin,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;

            const dataset = await Dataset.findByPk(id);

            if (!dataset) {
                res.status(404).json({ error: 'Dataset not found' });
                return;
            }

            await dataset.destroy();

            logger.info(`Dataset deleted: ${id} by user ${req.userId}`);

            res.json({ message: 'Dataset deleted successfully' });
        } catch (error) {
            logger.error('Dataset delete error:', error);
            res.status(500).json({ error: 'Failed to delete dataset' });
        }
    }
);

export default router;

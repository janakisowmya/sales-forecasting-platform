import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const s3Config: any = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
};

// For local development with MinIO
if (process.env.S3_ENDPOINT) {
    s3Config.endpoint = process.env.S3_ENDPOINT;
    s3Config.forcePathStyle = true;
}

export const s3Client = new S3Client(s3Config);

export const S3_BUCKET = process.env.S3_BUCKET || 'sales-datasets';

/**
 * Upload a file to S3
 */
export const uploadToS3 = async (
    key: string,
    body: Buffer,
    contentType: string = 'application/octet-stream'
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType
    });

    await s3Client.send(command);

    // Return the S3 URL
    if (process.env.S3_ENDPOINT) {
        return `${process.env.S3_ENDPOINT}/${S3_BUCKET}/${key}`;
    }
    return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

/**
 * Generate a presigned URL for downloading from S3
 */
export const getPresignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Initialize S3 - check if bucket exists and create it if it doesn't
 */
export const initializeS3 = async (): Promise<void> => {
    logger.info('Starting S3 initialization...');
    try {
        logger.info(`Checking if S3 bucket exists: ${S3_BUCKET}`);
        await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
        logger.info(`S3 bucket already exists: ${S3_BUCKET}`);
    } catch (error: any) {
        logger.info(`S3 head bucket error: ${error.name} (${error.$metadata?.httpStatusCode})`);
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
            try {
                logger.info(`S3 bucket does not exist, creating: ${S3_BUCKET}`);
                await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
                logger.info(`S3 bucket created successfully: ${S3_BUCKET}`);
            } catch (createError: any) {
                logger.error(`Error creating S3 bucket: ${S3_BUCKET}`, {
                    error: createError.message,
                    stack: createError.stack
                });
            }
        } else {
            logger.error(`Error checking S3 bucket: ${S3_BUCKET}`, {
                error: error.message,
                stack: error.stack
            });
        }
    }
};

export default s3Client;

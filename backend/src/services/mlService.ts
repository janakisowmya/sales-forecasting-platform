import axios from 'axios';
import { logger } from '../config/logger';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export interface ForecastRequest {
    datasetUrl: string;
    modelType: 'baseline' | 'arima' | 'xgboost';
    horizon: number;
    granularity: 'daily' | 'weekly' | 'monthly';
}

export interface ForecastResponse {
    predictions: Array<{ date: string; value: number }>;
    metrics: {
        mae: number;
        rmse: number;
        mape: number;
        accuracy: number;
    };
}

/**
 * Call ML service to run forecast
 */
export const runForecast = async (request: ForecastRequest): Promise<ForecastResponse> => {
    try {
        logger.info(`Calling ML service for ${request.modelType} forecast`);

        const response = await axios.post<ForecastResponse>(
            `${ML_SERVICE_URL}/forecast`,
            request,
            {
                timeout: 300000, // 5 minutes timeout for large datasets
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        logger.info(`ML service returned forecast with ${response.data.predictions.length} predictions`);

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            logger.error(`ML service error: ${error.message}`, {
                status: error.response?.status,
                data: error.response?.data
            });
            throw new Error(`ML service error: ${error.response?.data?.detail || error.message}`);
        }
        throw error;
    }
};

export default { runForecast };

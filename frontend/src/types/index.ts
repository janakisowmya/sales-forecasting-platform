export interface User {
    id: number;
    email: string;
    role: 'admin' | 'analyst' | 'viewer';
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export interface Dataset {
    id: number;
    name: string;
    rowCount: number;
    fileSize: number;
    createdAt: string;
}

export interface Forecast {
    id: number;
    datasetId: number;
    modelType: 'baseline' | 'arima' | 'xgboost';
    horizon: number;
    granularity: 'daily' | 'weekly' | 'monthly';
    status: 'pending' | 'running' | 'completed' | 'failed';
    resultsJson?: any; // Can be Prediction[] OR { predictions: Prediction[], insights: ExecutiveInsights }
    metricsJson?: Metrics;
    errorMessage?: string;
    createdAt: string;
    completedAt?: string;
}

export interface Prediction {
    date: string;
    value: number;
    lower?: number;
    upper?: number;
}

export interface Metrics {
    mae: number;
    rmse: number;
    mape: number;
    accuracy: number;
    r2?: number;
    insights?: ExecutiveInsights;
}

export interface ExecutiveInsights {
    totalForecastedValue: number;
    trend: string;
    growthPercentage: number;
    confidenceRating: string;
    narrative: string;
}

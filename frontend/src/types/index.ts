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
    resultsJson?: Prediction[];
    metricsJson?: Metrics;
    createdAt: string;
    completedAt?: string;
}

export interface Prediction {
    date: string;
    value: number;
}

export interface Metrics {
    mae: number;
    rmse: number;
    mape: number;
    accuracy: number;
}

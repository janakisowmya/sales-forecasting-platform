import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { datasetAPI, forecastAPI } from '../services/api';
import { Dataset } from '../types';
import { Play, Loader } from 'lucide-react';

const RunForecast: React.FC = () => {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [selectedDataset, setSelectedDataset] = useState('');
    const [modelType, setModelType] = useState<'baseline' | 'arima' | 'xgboost'>('arima');
    const [horizon, setHorizon] = useState(30);
    const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadDatasets();
    }, []);

    const loadDatasets = async () => {
        try {
            const response = await datasetAPI.list(1, 100);
            setDatasets(response.data.datasets);
        } catch (err) {
            console.error('Failed to load datasets', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await forecastAPI.run({
                datasetId: parseInt(selectedDataset),
                modelType,
                horizon,
                granularity,
            });

            const forecastId = response.data.forecast.id;
            navigate(`/results/${forecastId}`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to run forecast');
            setLoading(false);
        }
    };

    const models = [
        { value: 'baseline', name: 'Baseline', desc: 'Simple seasonal naive forecast' },
        { value: 'arima', name: 'ARIMA', desc: 'Classic time series model' },
        { value: 'xgboost', name: 'XGBoost', desc: 'ML model with feature engineering' },
    ];

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">Run Forecast</h1>
                <p className="text-gray-400 mb-8">Configure and generate sales predictions</p>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Dataset Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Dataset</label>
                            <select
                                value={selectedDataset}
                                onChange={(e) => setSelectedDataset(e.target.value)}
                                className="input-field"
                                required
                            >
                                <option value="">Choose a dataset...</option>
                                {datasets.map((dataset) => (
                                    <option key={dataset.id} value={dataset.id}>
                                        {dataset.name} ({dataset.rowCount} rows)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Model Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Forecasting Model</label>
                            <div className="grid grid-cols-1 gap-3">
                                {models.map((model) => (
                                    <label
                                        key={model.value}
                                        className={`glass-hover p-4 rounded-lg cursor-pointer ${modelType === model.value ? 'ring-2 ring-primary-500' : ''
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="model"
                                            value={model.value}
                                            checked={modelType === model.value}
                                            onChange={(e) => setModelType(e.target.value as any)}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{model.name}</p>
                                                <p className="text-sm text-gray-400">{model.desc}</p>
                                            </div>
                                            {modelType === model.value && (
                                                <div className="w-5 h-5 bg-primary-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Horizon */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Forecast Horizon: {horizon} days
                            </label>
                            <input
                                type="range"
                                min="7"
                                max="90"
                                step="1"
                                value={horizon}
                                onChange={(e) => setHorizon(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>7 days</span>
                                <span>90 days</span>
                            </div>
                        </div>

                        {/* Granularity */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Granularity</label>
                            <select
                                value={granularity}
                                onChange={(e) => setGranularity(e.target.value as any)}
                                className="input-field"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !selectedDataset}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Running Forecast...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Run Forecast
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RunForecast;

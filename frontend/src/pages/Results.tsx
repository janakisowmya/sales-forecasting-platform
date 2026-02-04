import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { forecastAPI } from '../services/api';
import { Forecast } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

const Results: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [forecast, setForecast] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadForecast(parseInt(id));
            const interval = setInterval(() => {
                loadForecast(parseInt(id));
            }, 3000); // Poll every 3 seconds

            return () => clearInterval(interval);
        }
    }, [id]);

    const loadForecast = async (forecastId: number) => {
        try {
            const response = await forecastAPI.get(forecastId);
            setForecast(response.data.forecast);
            setLoading(false);
        } catch (err) {
            console.error('Failed to load forecast', err);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-primary-400" />
                    <p className="text-gray-400">Loading forecast...</p>
                </div>
            </div>
        );
    }

    if (!forecast) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card text-center">
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <h2 className="text-2xl font-bold mb-2">Forecast Not Found</h2>
                    <p className="text-gray-400">The requested forecast could not be loaded.</p>
                </div>
            </div>
        );
    }

    const statusIcons = {
        pending: <Clock className="w-5 h-5 text-yellow-400" />,
        running: <Loader className="w-5 h-5 animate-spin text-blue-400" />,
        completed: <CheckCircle className="w-5 h-5 text-green-400" />,
        failed: <XCircle className="w-5 h-5 text-red-400" />,
    };

    const chartData = forecast.resultsJson?.map((pred) => ({
        date: new Date(pred.date).toLocaleDateString(),
        value: pred.value,
    })) || [];

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">Forecast Results</h1>
                <p className="text-gray-400 mb-8">Forecast #{forecast.id}</p>

                {/* Status Card */}
                <div className="card mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                {statusIcons[forecast.status]}
                                <span className="font-semibold capitalize">{forecast.status}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Model</p>
                            <p className="font-semibold uppercase">{forecast.modelType}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 mb-1">Horizon</p>
                            <p className="font-semibold">{forecast.horizon} {forecast.granularity}</p>
                        </div>
                    </div>
                </div>

                {forecast.status === 'completed' && forecast.metricsJson && (
                    <>
                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="card">
                                <p className="text-sm text-gray-400 mb-1">MAE</p>
                                <p className="text-3xl font-bold">{forecast.metricsJson.mae.toFixed(2)}</p>
                            </div>
                            <div className="card">
                                <p className="text-sm text-gray-400 mb-1">RMSE</p>
                                <p className="text-3xl font-bold">{forecast.metricsJson.rmse.toFixed(2)}</p>
                            </div>
                            <div className="card">
                                <p className="text-sm text-gray-400 mb-1">MAPE</p>
                                <p className="text-3xl font-bold">{forecast.metricsJson.mape.toFixed(2)}%</p>
                            </div>
                            <div className="card">
                                <p className="text-sm text-gray-400 mb-1">Accuracy</p>
                                <p className="text-3xl font-bold text-green-400">{forecast.metricsJson.accuracy.toFixed(2)}%</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="card">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6" />
                                Forecast Predictions
                            </h2>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="date" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        name="Predicted Sales"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {forecast.status === 'running' && (
                    <div className="card text-center py-12">
                        <Loader className="w-16 h-16 animate-spin mx-auto mb-4 text-primary-400" />
                        <h3 className="text-xl font-semibold mb-2">Forecast in Progress</h3>
                        <p className="text-gray-400">This may take a few minutes depending on dataset size...</p>
                    </div>
                )}

                {forecast.status === 'failed' && (
                    <div className="card text-center py-12">
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <h3 className="text-xl font-semibold mb-2">Forecast Failed</h3>
                        <p className="text-gray-400">{forecast.errorMessage || 'An error occurred'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Results;

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { forecastAPI } from '../services/api';
import { Forecast } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { TrendingUp, Clock, CheckCircle, XCircle, Loader, DollarSign, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const Results: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [forecast, setForecast] = useState<Forecast | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchForecast = async () => {
            if (!id) return;
            try {
                // Compatibility layer for older API response structure
                const response = await (forecastAPI as any).getById(parseInt(id));
                setForecast(response);
            } catch (err: any) {
                try {
                    // Try legacy .get method if getById fails
                    const resp = await (forecastAPI as any).get(parseInt(id));
                    setForecast(resp.data.forecast);
                } catch (innerErr: any) {
                    setError(innerErr.response?.data?.message || 'Failed to load forecast results');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="w-8 h-8 animate-spin text-primary-400" />
            </div>
        );
    }

    if (error || !forecast) {
        return (
            <div className="card text-center py-12">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Error Loading Results</h3>
                <p className="text-gray-400 mb-6">{error || 'Forecast not found'}</p>
                <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
            </div>
        );
    }

    const statusIcons = {
        pending: <Clock className="w-5 h-5 text-yellow-400" />,
        running: <Loader className="w-5 h-5 animate-spin text-primary-400" />,
        completed: <CheckCircle className="w-5 h-5 text-green-400" />,
        failed: <XCircle className="w-5 h-5 text-red-400" />,
    };

    const predictions = Array.isArray(forecast.resultsJson)
        ? forecast.resultsJson
        : forecast.resultsJson?.predictions;

    const chartData = predictions?.map((pred: any) => ({
        date: new Date(pred.date).toLocaleDateString(),
        value: pred.value,
        lower: pred.lower,
        upper: pred.upper,
    })) || [];

    const insights = forecast.resultsJson?.insights || (forecast.metricsJson as any)?.insights;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">Forecast Analysis</h1>
                    <p className="text-gray-400">Detailed results and performance metrics for Forecast #{id}</p>
                </div>
                <Link to="/dashboard" className="btn btn-secondary py-2">Back to Dashboard</Link>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Executive Summary Card */}
                {insights && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="card md:col-span-3 border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-950/20 to-transparent">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary-400" />
                                Strategic Outlook
                            </h3>
                            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                                {insights.narrative.split(' ').map((word: string, i: number) => (
                                    <React.Fragment key={i}>
                                        {['Growth', 'Decline', 'Stable'].includes(word.replace(/[.,]/g, '')) ? (
                                            <span className={`font-bold ${word.includes('Growth') ? 'text-green-400' : word.includes('Decline') ? 'text-red-400' : 'text-blue-400'}`}>
                                                {word}{' '}
                                            </span>
                                        ) : word + ' '}
                                    </React.Fragment>
                                ))}
                            </p>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Projected Value</p>
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="w-5 h-5 text-primary-400" />
                                        <p className="text-2xl font-bold">{insights.totalForecastedValue.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Growth Index</p>
                                    <div className="flex items-center gap-1.5">
                                        {insights.growthPercentage > 0 ? (
                                            <ArrowUpRight className="w-5 h-5 text-green-400" />
                                        ) : insights.growthPercentage < 0 ? (
                                            <ArrowDownRight className="w-5 h-5 text-red-400" />
                                        ) : (
                                            <Minus className="w-5 h-5 text-blue-400" />
                                        )}
                                        <p className={`text-2xl font-bold ${insights.growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {insights.growthPercentage >= 0 ? '+' : ''}{insights.growthPercentage}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card flex flex-col justify-center items-center text-center bg-gray-900/40">
                            <p className="text-sm text-gray-400 mb-2 uppercase tracking-tighter">Model Confidence</p>
                            <div className={`text-5xl font-black mb-2 ${insights.confidenceRating === 'High' ? 'text-green-400' : insights.confidenceRating === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                                {insights.confidenceRating}
                            </div>
                            <p className="text-xs text-gray-500">Based on backtesting accuracy of {forecast.metricsJson?.accuracy?.toFixed(1) || '0.0'}%</p>
                        </div>
                    </div>
                )}

                {/* Status Card */}
                <div className="card mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">Status</p>
                            <div className="flex items-center gap-2">
                                {statusIcons[forecast.status]}
                                <span className="font-semibold capitalize">{forecast.status}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">Model</p>
                            <p className="font-semibold uppercase text-primary-400">{forecast.modelType}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">Horizon</p>
                            <p className="font-semibold">{forecast.horizon} {forecast.granularity}s</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-widest">WAPE Accuracy</p>
                            <p className="font-semibold text-green-400">{forecast.metricsJson?.accuracy?.toFixed(1) || '0.0'}%</p>
                        </div>
                    </div>
                </div>

                {forecast.status === 'completed' && chartData.length > 0 && (
                    <>
                        {/* Main Forecast Chart */}
                        <div className="card p-6">
                            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Projected Trend & Trust Range</h3>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `$${val.toLocaleString()}`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid #334155',
                                                borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                                            }}
                                            itemStyle={{ color: '#f8fafc' }}
                                        />
                                        <Legend verticalAlign="top" height={36} />

                                        {/* Confidence Interval Shading */}
                                        <Area
                                            type="monotone"
                                            dataKey="upper"
                                            stroke="none"
                                            fill="#3b82f6"
                                            fillOpacity={0.1}
                                            name="Confidence Range"
                                            connectNulls
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="lower"
                                            stroke="none"
                                            fill="#0f172a"
                                            fillOpacity={1}
                                            connectNulls
                                            aria-hidden="true"
                                            legendType="none"
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                            name="Projected Sales"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-4">
                                * Shaded area represents the 95% confidence interval (potential variation range).
                            </p>
                        </div>

                        {/* Additional Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card bg-gray-900/30">
                                <p className="text-sm text-gray-500 mb-1">Mean Absolute Error</p>
                                <p className="text-xl font-bold">${forecast.metricsJson?.mae?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="card bg-gray-900/30">
                                <p className="text-sm text-gray-500 mb-1">RMSE (Volatility)</p>
                                <p className="text-xl font-bold">${forecast.metricsJson?.rmse?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="card bg-gray-900/30">
                                <p className="text-sm text-gray-500 mb-1">R-Squared Score</p>
                                <p className="text-xl font-bold">{((forecast.metricsJson?.r2 || 0) * 100).toFixed(1)}%</p>
                            </div>
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

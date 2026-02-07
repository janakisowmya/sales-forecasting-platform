import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { forecastAPI } from '../services/api';
import { Forecast } from '../types';
import { BarChart3, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

const Forecasts: React.FC = () => {
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState('');

    useEffect(() => {
        fetchForecasts();
    }, []);

    const fetchForecasts = async () => {
        try {
            const response = await forecastAPI.list(1, 100);
            setForecasts(response.data.forecasts);
        } catch (err: any) {
            setError('Failed to load forecast history');
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        pending: 'bg-yellow-500/10 text-yellow-500',
        running: 'bg-blue-500/10 text-blue-500',
        completed: 'bg-green-500/10 text-green-500',
        failed: 'bg-red-500/10 text-red-400',
    };

    const statusIcons = {
        pending: <Clock className="w-4 h-4" />,
        running: <Loader className="w-4 h-4 animate-spin" />,
        completed: <CheckCircle className="w-4 h-4" />,
        failed: <XCircle className="w-4 h-4" />,
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">Forecast History</h1>
                        <p className="text-gray-400">View and manage all generated predictions</p>
                    </div>
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Forecast ID</th>
                                    <th className="px-6 py-4 font-semibold">Dataset</th>
                                    <th className="px-6 py-4 font-semibold">Model</th>
                                    <th className="px-6 py-4 font-semibold">Date Created</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <Loader className="w-8 h-8 animate-spin mx-auto text-primary-400 mb-2" />
                                            <p className="text-gray-500">Loading forecasts...</p>
                                        </td>
                                    </tr>
                                ) : forecasts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <p className="text-gray-500">No forecasts found</p>
                                            <Link to="/forecast" className="text-primary-400 hover:underline mt-2 inline-block">Generate your first forecast</Link>
                                        </td>
                                    </tr>
                                ) : (
                                    forecasts.map((forecast) => (
                                        <tr key={forecast.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium">#{forecast.id}</td>
                                            <td className="px-6 py-4 text-gray-300">{(forecast as any).dataset?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 uppercase text-xs font-bold text-primary-400">{forecast.modelType}</td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">
                                                {new Date(forecast.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[forecast.status]}`}>
                                                    {statusIcons[forecast.status]}
                                                    {forecast.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {forecast.status === 'completed' ? (
                                                    <Link
                                                        to={`/results/${forecast.id}`}
                                                        className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold text-sm transition-colors"
                                                    >
                                                        <BarChart3 className="w-4 h-4" />
                                                        VIEW RESULTS
                                                    </Link>
                                                ) : forecast.status === 'failed' ? (
                                                    <span className="text-red-400 text-xs font-bold">ERROR</span>
                                                ) : (
                                                    <span className="text-gray-600 text-xs font-bold">PROCESSING</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Forecasts;

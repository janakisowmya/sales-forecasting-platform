import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Database, BarChart3, LogOut, Upload, Play } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();

    const features = [
        {
            title: 'Upload Dataset',
            description: 'Upload your sales data for forecasting',
            icon: Upload,
            link: '/upload',
            color: 'from-blue-500 to-cyan-500',
            requiredRole: 'analyst',
        },
        {
            title: 'Run Forecast',
            description: 'Generate predictions with AI models',
            icon: Play,
            link: '/forecast',
            color: 'from-purple-500 to-pink-500',
            requiredRole: 'analyst',
        },
        {
            title: 'View Results',
            description: 'Analyze forecast accuracy and metrics',
            icon: BarChart3,
            link: '/results',
            color: 'from-green-500 to-emerald-500',
            requiredRole: 'viewer',
        },
        {
            title: 'Datasets',
            description: 'Manage your uploaded datasets',
            icon: Database,
            link: '/datasets',
            color: 'from-orange-500 to-red-500',
            requiredRole: 'viewer',
        },
    ];

    const roleHierarchy = { admin: 3, analyst: 2, viewer: 1 };
    const userLevel = user ? roleHierarchy[user.role] : 0;

    const filteredFeatures = features.filter(feature => {
        const requiredLevel = roleHierarchy[feature.requiredRole as keyof typeof roleHierarchy];
        return userLevel >= requiredLevel;
    });

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent mb-2">
                            Sales Forecasting Platform
                        </h1>
                        <p className="text-gray-400">Welcome back, {user?.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-semibold">
                            {user?.role.toUpperCase()}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Total Forecasts</p>
                                <p className="text-3xl font-bold mt-1">0</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-primary-400" />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Datasets</p>
                                <p className="text-3xl font-bold mt-1">0</p>
                            </div>
                            <div className="w-12 h-12 bg-accent-500/20 rounded-lg flex items-center justify-center">
                                <Database className="w-6 h-6 text-accent-400" />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Avg Accuracy</p>
                                <p className="text-3xl font-bold mt-1">--</p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredFeatures.map((feature, index) => (
                        <Link
                            key={index}
                            to={feature.link}
                            className="card-hover group"
                        >
                            <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                        </Link>
                    ))}
                </div>

                {/* Info Section */}
                <div className="card mt-12">
                    <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
                    <div className="space-y-3 text-gray-300">
                        <p>1. <strong>Upload Dataset:</strong> Upload your historical sales data (CSV format with date and sales columns)</p>
                        <p>2. <strong>Run Forecast:</strong> Choose a model (Baseline, ARIMA, or XGBoost) and forecast horizon</p>
                        <p>3. <strong>View Results:</strong> Analyze predictions, metrics (MAE, RMSE, MAPE), and accuracy</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

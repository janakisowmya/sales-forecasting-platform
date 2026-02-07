import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DatasetUpload from './pages/DatasetUpload';
import RunForecast from './pages/RunForecast';
import Results from './pages/Results';

// Stubs for missing pages to unblock build
const Datasets = () => (
    <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Datasets List</h1>
        <div className="card py-12 text-center text-gray-400 font-medium">
            Module path: ./pages/Datasets.tsx (Coming Soon)
        </div>
    </div>
);

const Forecasts = () => (
    <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Forecast History</h1>
        <div className="card py-12 text-center text-gray-400 font-medium">
            Module path: ./pages/Forecasts.tsx (Coming Soon)
        </div>
    </div>
);

const App: React.FC = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/upload"
                        element={
                            <ProtectedRoute requiredRole="analyst">
                                <DatasetUpload />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/forecast"
                        element={
                            <ProtectedRoute requiredRole="analyst">
                                <RunForecast />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/datasets"
                        element={
                            <ProtectedRoute>
                                <Datasets />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/forecasts"
                        element={
                            <ProtectedRoute>
                                <Forecasts />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/results/:id"
                        element={
                            <ProtectedRoute>
                                <Results />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;

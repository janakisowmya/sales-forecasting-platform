import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DatasetUpload from './pages/DatasetUpload';
import RunForecast from './pages/RunForecast';
import Results from './pages/Results';

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

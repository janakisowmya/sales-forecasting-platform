import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'analyst' | 'viewer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user) {
        const roleHierarchy = { admin: 3, analyst: 2, viewer: 1 };
        const userLevel = roleHierarchy[user.role];
        const requiredLevel = roleHierarchy[requiredRole];

        if (userLevel < requiredLevel) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="card text-center">
                        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                        <p className="text-gray-400">You don't have permission to access this page.</p>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;

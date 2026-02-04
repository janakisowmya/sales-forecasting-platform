import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, TrendingUp } from 'lucide-react';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password, 'analyst');
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="card max-w-md w-full relative z-10 animate-slide-up">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                        Sales Forecasting Platform
                    </h1>
                    <p className="text-gray-400 mt-2">AI-powered sales predictions</p>
                </div>

                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${isLogin ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <LogIn className="w-4 h-4 inline mr-2" />
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${!isLogin ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <UserPlus className="w-4 h-4 inline mr-2" />
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    <p>Demo accounts: admin@example.com / analyst@example.com / viewer@example.com</p>
                    <p className="text-xs mt-1">Password: password123</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

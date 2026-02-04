import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { datasetAPI } from '../services/api';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const DatasetUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!name) {
                setName(selectedFile.name.replace('.csv', ''));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setError('');
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', name);

            await datasetAPI.upload(formData);
            setSuccess(true);
            setTimeout(() => navigate('/forecast'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">Upload Dataset</h1>
                <p className="text-gray-400 mb-8">Upload your historical sales data for forecasting</p>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Dataset File (CSV)</label>
                            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-primary-500/50 transition-colors">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <FileText className="w-8 h-8 text-primary-400" />
                                            <div className="text-left">
                                                <p className="font-semibold">{file.name}</p>
                                                <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                            <p className="text-gray-300">Click to upload or drag and drop</p>
                                            <p className="text-sm text-gray-500 mt-1">CSV files only</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Dataset Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Dataset Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-field"
                                placeholder="My Sales Data"
                                required
                            />
                        </div>

                        {/* Info */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-sm text-blue-300">
                                <strong>Required format:</strong> CSV file with at least two columns: 'date' and 'sales' (or similar names)
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <p className="text-green-400">Upload successful! Redirecting...</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading...' : 'Upload Dataset'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DatasetUpload;

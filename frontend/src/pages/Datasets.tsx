import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { datasetAPI } from '../services/api';
import { Dataset } from '../types';
import { Database, Upload, Calendar, Loader, FileText } from 'lucide-react';

const Datasets: React.FC = () => {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState('');

    useEffect(() => {
        fetchDatasets();
    }, []);

    const fetchDatasets = async () => {
        try {
            const response = await datasetAPI.list(1, 100);
            setDatasets(response.data.datasets);
        } catch (err: any) {
            setError('Failed to load datasets');
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight text-white">Data Repository</h1>
                        <p className="text-gray-400">Manage and inspect your forecasting datasets</p>
                    </div>
                    <Link to="/upload" className="btn-primary flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload New
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <Loader className="w-10 h-10 animate-spin mx-auto text-primary-400 mb-4" />
                            <p className="text-gray-500 font-medium">Loading inventory...</p>
                        </div>
                    ) : datasets.length === 0 ? (
                        <div className="col-span-full card py-20 text-center">
                            <Database className="w-12 h-12 mx-auto text-gray-700 mb-4" />
                            <p className="text-gray-500 mb-6">Your data vault is empty</p>
                            <Link to="/upload" className="btn-primary inline-flex">Get Started</Link>
                        </div>
                    ) : (
                        datasets.map((dataset) => (
                            <div key={dataset.id} className="card-hover group relative overflow-hidden border border-gray-800">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-primary-500/10 rounded-xl">
                                        <FileText className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <span className="text-xs font-black text-gray-600 uppercase">DOC #{dataset.id}</span>
                                </div>

                                <h3 className="text-xl font-bold mb-1 truncate text-white">{dataset.name}</h3>
                                <p className="text-gray-500 text-sm mb-6 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(dataset.createdAt).toLocaleDateString()}
                                </p>

                                <div className="flex gap-4 border-t border-gray-800/50 pt-4">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">Rows</p>
                                        <p className="text-lg font-black text-white">{dataset.rowCount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">Size</p>
                                        <p className="text-lg font-black text-white">{formatSize(dataset.fileSize)}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center">
                                    <Link to={`/forecast?datasetId=${dataset.id}`} className="text-xs font-black text-primary-400 hover:text-primary-300 tracking-widest uppercase flex items-center gap-1">
                                        Launch Forecast →
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Datasets;

import React, { useState } from 'react';
import axios from 'axios';
import Icon from '../AppIcon';
import api from '../../utils/api';

const endpoints = [
    { name: 'Get All Facilities (Full)', method: 'GET', url: '/facilities/public' },
    { name: 'Get All Facilities (No Region)', method: 'GET', url: '/facilities/public/no-region' },
    { name: 'Get Location Hierarchy (Full)', method: 'GET', url: '/facilities/locations' },
    { name: 'Get Location Hierarchy (No Region)', method: 'GET', url: '/facilities/locations/no-region' },
    { name: 'Get Facility Types', method: 'GET', url: '/facilities/types' },
    { name: 'Get All Facilities (FHIR)', method: 'GET', url: '/fhir/Location' },
    { name: 'Get Single Facility (FHIR)', method: 'GET', url: '/fhir/Location/1' }
];

const ApiTester = ({ isCollapsed }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const runTest = async (endpoint) => {
        setResults(prev => ({ ...prev, [endpoint.url]: { status: 'loading' } }));
        const start = Date.now();
        try {
            const res = await api({
                method: endpoint.method,
                url: endpoint.url
            });
            const duration = Date.now() - start;
            setResults(prev => ({
                ...prev,
                [endpoint.url]: {
                    status: 'success',
                    status_code: res.status,
                    duration: duration,
                    data_preview: JSON.stringify(res.data).slice(0, 100) + (JSON.stringify(res.data).length > 100 ? '...' : '')
                }
            }));
        } catch (error) {
            const duration = Date.now() - start;
            setResults(prev => ({
                ...prev,
                [endpoint.url]: {
                    status: 'error',
                    status_code: error.response?.status || 'Error',
                    duration: duration,
                    error_msg: error.message
                }
            }));
        }
    };

    const runAllTests = async () => {
        setIsLoading(true);
        setResults({}); // Clear previous results? Or keep them? Let's clear to show fresh run.
        for (const endpoint of endpoints) {
            await runTest(endpoint);
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-2 px-3 py-2 mb-2 rounded-md transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/10 w-full ${isCollapsed ? 'justify-center' : ''}`}
                title="Open API Tester"
            >
                <Icon name="Zap" size={16} className="text-amber-400" />
                {!isCollapsed && <span className="text-sm font-medium">Test APIs</span>}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <Icon name="Zap" className="text-amber-500" size={20} />
                                </div>
                                API Connectivity Tester
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <Icon name="X" size={20} />
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Validate connectivity to {endpoints.length} public endpoints.
                            </p>
                            <button
                                onClick={runAllTests}
                                disabled={isLoading}
                                className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <Icon name={isLoading ? "Loader2" : "Play"} className={isLoading ? "animate-spin" : ""} size={16} />
                                {isLoading ? 'Running Tests...' : 'Run All Tests'}
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
                            {endpoints.map((ep) => {
                                const result = results[ep.url];
                                return (
                                    <div key={ep.url} className="flex flex-col gap-2 p-3 transition-shadow bg-white border rounded-lg dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0 mr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${ep.method === 'GET' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-green-50 text-green-600 border-green-200'
                                                        }`}>
                                                        {ep.method}
                                                    </span>
                                                    <h3 className="text-sm font-semibold truncate text-slate-700 dark:text-slate-200" title={ep.name}>
                                                        {ep.name}
                                                    </h3>
                                                </div>
                                                <p className="pl-1 font-mono text-xs truncate text-slate-500">{ep.url}</p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {/* Status */}
                                                <div className="min-w-[100px] flex justify-end">
                                                    {result ? (
                                                        <div className="text-right">
                                                            {result.status === 'loading' && (
                                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                                    <Icon name="Loader2" size={12} className="animate-spin" /> Testing...
                                                                </span>
                                                            )}
                                                            {result.status === 'success' && (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                                        <Icon name="CheckCircle2" size={14} /> OK
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">{result.duration}ms</span>
                                                                </div>
                                                            )}
                                                            {result.status === 'error' && (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                                                                        <Icon name="XCircle" size={14} /> Failed
                                                                    </span>
                                                                    <span className="text-[10px] text-rose-400/70 truncate max-w-[100px]" title={result.error_msg || `Status ${result.status_code}`}>{result.status_code}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs transition-colors text-slate-300 dark:text-slate-600 group-hover:text-slate-400">Not run</span>
                                                    )}
                                                </div>

                                                <div className="flex justify-center w-8">
                                                    <button
                                                        onClick={() => runTest(ep)}
                                                        disabled={result?.status === 'loading'}
                                                        className="p-2 transition-colors rounded-full text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50"
                                                        title="Run single test"
                                                    >
                                                        <Icon name="Play" size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {result?.status === 'success' && result.data_preview && (
                                            <div className="p-2 mt-1 font-mono text-xs overflow-hidden transition-all border rounded text-slate-500 bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400">
                                                <div className="mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">response body preview:</div>
                                                <div className="break-all whitespace-pre-wrap line-clamp-3">
                                                    {result.data_preview}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ApiTester;

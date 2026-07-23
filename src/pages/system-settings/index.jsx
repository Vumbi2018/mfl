import React, { useState, useEffect, useRef } from 'react';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import Icon from '../../components/AppIcon';
import api from '../../utils/api';
import { useTheme } from '../../components/ThemeProvider';

const SystemSettings = () => {
    const { refreshTheme } = useTheme();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings');
            setSettings(res.data || {});
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load system settings.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get active category array regardless of key capitalization
    const getActiveCategoryKey = () => {
        return Object.keys(settings).find(k => k.toLowerCase() === activeTab.toLowerCase()) || activeTab;
    };

    const getActiveSettings = () => {
        const catKey = getActiveCategoryKey();
        return settings[catKey] || [];
    };

    const handleInputChange = (categoryKey, key, value) => {
        setSettings(prev => ({
            ...prev,
            [categoryKey]: (prev[categoryKey] || []).map(item => 
                item.key === key ? { ...item, value } : item
            )
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const flatSettings = {};
            Object.values(settings).flat().forEach(item => {
                if (item && item.key) {
                    flatSettings[item.key] = item.value;
                }
            });
            await api.put('/settings', flatSettings);
            if (refreshTheme) await refreshTheme();
            setSuccess('System configuration saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save settings: ' + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('logo', file);
        try {
            setSaving(true);
            await api.post('/settings/upload-logo', formData);
            await fetchSettings();
            if (refreshTheme) await refreshTheme();
            setSuccess('Tenant logo updated successfully!');
        } catch (err) {
            console.error('Logo upload error:', err);
            setError('Logo upload failed.');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: 'Settings' },
        { id: 'branding', label: 'Branding & Theme', icon: 'Palette' },
        { id: 'geospatial', label: 'Geospatial & Map', icon: 'Map' },
        { id: 'hierarchy', label: 'Admin Hierarchy', icon: 'Layers' },
        { id: 'security', label: 'Security & Auth', icon: 'Lock' }
    ];

    const fontOptions = ['Inter, sans-serif', 'Roboto, sans-serif', 'Outfit, sans-serif', 'Plus Jakarta Sans, sans-serif'];

    const renderInput = (setting, categoryKey) => {
        const val = setting.value ?? '';

        // Color input
        if (setting.key.includes('_color')) {
            return (
                <div className="flex items-center gap-3">
                    <input 
                        type="color" 
                        value={val || '#4f46e5'} 
                        onChange={(e) => handleInputChange(categoryKey, setting.key, e.target.value)} 
                        className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 shadow-sm" 
                    />
                    <input 
                        type="text" 
                        value={val} 
                        onChange={(e) => handleInputChange(categoryKey, setting.key, e.target.value)} 
                        className="px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl text-xs font-mono font-semibold" 
                    />
                </div>
            );
        }

        // Font family select
        if (setting.key === 'font_family') {
            return (
                <select 
                    value={val} 
                    onChange={(e) => handleInputChange(categoryKey, setting.key, e.target.value)} 
                    className="w-full max-w-sm px-3 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl text-xs font-semibold"
                >
                    {fontOptions.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
                </select>
            );
        }

        // Boolean toggle switch
        if (val === 'true' || val === 'false' || typeof val === 'boolean') {
            const boolVal = val === 'true' || val === true;
            return (
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={boolVal} 
                        onChange={(e) => handleInputChange(categoryKey, setting.key, e.target.checked ? 'true' : 'false')} 
                        className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-3 text-xs font-bold text-slate-700 dark:text-gray-300">{boolVal ? 'ENABLED' : 'DISABLED'}</span>
                </label>
            );
        }

        // System logo input
        if (setting.key === 'logo_url') {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        {val && (
                            <img src={val} alt="Tenant Logo" className="h-10 w-auto object-contain bg-slate-100 dark:bg-gray-800 p-1 rounded-lg border" />
                        )}
                        <input 
                            type="text" 
                            value={val} 
                            onChange={(e) => handleInputChange(categoryKey, setting.key, e.target.value)} 
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl text-xs font-medium" 
                        />
                    </div>
                    <div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-gray-700 flex items-center space-x-1.5"
                        >
                            <Icon name="Upload" size={14} />
                            <span>Upload New Logo Image</span>
                        </button>
                    </div>
                </div>
            );
        }

        // Generic text/number input
        return (
            <input 
                type="text" 
                value={val} 
                onChange={(e) => handleInputChange(categoryKey, setting.key, e.target.value)} 
                className="w-full max-w-md px-3.5 py-2 bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
        );
    };

    const currentCategoryKey = getActiveCategoryKey();
    const currentSettings = getActiveSettings();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-slate-50 dark:bg-gray-950">
                <Sidebar />
                <MobileMenuButton />

                <div className="flex-1 flex flex-col ml-0 lg:ml-[280px]">
                    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shrink-0">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">System Configuration</h1>
                            <p className="text-sm text-slate-500 dark:text-gray-400">Configure global tenant settings, branding, map coordinates, and security rules</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <IntegrationHealthMonitor />
                            <WorkflowStatusIndicator isFixed={false} />
                        </div>
                    </header>

                    <main className="p-6 max-w-5xl flex-1 space-y-6">
                        {success && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold shadow-sm flex items-center space-x-2 animate-in fade-in">
                                <Icon name="CheckCircle" size={16} />
                                <span>{success}</span>
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-2xl text-xs font-bold shadow-sm flex items-center space-x-2 animate-in fade-in">
                                <Icon name="AlertTriangle" size={16} />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden">
                            {/* Navigation Tabs */}
                            <div className="flex border-b border-slate-200 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/30 overflow-x-auto">
                                {tabs.map(tab => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id)} 
                                        className={`px-6 py-4 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 shadow-sm' : 'border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                                    >
                                        <Icon name={tab.icon} size={15} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Configuration Form Body */}
                            <div className="p-8 space-y-6">
                                {loading ? (
                                    <div className="flex flex-col justify-center items-center h-48 text-slate-400 space-y-2">
                                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-semibold">Loading tenant configuration settings...</span>
                                    </div>
                                ) : currentSettings.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 space-y-2">
                                        <p className="text-sm font-semibold">No configuration settings found for category '{activeTab}'</p>
                                        <p className="text-xs">Ensure your database has initialized tenant settings.</p>
                                    </div>
                                ) : (
                                    currentSettings.map(setting => (
                                        <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b border-slate-100 dark:border-gray-800 pb-5 last:border-b-0">
                                            <div>
                                                <label className="text-xs font-bold text-slate-800 dark:text-gray-200">
                                                    {setting.label || setting.key.replace(/_/g, ' ').toUpperCase()}
                                                </label>
                                                {setting.description && (
                                                    <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">{setting.description}</p>
                                                )}
                                            </div>
                                            <div className="md:col-span-2">
                                                {renderInput(setting, currentCategoryKey)}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {/* Action Buttons */}
                                <div className="pt-6 border-t border-slate-200 dark:border-gray-800 flex items-center justify-end space-x-3">
                                    <button 
                                        type="button"
                                        onClick={fetchSettings} 
                                        className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                                    >
                                        Discard Changes
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={handleSave} 
                                        disabled={saving || loading} 
                                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center space-x-2"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Applying Changes...</span>
                                            </>
                                        ) : (
                                            <span>Apply Configuration Changes</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
};

export default SystemSettings;

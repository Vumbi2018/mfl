import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Icon from '../AppIcon';
import { useTheme } from '../ThemeProvider';

const TenantSwitcher = ({ isCollapsed }) => {
    const { refreshTheme } = useTheme();
    const [tenants, setTenants] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentTenant = currentUser.tenant_code || 'zambia';

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                // Public endpoint
                const res = await fetch('http://localhost:5002/api/auth/tenants');
                const data = await res.json();
                setTenants(data);
            } catch (err) {
                console.error('Failed to load tenants:', err);
            }
        };
        fetchTenants();
    }, []);

    const handleSwitch = (tenantCode) => {
        if (tenantCode === currentTenant) return;
        
        // In a real app, this might involve a token exchange.
        // For this multi-tenant setup, we update the user's tenant_code in storage.
        const updatedUser = { ...currentUser, tenant_code: tenantCode };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Refresh the whole application context
        window.location.reload();
    };

    if (tenants.length <= 1) return null;

    const activeTenant = tenants.find(t => t.code === currentTenant) || { name: 'Country' };

    return (
        <div className="relative px-4 mb-4">
            {!isCollapsed && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Active Country</span>}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isOpen ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5 hover:bg-white/5'
                }`}
            >
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    <Icon name="Globe" size={14} className="text-white/60" />
                </div>
                {!isCollapsed && (
                    <>
                        <span className="text-xs font-bold text-white flex-1 text-left truncate">{activeTenant.name}</span>
                        <Icon name="ChevronDown" size={14} className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {isOpen && !isCollapsed && (
                <div className="absolute top-full left-4 right-4 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {tenants.map(t => (
                        <button
                            key={t.code}
                            onClick={() => { handleSwitch(t.code); setIsOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                                t.code === currentTenant ? 'bg-white/10 text-emerald-400' : 'text-slate-300'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${t.code === currentTenant ? 'bg-emerald-400' : 'bg-slate-600'}`}></div>
                            <span className="text-xs font-bold">{t.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TenantSwitcher;

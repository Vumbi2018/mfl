import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tenantCode = user.tenant_code || 'zambia';
    const isZambia = tenantCode === 'zambia';

    const [theme, setTheme] = useState({
        primaryColor: '#4f46e5', // indigo-600 default
        secondaryColor: '#6366f1', // indigo-500 default
        accentColor: '#fbbf24', // amber-400 default
        fontFamily: "'Inter', sans-serif",
        logoUrl: '/assets/images/emblem.png',
        systemName: isZambia ? 'Zambia National Health Facility Registry' : 'Papua New Guinea National HFR',
        defaultLat: isZambia ? -13.13 : -6.31,
        defaultLng: isZambia ? 27.84 : 143.95
    });


    const fetchTheme = async () => {
        try {
            const res = await api.get('/settings');
            const branding = res.data.Branding || res.data.branding || [];
            const general = res.data.General || res.data.general || [];
            const geospatial = res.data.Geospatial || res.data.geospatial || [];
            
            const newTheme = { ...theme };
            
            branding.forEach(s => {
                if (s.key === 'primary_color') newTheme.primaryColor = s.value;
                if (s.key === 'secondary_color') newTheme.secondaryColor = s.value;
                if (s.key === 'accent_color') newTheme.accentColor = s.value;
                if (s.key === 'font_family') newTheme.fontFamily = s.value;
                if (s.key === 'logo_url') newTheme.logoUrl = s.value;
            });

            general.forEach(s => {
                if (s.key === 'system_name') newTheme.systemName = s.value;
            });

            geospatial.forEach(s => {
                if (s.key === 'default_lat') newTheme.defaultLat = parseFloat(s.value);
                if (s.key === 'default_lng') newTheme.defaultLng = parseFloat(s.value);
            });

            setTheme(newTheme);
            applyTheme(newTheme);
        } catch (err) {
            console.error('Failed to load theme settings:', err);
        }
    };

    const applyTheme = (t) => {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', t.primaryColor);
        root.style.setProperty('--secondary-color', t.secondaryColor);
        root.style.setProperty('--accent-color', t.accentColor);
        root.style.setProperty('--font-family', t.fontFamily);
        document.body.style.fontFamily = t.fontFamily;
    };

    useEffect(() => {
        fetchTheme();
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, refreshTheme: fetchTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

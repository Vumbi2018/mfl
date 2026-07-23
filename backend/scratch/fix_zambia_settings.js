const pool = require('../db');

async function fixSettings() {
    try {
        const tenantCode = 'zambia';
        const defaults = [
            { key: 'primary_color', value: '#15803d', label: 'Primary Color', category: 'Branding' }, // Green for Zambia
            { key: 'secondary_color', value: '#16a34a', label: 'Secondary Color', category: 'Branding' },
            { key: 'accent_color', value: '#fbbf24', label: 'Accent Color', category: 'Branding' },
            { key: 'font_family', value: "'Inter', sans-serif", label: 'Font Family', category: 'Branding' },
            { key: 'logo_url', value: '/assets/images/emblem.png', label: 'System Logo', category: 'Branding' },
            { key: 'system_name', value: 'Zambia Master Health Facility List', label: 'System Name', category: 'General' },
            { key: 'default_lat', value: '-13.1339', label: 'Default Latitude', category: 'Geospatial' },
            { key: 'default_lng', value: '27.8493', label: 'Default Longitude', category: 'Geospatial' }
        ];

        for (const s of defaults) {
            await pool.query(
                'INSERT INTO tenant_settings (tenant_code, key, value, label, category) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (tenant_code, key) DO UPDATE SET value = $3',
                [tenantCode, s.key, s.value, s.label, s.category]
            );
        }
        
        console.log("Zambia settings initialized/updated.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixSettings();

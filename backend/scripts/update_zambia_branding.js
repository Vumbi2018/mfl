const pool = require('../db');

const ZAMBIA_SETTINGS = [
    { key: 'primary_color', value: '#198a00', label: 'Primary Color', category: 'Branding' }, // Zambian Green
    { key: 'secondary_color', value: '#ff8a00', label: 'Secondary Color', category: 'Branding' }, // Zambian Orange
    { key: 'accent_color', value: '#de2010', label: 'Accent Color', category: 'Branding' }, // Zambian Red
    { key: 'font_family', value: "'Inter', sans-serif", label: 'Font Family', category: 'Branding' },
    { key: 'logo_url', value: '/uploads/zambia_emblem.png', label: 'System Logo', category: 'Branding' },
    { key: 'system_name', value: 'Zambia Master Health Facility List', label: 'System Name', category: 'General' }
];

async function applyZambiaBranding() {
    console.log('🇿🇲 Applying Zambia branding...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const setting of ZAMBIA_SETTINGS) {
            await client.query(
                `INSERT INTO tenant_settings (tenant_code, key, value, label, category)
                 VALUES ('zambia', $1, $2, $3, $4)
                 ON CONFLICT (tenant_code, key) DO UPDATE 
                 SET value = EXCLUDED.value, label = EXCLUDED.label, category = EXCLUDED.category`,
                [setting.key, setting.value, setting.label, setting.category]
            );
        }
        await client.query('COMMIT');
        console.log('✅ Zambia branding applied!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('💥 Error applying branding:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

applyZambiaBranding();

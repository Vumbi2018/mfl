const pool = require('../db');
const path = require('path');
const fs = require('fs');

/**
 * Get all tenant settings
 */
exports.getSettings = async (req, res) => {
    try {
        let result = await pool.query(
            'SELECT * FROM tenant_settings WHERE tenant_code = $1 ORDER BY category, label',
            [req.tenantCode]
        );
        
        // If no settings found, initialize defaults for this tenant
        if (result.rows.length === 0) {
            console.log(`🌱 Initializing default settings for tenant: ${req.tenantCode}`);
            const defaults = [
                { key: 'primary_color', value: '#4f46e5', label: 'Primary Color', category: 'Branding' },
                { key: 'secondary_color', value: '#6366f1', label: 'Secondary Color', category: 'Branding' },
                { key: 'accent_color', value: '#fbbf24', label: 'Accent Color', category: 'Branding' },
                { key: 'font_family', value: "'Inter', sans-serif", label: 'Font Family', category: 'Branding' },
                { key: 'logo_url', value: '/assets/images/emblem.png', label: 'System Logo', category: 'Branding' },
                { key: 'system_name', value: `${req.tenantCode.toUpperCase()} Master Facility List`, label: 'System Name', category: 'General' },
                { key: 'default_lat', value: req.tenantCode === 'zambia' ? '-13.1339' : '-6.3149', label: 'Default Latitude', category: 'Geospatial' },
                { key: 'default_lng', value: req.tenantCode === 'zambia' ? '27.8493' : '143.9555', label: 'Default Longitude', category: 'Geospatial' }
            ];

            for (const s of defaults) {
                await pool.query(
                    'INSERT INTO tenant_settings (tenant_code, key, value, label, category) VALUES ($1, $2, $3, $4, $5)',
                    [req.tenantCode, s.key, s.value, s.label, s.category]
                );
            }

            result = await pool.query(
                'SELECT * FROM tenant_settings WHERE tenant_code = $1 ORDER BY category, label',
                [req.tenantCode]
            );
        }

        // Group by category for easier frontend handling
        const grouped = result.rows.reduce((acc, curr) => {
            if (!acc[curr.category]) acc[curr.category] = [];
            acc[curr.category].push(curr);
            return acc;
        }, {});

        res.json(grouped);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ error: 'Failed to fetch tenant settings' });
    }
};

/**
 * Update tenant settings
 */
exports.updateSettings = async (req, res) => {
    const settings = req.body; 
    
    if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings data provided' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        for (const [key, value] of Object.entries(settings)) {
            await client.query(
                'UPDATE tenant_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2 AND tenant_code = $3',
                [value ? value.toString() : '', key, req.tenantCode]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating settings:', err);
        res.status(500).json({ error: 'Failed to update tenant settings' });
    } finally {
        client.release();
    }
};

/**
 * Upload tenant logo
 */
exports.uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const logoUrl = `/uploads/${req.file.filename}`;
        
        // Update the setting in database
        await pool.query(
            "UPDATE tenant_settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'logo_url' AND tenant_code = $2",
            [logoUrl, req.tenantCode]
        );

        res.json({ 
            message: 'Logo uploaded successfully',
            url: logoUrl
        });
    } catch (err) {
        console.error('Error uploading logo:', err);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
};

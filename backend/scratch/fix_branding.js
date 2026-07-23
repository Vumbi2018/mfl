const pool = require('../db');

async function fixBranding() {
    try {
        // Zambia
        await pool.query(
            "UPDATE tenant_settings SET value = '/uploads/zambia_emblem.png' WHERE key = 'logo_url' AND tenant_code = 'zambia'"
        );
        
        // PNG (assuming we want a different logo for PNG)
        // Check if png_emblem exists, if not use default emblem.png
        await pool.query(
            "UPDATE tenant_settings SET value = '/assets/images/emblem.png' WHERE key = 'logo_url' AND tenant_code = 'png'"
        );

        console.log("Branding paths updated.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixBranding();

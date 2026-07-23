const pool = require('../db');

async function checkSettings() {
    try {
        const res = await pool.query("SELECT * FROM system_settings WHERE key IN ('default_lat', 'default_lng')");
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSettings();

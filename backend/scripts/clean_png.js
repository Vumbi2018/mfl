const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function cleanPNG() {
    const client = await pool.connect();
    try {
        console.log('Starting Cleanup of PNG Data...');
        await client.query('BEGIN');
        
        // Facilities
        const facRes = await client.query("DELETE FROM facilities WHERE tenant_code != 'zambia' RETURNING id;");
        console.log(`Deleted ${facRes.rowCount} non-Zambia facilities.`);

        // Districts (ADM2)
        const distRes = await client.query("DELETE FROM districts WHERE tenant_code != 'zambia' RETURNING id;");
        console.log(`Deleted ${distRes.rowCount} non-Zambia districts.`);

        // Provinces (ADM1)
        const provRes = await client.query("DELETE FROM provinces WHERE tenant_code != 'zambia' RETURNING id;");
        console.log(`Deleted ${provRes.rowCount} non-Zambia provinces.`);

        // Regions
        const regRes = await client.query("DELETE FROM regions WHERE tenant_code != 'zambia' RETURNING id;");
        console.log(`Deleted ${regRes.rowCount} non-Zambia regions.`);

        await client.query('COMMIT');
        console.log('Cleanup completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error cleaning up data:', err);
    } finally {
        client.release();
        pool.end();
    }
}

cleanPNG();

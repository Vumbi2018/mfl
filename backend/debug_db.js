const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Adjust path to .env depending on where script is run
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkData() {
    try {
        console.log("Checking DB Connection...");
        const counts = {};

        const regions = await pool.query('SELECT COUNT(*) FROM regions');
        counts.regions = regions.rows[0].count;
        console.log(`Regions: ${counts.regions}`);

        const provinces = await pool.query('SELECT COUNT(*) FROM provinces');
        counts.provinces = provinces.rows[0].count;
        console.log(`Provinces: ${counts.provinces}`);

        const districts = await pool.query('SELECT COUNT(*) FROM districts');
        counts.districts = districts.rows[0].count;
        console.log(`Districts: ${counts.districts}`);

        const facilities = await pool.query('SELECT COUNT(*) FROM facilities');
        counts.facilities = facilities.rows[0].count;
        console.log(`Facilities: ${counts.facilities}`);

        if (parseInt(counts.regions) > 0) {
            console.log("Sample Regions:");
            const sample = await pool.query('SELECT * FROM regions LIMIT 5');
            console.table(sample.rows);
        }

        // Check Join
        const joinCheck = await pool.query(`
            SELECT COUNT(*) 
            FROM regions r
            JOIN provinces p ON r.id = p.region_id
        `);
        console.log(`Regions with Provinces linked: ${joinCheck.rows[0].count}`);

    } catch (err) {
        console.error("DB Check Failed:", err);
    } finally {
        pool.end();
    }
}

checkData();

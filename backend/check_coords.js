const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function checkCoords() {
    try {
        const total = await pool.query('SELECT COUNT(*) FROM facilities');
        const withCoords = await pool.query('SELECT COUNT(*) FROM facilities WHERE latitude IS NOT NULL AND longitude IS NOT NULL');
        const sample = await pool.query('SELECT id, name, latitude, longitude FROM facilities WHERE latitude IS NOT NULL LIMIT 5');

        console.log(`\n--- COORDINATE CHECK ---`);
        console.log(`Total Facilities: ${total.rows[0].count}`);
        console.log(`With Coords:      ${withCoords.rows[0].count}`);
        console.log(`------------------------`);
        console.log('Sample Mapped Facilities:', sample.rows);

        if (parseInt(withCoords.rows[0].count) === 0) {
            console.log("\n⚠️ NO FACILITIES HAVE COORDINATES! THE MAP WILL BE EMPTY.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkCoords();

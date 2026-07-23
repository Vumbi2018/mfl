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

async function checkData() {
    try {
        const facRes = await pool.query('SELECT COUNT(*) FROM facilities');
        const userRes = await pool.query('SELECT COUNT(*) FROM users');
        const ticketRes = await pool.query('SELECT COUNT(*) FROM tickets');

        console.log(`\n--- DATA CHECK ---`);
        console.log(`Facilities: ${facRes.rows[0].count}`);
        console.log(`Users:      ${userRes.rows[0].count}`);
        console.log(`Tickets:    ${ticketRes.rows[0].count}`);
        console.log(`------------------\n`);

        if (parseInt(ticketRes.rows[0].count) > 0) {
            const tickets = await pool.query('SELECT * FROM tickets LIMIT 3');
            console.log('Sample Tickets:', tickets.rows);
        }

    } catch (err) {
        console.error('Error checking data:', err.message);
    } finally {
        pool.end();
    }
}

checkData();

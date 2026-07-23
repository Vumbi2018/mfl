const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'mfl_db';

const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default DB to drop target DB
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
};

async function resetDatabase() {
    const client = new Client(config);

    try {
        await client.connect();

        // Terminate existing connections
        await client.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
        `);
        console.log(`Terminated connections to ${DB_NAME}`);

        // Drop Database
        await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
        console.log(`Dropped database ${DB_NAME}`);

    } catch (err) {
        console.error('Error resetting database:', err);
    } finally {
        await client.end();
    }
}

resetDatabase();

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'mfl_db';

// Config to connect to default 'postgres' database to create the new one
const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
};

async function setupDatabase() {
    const client = new Client(config);

    try {
        await client.connect();

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'`);

        if (res.rowCount === 0) {
            console.log(`Database ${DB_NAME} does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${DB_NAME}"`);
            console.log(`Database ${DB_NAME} created successfully.`);
        } else {
            console.log(`Database ${DB_NAME} already exists.`);
        }

    } catch (err) {
        console.error('Error checking/creating database:', err);
    } finally {
        await client.end();
    }

    // Now connect to the new database and run init script
    const dbClient = new Client({ ...config, database: DB_NAME });

    try {
        await dbClient.connect();
        console.log(`Connected to ${DB_NAME}. Running schema initialization...`);

        const sqlPath = path.join(__dirname, '../database/init_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await dbClient.query(sql);
        console.log('Schema initialization completed successfully.');

    } catch (err) {
        console.error('Error running init script:', err);
    } finally {
        await dbClient.end();
    }
}

setupDatabase();

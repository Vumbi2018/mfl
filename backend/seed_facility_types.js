const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file in the same directory or parent
dotenv.config({ path: path.join(__dirname, '.env') });
// Also try parent just in case
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('DB Config:', {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    db: process.env.DB_NAME || 'mfl_db',
    port: process.env.DB_PORT
});

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

const facilityTypes = [
    'Provincial Hospital',
    'District Hospital',
    'Rural Hospital',
    'Hospital',
    'Urban Health Center',
    'Health Center',
    'Health Sub Centre',
    'Community Health Post',
    'Aid Post',
    'Urban Clinic',
    'Clinic',
    'Specialized Center',
    'Nursing Home'
];

async function seed() {
    try {
        console.log('Connecting to database...');

        // 1. Create Table
        console.log('Creating table facility_types...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS facility_types (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Table created or already exists.');

        // 2. Insert Data
        console.log('Inserting facility types...');
        for (const type of facilityTypes) {
            await pool.query(`
                INSERT INTO facility_types (name) 
                VALUES ($1) 
                ON CONFLICT (name) DO NOTHING
            `, [type]);
        }
        console.log('Facility types seeded successfully.');

    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

seed();

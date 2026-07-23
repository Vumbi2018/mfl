const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  };

const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
});

module.exports = pool;

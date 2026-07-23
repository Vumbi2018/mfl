const { Pool } = require('pg');

const configMFL = {
    user: 'postgres',
    host: 'localhost',
    database: 'mfl_db',
    password: 'S@mund3ng0',
    port: 5432,
};

const configPNG = {
    user: 'postgres',
    host: 'localhost',
    database: 'png_ccets', // We want to see if this exists
    password: 'postgres',
    port: 5432,
};

async function check() {
    // 1. Check for missing user in MFL_DB (Current)
    console.log("--- Checking Current DB (mfl_db) ---");
    const poolMFL = new Pool(configMFL);
    try {
        const res = await poolMFL.query('SELECT id, email, first_name, last_name FROM users');
        console.log("MFL_DB Users:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.log("Error mfl_db:", e.message);
    } finally {
        poolMFL.end();
    }

    // 2. Check PNG (Old/Duplicate)
    console.log("\n--- Checking Old DB (png_ccets) ---");
    const poolPNG = new Pool(configPNG);
    try {
        const res = await poolPNG.query('SELECT id, email, first_name, last_name FROM users');
        console.log("PNG_CCETS Users:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.log("Error png_ccets (pass: postgres):", e.message);

        // Retry with S@mund3ng0
        console.log("Retrying with other password...");
        const poolPNG2 = new Pool({ ...configPNG, password: 'S@mund3ng0' });
        try {
            const res2 = await poolPNG2.query('SELECT * FROM users LIMIT 5');
            console.log("PNG_CCETS Users (pass: S@mund3ng0):", JSON.stringify(res2.rows, null, 2));
        } catch (e2) {
            console.log("Error png_ccets (pass: S@mund3ng0):", e2.message);
        } finally {
            poolPNG2.end();
        }
    } finally {
        poolPNG.end();
    }

    // 3. List ALL Databases
    console.log("\n--- Listing All Databases ---");
    const poolList = new Pool(configMFL);
    try {
        const res = await poolList.query('SELECT datname FROM pg_database WHERE datistemplate = false');
        res.rows.forEach(r => console.log(r.datname));
    } catch (e) {
        console.log("Error listing DBs:", e.message);
    } finally {
        poolList.end();
    }
}

check();

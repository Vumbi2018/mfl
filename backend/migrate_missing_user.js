const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

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
    database: 'png_ccets',
    password: 'S@mund3ng0',
    port: 5432,
};

async function migrateUser() {
    const poolMFL = new Pool(configMFL);
    const poolPNG = new Pool(configPNG);

    try {
        console.log("--- Fetching user 'Lawrence Mukombo' from png_ccets ---");
        const res = await poolPNG.query("SELECT * FROM users WHERE email = 'lawrencemukombo2@gmail.com'");

        if (res.rows.length === 0) {
            console.error("User not found in png_ccets!");
            return;
        }

        const oldUser = res.rows[0];
        console.log("Found user:", oldUser.email);

        // Check MFL schema to map fields
        console.log("--- Checking MFL_DB Schema ---");
        const schemaRes = await poolMFL.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        const mflColumns = schemaRes.rows.map(r => r.column_name);
        console.log("MFL Columns:", mflColumns.join(', '));

        const insertCols = [];
        const insertVals = [];

        // Common fields
        if (mflColumns.includes('email')) { insertCols.push('email'); insertVals.push(oldUser.email); }
        if (mflColumns.includes('first_name')) { insertCols.push('first_name'); insertVals.push(oldUser.first_name); }
        if (mflColumns.includes('last_name')) { insertCols.push('last_name'); insertVals.push(oldUser.last_name); }
        if (mflColumns.includes('phone_number') && oldUser.phone_number) { insertCols.push('phone_number'); insertVals.push(oldUser.phone_number); }

        // Handle Password (map password -> password_hash)
        if (mflColumns.includes('password_hash')) {
            insertCols.push('password_hash');
            // If oldUser has password, hash it. Else default 'S@mund3ng0' hashed (approx) or 'password123'
            const plainPassword = oldUser.password || 'password123';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            insertVals.push(hashedPassword);
        } else if (mflColumns.includes('password') && oldUser.password) {
            insertCols.push('password');
            insertVals.push(oldUser.password);
        }

        // Handle username if required (MFL DB seems to require it, unlike old DB)
        if (mflColumns.includes('username')) {
            insertCols.push('username');
            // If oldUser has username, use it, else derive from email
            const newUsername = oldUser.username || oldUser.email.split('@')[0];
            insertVals.push(newUsername);
        }

        // Prepare Insert
        const insertPlaceholders = insertVals.map((_, i) => `$${i + 1}`);
        const query = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${insertPlaceholders.join(', ')}) RETURNING *`;

        console.log("--- Inserting into mfl_db ---");
        const insertRes = await poolMFL.query(query, insertVals);
        console.log("Successfully migrated user:", insertRes.rows[0]);

    } catch (e) {
        console.error("Migration Error:", e);
    } finally {
        poolMFL.end();
        poolPNG.end();
    }
}

migrateUser();

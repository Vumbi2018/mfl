const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
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

const CSV_FILE_PATH = path.join(__dirname, '../data/facilities.csv'); // Adjust path as needed

async function seedData() {
    // We need to verify if file exists, but for now we write the logic
    // expecting specific columns: region, province, district, normalized, eNHIS_cod, latitude, longitude, agency_na, hf_type, operational_status

    const results = [];

    // Check if CSV exists (User might need to place it)
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`CSV file not found at ${CSV_FILE_PATH}. Please ensure the file is present.`);
        // Create a dummy file or exit? We'll exit but keep connection verification.
        // process.exit(1); 
        console.log("WAITING FOR CSV... ensure 'c:/mfl/data/facilities.csv' exists.");
        // Proceeding with mock data or just returning for now if file missing
    }

    console.log("Reading CSV...");

    fs.createReadStream(CSV_FILE_PATH)
        .on('error', (err) => {
            // If error (e.g. file not found), just log
            console.log("Could not read CSV, skipping import for now. Error:", err.message);
            pool.end();
        })
        .pipe(csv({
            mapHeaders: ({ header, index }) => header.trim().replace(/^\ufeff/, '')
        }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} rows. Starting import...`);
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Sets to cache IDs
                const regionsMap = new Map();
                const provincesMap = new Map();
                const districtsMap = new Map();

                // 1. Process Hierarchy (Regions -> Provinces -> Districts)

                // Helper to format names: Title Case + Uppercase specific abbreviations
                const abbrs = new Set(['SC', 'HC', 'UC', 'DH', 'PH', 'VHP', 'CHP', 'HEC', 'NH', 'UST', 'AIC', 'CIC']);

                const formatName = (str) => {
                    if (!str) return str;
                    return str.toLowerCase().split(/[\s/]+/).map((word, index, array) => {
                        // Check for slash in original string to preserve? 
                        // Simpler approach: split by word boundary, but handle delimiters.
                        // Actually, simpler regex replace might be better or just splitting by space.
                        // Let's stick to simple split by space for now, adjusting for slash if needed.
                        // If data has "foo/bar", split by space treats it as one word.
                        // Let's use a regex replace to capitalize words.

                        return word.replace(/\b\w+/g, (txt) => {
                            const upper = txt.toUpperCase();
                            if (abbrs.has(upper)) return upper;
                            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                        });
                    }).join(' ').replace(/\s\/\s/g, '/'); // simple join

                    // Better approach for strict requirements:
                    // 1. Lowercase whole string
                    // 2. Replace each word boundary char
                    return str.replace(/\b\w+\b/g, (txt) => {
                        if (abbrs.has(txt.toUpperCase())) return txt.toUpperCase();
                        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                    });
                };

                let isFirst = true;
                for (const row of results) {
                    if (isFirst) {
                        fs.writeFileSync('debug_seed.txt', "First Row Keys: " + JSON.stringify(Object.keys(row)) + "\nFirst Row Region: " + row.region);
                        isFirst = false;
                    }
                    // --- REGION ---
                    let regionName = formatName(row.region?.trim());
                    if (!regionName) continue;

                    let regionId = regionsMap.get(regionName);
                    if (!regionId) {
                        // Check DB
                        const res = await client.query('SELECT id FROM regions WHERE name = $1', [regionName]);
                        if (res.rows.length > 0) {
                            regionId = res.rows[0].id;
                        } else {
                            const insertRes = await client.query('INSERT INTO regions (name) VALUES ($1) RETURNING id', [regionName]);
                            regionId = insertRes.rows[0].id;
                        }
                        regionsMap.set(regionName, regionId);
                    }

                    // --- PROVINCE ---
                    let provinceName = formatName(row.province?.trim());
                    if (!provinceName) continue;

                    let provinceKey = `${regionName}-${provinceName}`; // Unique key
                    let provinceId = provincesMap.get(provinceKey);

                    if (!provinceId) {
                        const res = await client.query('SELECT id FROM provinces WHERE name = $1 AND region_id = $2', [provinceName, regionId]);
                        if (res.rows.length > 0) {
                            provinceId = res.rows[0].id;
                        } else {
                            const insertRes = await client.query('INSERT INTO provinces (name, region_id) VALUES ($1, $2) RETURNING id', [provinceName, regionId]);
                            provinceId = insertRes.rows[0].id;
                        }
                        provincesMap.set(provinceKey, provinceId);
                    }

                    // --- DISTRICT ---
                    // CSV header says 'district' (normalized) or check alternatives
                    let districtRaw = (row.district || row.distict)?.trim();
                    let districtName = formatName(districtRaw);
                    if (!districtName) continue;

                    let districtKey = `${provinceName}-${districtName}`;
                    let districtId = districtsMap.get(districtKey);

                    if (!districtId) {
                        const res = await client.query('SELECT id FROM districts WHERE name = $1 AND province_id = $2', [districtName, provinceId]);
                        if (res.rows.length > 0) {
                            districtId = res.rows[0].id;
                        } else {
                            const insertRes = await client.query('INSERT INTO districts (name, province_id) VALUES ($1, $2) RETURNING id', [districtName, provinceId]);
                            districtId = insertRes.rows[0].id;
                        }
                        districtsMap.set(districtKey, districtId);
                    }

                    // --- FACILITY ---
                    const name = formatName(row.normalized_name || row.normalized || row.name || "Unknown");
                    const code = row.eNHIS_code || row.eNHIS_cod || row.code;
                    const lat = parseFloat(row.latitude);
                    const lng = parseFloat(row.longitude);
                    const agency = formatName(row.agency_name || row.agency_na);
                    const type = formatName(row.hf_type);
                    const status = formatName(row.operational_status); // e.g. "Active"

                    // Insert Facility
                    // Use ON CONFLICT DO UPDATE or just SKIP if exists (using code implies uniqueness)
                    // If lat/lng implies valid geom
                    let geomSql = 'NULL';
                    if (!isNaN(lat) && !isNaN(lng)) {
                        geomSql = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
                    }

                    const query = `
                        INSERT INTO facilities (
                            name, code, type, operational_status, agency_name, district_id, 
                            geom, latitude, longitude, ownership, workflow_status
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, ${geomSql}, $7, $8, $5, 'APPROVED') 
                        ON CONFLICT (code) DO UPDATE SET
                        name = EXCLUDED.name,
                        type = EXCLUDED.type,
                        operational_status = EXCLUDED.operational_status,
                        agency_name = EXCLUDED.agency_name,
                        ownership = EXCLUDED.ownership,
                        district_id = EXCLUDED.district_id,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude
                        RETURNING id;
                    `;

                    // console.log("Inserting facility:", name); 
                    // Values: name, code, type, status, agency (as agency_name), districtId, lat, lng
                    // $5 is agency_name, reused for ownership ($5)
                    await client.query(query, [name, code, type, status, agency, districtId, lat, lng]);
                }

                await client.query('COMMIT');
                console.log('Import completed successfully.');
            } catch (err) {
                await client.query('ROLLBACK');
                console.error('Error during import:', err);
            } finally {
                client.release();
                pool.end();
            }
        });
}

seedData();

const fs = require('fs');
const pool = require('../db');
const path = require('path');

async function improvedImport() {
    const tenant = 'zambia';
    const adm1Path = path.join(__dirname, '../../backend/data/zambia_adm1.geojson');
    const adm2Path = path.join(__dirname, '../../backend/data/zambia_adm2.geojson');

    console.log(`🌍 Starting Improved Geometry Import for ${tenant}...`);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Process ADM1 (Provinces)
        if (fs.existsSync(adm1Path)) {
            const adm1 = JSON.parse(fs.readFileSync(adm1Path, 'utf8'));
            for (const feature of adm1.features) {
                let name = feature.properties.shapeName || feature.properties.name;
                const geom = JSON.stringify(feature.geometry);
                const normalizedName = name.replace('-', '').replace(' ', '');

                const res = await client.query(
                    `UPDATE provinces SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) 
                     WHERE (name ILIKE $2 OR name ILIKE $3 OR REPLACE(name, '-', '') ILIKE $4) AND tenant_code = $5`,
                    [geom, name, normalizedName, normalizedName, tenant]
                );
                console.log(`  - Province ${name}: ${res.rowCount} updated`);
            }
        }

        // 2. Process ADM2 (Districts)
        if (fs.existsSync(adm2Path)) {
            const adm2 = JSON.parse(fs.readFileSync(adm2Path, 'utf8'));
            for (const feature of adm2.features) {
                const name = feature.properties.shapeName || feature.properties.name;
                const geom = JSON.stringify(feature.geometry);
                
                // Normalization
                const n1 = name.replace('-', ' ').replace(' ', '');
                const n2 = name.substring(0, 5); // First 5 chars for prefix match (e.g. Chieng)

                const res = await client.query(
                    `UPDATE districts SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) 
                     WHERE (name ILIKE $2 OR name ILIKE $3 OR name ILIKE $4) AND tenant_code = $5`,
                    [geom, name, n1, `${n2}%`, tenant]
                );
                
                if (res.rowCount === 0) {
                    console.log(`  ⚠️ District ${name}: No match in database.`);
                }
            }
        }

        await client.query('COMMIT');
        console.log("✅ Import complete!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("💥 Error:", err);
    } finally {
        client.release();
        process.exit(0);
    }
}

improvedImport();

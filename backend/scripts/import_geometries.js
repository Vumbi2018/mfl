const fs = require('fs');
const path = require('path');
const pool = require('../db');

const ADM1_PATH = path.join(__dirname, '../data/zambia_adm1.geojson');
const ADM2_PATH = path.join(__dirname, '../data/zambia_adm2.geojson');
const TENANT_CODE = 'zambia';

async function importGeometries() {
    console.log('🌍 Importing Zambia geometries...');
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Import Provinces (ADM1)
        if (fs.existsSync(ADM1_PATH)) {
            console.log('📍 Processing Provinces...');
            const adm1 = JSON.parse(fs.readFileSync(ADM1_PATH, 'utf8'));
            for (const feature of adm1.features) {
                // geoBoundaries usually uses shapeName or shapeID
                const name = feature.properties.shapeName;
                const geom = JSON.stringify(feature.geometry);

                const res = await client.query(
                    `UPDATE provinces SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) 
                     WHERE (name ILIKE $2 OR name ILIKE $3) AND tenant_code = $4`,
                    [geom, name, `%${name}%`, TENANT_CODE]
                );
                console.log(`  - Province ${name}: ${res.rowCount} updated`);
            }
        }

        // 2. Import Districts (ADM2)
        if (fs.existsSync(ADM2_PATH)) {
            console.log('📍 Processing Districts...');
            const adm2 = JSON.parse(fs.readFileSync(ADM2_PATH, 'utf8'));
            for (const feature of adm2.features) {
                const name = feature.properties.shapeName;
                const geom = JSON.stringify(feature.geometry);

                const res = await client.query(
                    `UPDATE districts SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) 
                     WHERE (name ILIKE $2 OR name ILIKE $3) AND tenant_code = $4`,
                    [geom, name, `%${name}%`, TENANT_CODE]
                );
                if (res.rowCount > 0) {
                    /* console.log(`  - District ${name}: Updated`); */
                } else {
                    console.log(`  ⚠️ District ${name}: No match in database`);
                }
            }
        }

        await client.query('COMMIT');
        console.log('✅ Geometry import complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('💥 Error importing geometries:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

importGeometries();

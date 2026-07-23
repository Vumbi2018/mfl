const fs = require('fs');
const path = require('path');
const pool = require('../db');

/**
 * USAGE: node import_spatial_data.js <tenant_code> <adm1_geojson_path> <adm2_geojson_path>
 */

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node import_spatial_data.js <tenant_code> <adm1_geojson_path> <adm2_geojson_path>');
    process.exit(1);
}

const [TENANT_CODE, ADM1_PATH, ADM2_PATH] = args;

async function importGeometries() {
    console.log(`🌍 Importing geometries for tenant: ${TENANT_CODE}...`);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Import Provinces (ADM1)
        if (fs.existsSync(ADM1_PATH)) {
            console.log(`📍 Processing ADM1 (Provinces) from ${ADM1_PATH}...`);
            const adm1 = JSON.parse(fs.readFileSync(ADM1_PATH, 'utf8'));
            for (const feature of adm1.features) {
                const name = feature.properties.shapeName || feature.properties.name || feature.properties.NAME_1;
                const geom = JSON.stringify(feature.geometry);

                const res = await client.query(
                    `UPDATE provinces SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) 
                     WHERE (name ILIKE $2 OR name ILIKE $3) AND tenant_code = $4`,
                    [geom, name, `%${name}%`, TENANT_CODE]
                );
                console.log(`  - ADM1 ${name}: ${res.rowCount} updated`);
            }
        }

        // 2. Import Districts (ADM2)
        if (fs.existsSync(ADM2_PATH)) {
            console.log(`📍 Processing ADM2 (Districts) from ${ADM2_PATH}...`);
            const adm2 = JSON.parse(fs.readFileSync(ADM2_PATH, 'utf8'));
            for (const feature of adm2.features) {
                const name = feature.properties.shapeName || feature.properties.name || feature.properties.NAME_2;
                const geom = JSON.stringify(feature.geometry);

                const res = await client.query(
                    `UPDATE districts SET geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) 
                     WHERE (name ILIKE $2 OR name ILIKE $3) AND tenant_code = $4`,
                    [geom, name, `%${name}%`, TENANT_CODE]
                );
                if (res.rowCount > 0) {
                    // console.log(`  - ADM2 ${name}: Updated`);
                } else {
                    console.log(`  ⚠️ ADM2 ${name}: No match in database for tenant ${TENANT_CODE}`);
                }
            }
        }

        await client.query('COMMIT');
        console.log(`✅ Geometry import for ${TENANT_CODE} complete!`);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('💥 Error importing geometries:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

importGeometries();

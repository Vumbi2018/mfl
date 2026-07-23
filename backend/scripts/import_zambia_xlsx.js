const XLSX = require('xlsx');
const pool = require('../db');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../../Zambian Health Facilities.xlsx');
const TENANT_CODE = 'zambia';

async function importZambiaData() {
    console.log('🚀 Starting Zambia XLSX data import...');
    
    try {
        const workbook = XLSX.readFile(FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Skip header row
        const rows = rawData.slice(1);
        console.log(`📄 Found ${rows.length} rows to process.`);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Ensure tenant exists
            await client.query(
                'INSERT INTO tenants (name, code) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
                ['Zambia', TENANT_CODE]
            );

            // 2. Clear existing Zambia hierarchy and facilities
            // We do this to ensure we use the new hierarchy from the Excel
            console.log('🧹 Cleaning existing Zambia data...');
            await client.query('DELETE FROM facility_identifiers WHERE facility_id IN (SELECT id FROM facilities WHERE tenant_code = $1)', [TENANT_CODE]);
            await client.query('DELETE FROM facilities WHERE tenant_code = $1', [TENANT_CODE]);
            await client.query('DELETE FROM districts WHERE tenant_code = $1', [TENANT_CODE]);
            await client.query('DELETE FROM provinces WHERE tenant_code = $1', [TENANT_CODE]);
            await client.query('DELETE FROM regions WHERE tenant_code = $1', [TENANT_CODE]);

            // 3. Create a default region for Zambia
            const regionRes = await client.query(
                'INSERT INTO regions (name, code, tenant_code) VALUES ($1, $2, $3) RETURNING id',
                ['Zambia', 'ZAM', TENANT_CODE]
            );
            const regionId = regionRes.rows[0].id;

            const provinceMap = new Map(); // name -> id
            const districtMap = new Map(); // provinceName:districtName -> id

            let importedCount = 0;

            for (const rawRow of rows) {
                if (!rawRow[0]) continue;
                
                // Split the single string if it's formatted that way
                const columns = rawRow[0].split(',');
                if (columns.length < 10) continue; // Basic validation

                const [
                    provinceName, districtName, name, hmisCode, dhis2Uid, 
                    smartcareGuid, elmisId, ihrisId, location, ownership, 
                    facilityType, longitude, latitude, popHeadCount, popCso, status
                ] = columns;

                // 4. Handle Province
                let pId;
                if (!provinceMap.has(provinceName)) {
                    const existingProv = await client.query(
                        'SELECT id FROM provinces WHERE name = $1 AND tenant_code = $2',
                        [provinceName, TENANT_CODE]
                    );

                    if (existingProv.rows.length > 0) {
                        pId = existingProv.rows[0].id;
                    } else {
                        const provCode = `${provinceName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
                        const pRes = await client.query(
                            'INSERT INTO provinces (name, code, region_id, tenant_code) VALUES ($1, $2, $3, $4) RETURNING id',
                            [provinceName, provCode, regionId, TENANT_CODE]
                        );
                        pId = pRes.rows[0].id;
                    }
                    provinceMap.set(provinceName, pId);
                } else {
                    pId = provinceMap.get(provinceName);
                }

                // 5. Handle District
                let dId;
                const districtKey = `${provinceName}:${districtName}`;
                if (!districtMap.has(districtKey)) {
                    // Try to find if it exists (for robustness)
                    const existingDist = await client.query(
                        'SELECT id FROM districts WHERE name = $1 AND province_id = $2 AND tenant_code = $3',
                        [districtName, pId, TENANT_CODE]
                    );

                    if (existingDist.rows.length > 0) {
                        dId = existingDist.rows[0].id;
                    } else {
                        // Create new with a more unique code
                        const distCode = `${districtName.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
                        const dRes = await client.query(
                            'INSERT INTO districts (name, code, province_id, tenant_code) VALUES ($1, $2, $3, $4) RETURNING id',
                            [districtName, distCode, pId, TENANT_CODE]
                        );
                        dId = dRes.rows[0].id;
                    }
                    districtMap.set(districtKey, dId);
                } else {
                    dId = districtMap.get(districtKey);
                }

                // 6. Handle Facility
                const lat = parseFloat(latitude);
                const lng = parseFloat(longitude);
                let geom = null;
                if (!isNaN(lat) && !isNaN(lng)) {
                    geom = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
                }

                const facRes = await client.query(`
                    INSERT INTO facilities (
                        name, code, type, operational_status, ownership, 
                        latitude, longitude, district_id, tenant_code, workflow_status, geom
                    ) VALUES (
                        $1, $2, $3, $4, $5, 
                        $6, $7, $8, $9, 'APPROVED', ${geom ? geom : 'NULL'}
                    ) RETURNING id
                `, [
                    name, hmisCode || `ZAM-${Math.random().toString(36).substr(2, 9)}`, 
                    facilityType, status || 'Operational', ownership,
                    lat || null, lng || null, dId, TENANT_CODE
                ]);

                const facilityId = facRes.rows[0].id;

                // 7. Handle Identifiers
                if (dhis2Uid) {
                    await client.query(
                        'INSERT INTO facility_identifiers (facility_id, system_name, identifier, tenant_code) VALUES ($1, $2, $3, $4)',
                        [facilityId, 'DHIS2', dhis2Uid, TENANT_CODE]
                    );
                }
                if (smartcareGuid) {
                    await client.query(
                        'INSERT INTO facility_identifiers (facility_id, system_name, identifier, tenant_code) VALUES ($1, $2, $3, $4)',
                        [facilityId, 'SmartCare', smartcareGuid, TENANT_CODE]
                    );
                }

                importedCount++;
                if (importedCount % 100 === 0) console.log(`✅ Processed ${importedCount} facilities...`);
            }

            await client.query('COMMIT');
            console.log(`\n✨ Import complete!`);
            console.log(`✅ Successfully imported: ${importedCount} facilities.`);
            console.log(`🗺️ Provinces: ${provinceMap.size}, Districts: ${districtMap.size}`);

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('💥 Fatal error:', err);
    } finally {
        process.exit(0);
    }
}

importZambiaData();

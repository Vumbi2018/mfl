const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../db');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../../zambia.csv');
const TENANT_CODE = 'zambia';

async function importZambiaData() {
    console.log('🚀 Starting Zambia data import...');
    
    // 1. Ensure tenant exists
    await pool.query(
        'INSERT INTO tenants (name, code) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
        ['Zambia', TENANT_CODE]
    );

    const facilities = [];

    fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
            facilities.push(row);
        })
        .on('end', async () => {
            console.log(`📄 Parsed ${facilities.length} rows from CSV.`);
            
            let importedCount = 0;
            let errorCount = 0;

            for (const row of facilities) {
                try {
                    // Map CSV fields to DB columns
                    const name = row.name || 'Unknown Facility';
                    const code = row.uuid || row.osm_id || `ZAM-${Math.random().toString(36).substr(2, 9)}`;
                    const type = row.amenity || row.healthcare || 'Clinic';
                    const operational_status = row.operational_status || 'Unknown';
                    const ownership = row.operator_type || row.operator || 'Unknown';
                    const latitude = parseFloat(row.Y);
                    const longitude = parseFloat(row.X);
                    const total_beds = parseInt(row.beds) || 0;
                    const doctors = parseInt(row.staff_doctors) || 0;
                    const nurses = parseInt(row.staff_nurses) || 0;
                    const street_address = row.addr_street || '';
                    const city = row.addr_city || '';
                    const website = row.url || '';

                    // Geometry point
                    let geom = null;
                    if (!isNaN(latitude) && !isNaN(longitude)) {
                        geom = `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
                    }

                    const query = `
                        INSERT INTO facilities (
                            name, code, type, operational_status, ownership, 
                            latitude, longitude, total_beds, doctors, nurses,
                            street_address, city, website, tenant_code, workflow_status, geom
                        ) VALUES (
                            $1, $2, $3, $4, $5, 
                            $6, $7, $8, $9, $10, 
                            $11, $12, $13, $14, 'APPROVED', ${geom ? geom : 'NULL'}
                        ) ON CONFLICT (tenant_code, code) DO UPDATE SET
                            name = EXCLUDED.name,
                            operational_status = EXCLUDED.operational_status,
                            updated_at = NOW()
                    `;

                    await pool.query(query, [
                        name, code, type, operational_status, ownership,
                        latitude || null, longitude || null, total_beds, doctors, nurses,
                        street_address, city, website, TENANT_CODE
                    ]);

                    importedCount++;
                    if (importedCount % 100 === 0) console.log(`✅ Imported ${importedCount} facilities...`);
                } catch (err) {
                    errorCount++;
                    console.error(`❌ Error importing facility ${row.name}:`, err.message);
                }
            }

            console.log(`\n✨ Import complete!`);
            console.log(`✅ Successfully imported: ${importedCount}`);
            console.log(`❌ Errors: ${errorCount}`);
            process.exit(0);
        });
}

importZambiaData().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});

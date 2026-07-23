const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

const ADM1_PATH = path.join(__dirname, '../data/zambia_adm1.geojson');
const ADM2_PATH = path.join(__dirname, '../data/zambia_adm2.geojson');
const EXCEL_PATH = path.join(__dirname, '../../Zambian Health Facilities.xlsx');
const TENANT_CODE = 'zambia';

async function seedZambia() {
    const client = await pool.connect();
    try {
        console.log('Starting Zambia Data Seeding...');
        await client.query('BEGIN');

        // 1. Create Root Region
        console.log('Creating Root Region "Zambia"...');
        let regionId;
        const regionRes = await client.query(
            `INSERT INTO regions (name, code, tenant_code) VALUES ('Zambia', 'ZMB', $1) 
             ON CONFLICT (tenant_code, code) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
            [TENANT_CODE]
        );
        regionId = regionRes.rows[0].id;

        // 2. Seed Provinces (ADM1)
        console.log('Seeding Provinces (ADM1)...');
        const adm1Data = JSON.parse(fs.readFileSync(ADM1_PATH, 'utf8'));
        const provincesMap = new Map(); // shapeName -> id

        for (const feature of adm1Data.features) {
            const name = feature.properties.shapeName;
            const geom = JSON.stringify(feature.geometry);

            const res = await client.query(
                `INSERT INTO provinces (name, tenant_code, region_id, geom) 
                 VALUES ($1, $2, $3, ST_Multi(ST_GeomFromGeoJSON($4))) 
                 ON CONFLICT (tenant_code, name) DO UPDATE SET geom = EXCLUDED.geom 
                 RETURNING id`,
                [name, TENANT_CODE, regionId, geom]
            );
            provincesMap.set(name, res.rows[0].id);
        }
        console.log(`Inserted ${provincesMap.size} provinces.`);

        // 3. Seed Districts (ADM2)
        console.log('Seeding Districts (ADM2)...');
        const adm2Data = JSON.parse(fs.readFileSync(ADM2_PATH, 'utf8'));
        const districtsMap = new Map(); // shapeName -> id

        for (const feature of adm2Data.features) {
            let name = feature.properties.shapeName;
            const geom = JSON.stringify(feature.geometry);

            // Find matching province via spatial join (ST_Intersects with centroid)
            const provinceRes = await client.query(
                `SELECT id, name FROM provinces 
                 WHERE tenant_code = $1 AND ST_Intersects(geom, ST_Centroid(ST_GeomFromGeoJSON($2))) 
                 LIMIT 1`,
                [TENANT_CODE, geom]
            );

            let provinceId = null;
            if (provinceRes.rows.length > 0) {
                provinceId = provinceRes.rows[0].id;
            } else {
                console.warn(`Could not find province for district: ${name}`);
                continue;
            }

            const res = await client.query(
                `INSERT INTO districts (name, tenant_code, province_id, geom) 
                 VALUES ($1, $2, $3, ST_Multi(ST_GeomFromGeoJSON($4))) 
                 ON CONFLICT (tenant_code, name, province_id) DO UPDATE SET geom = EXCLUDED.geom 
                 RETURNING id`,
                [name, TENANT_CODE, provinceId, geom]
            );
            districtsMap.set(name.toLowerCase(), res.rows[0].id);
        }
        console.log(`Inserted ${districtsMap.size} districts.`);

        // 4. Seed Facilities from Excel
        console.log('Seeding Facilities...');
        const wb = xlsx.readFile(EXCEL_PATH);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        let facilityCount = 0;

        for (const row of data) {
            // Because the CSV data was placed into the first column of the Excel file, 
            // the object keys might be one single long string separated by commas.
            const keys = Object.keys(row);
            let rowData = {};
            
            if (keys.length === 1 && keys[0].includes(',')) {
                const headerParts = keys[0].split(',');
                const valueParts = row[keys[0]].split(',');
                for (let i = 0; i < headerParts.length; i++) {
                    rowData[headerParts[i]] = valueParts[i];
                }
            } else {
                rowData = row;
            }

            const name = rowData.name;
            const code = rowData.HMIS_code || rowData.eLMIS_ID || null;
            const type = rowData.facility_type;
            const status = rowData.operation_status;
            const ownership = rowData.ownership;
            const lat = parseFloat(rowData.latitude);
            const lng = parseFloat(rowData.longitude);
            const districtName = rowData.district;

            if (!name) continue;

            let districtId = null;
            if (districtName) {
                districtId = districtsMap.get(districtName.toLowerCase());
            }

            let geomSql = 'NULL';
            if (!isNaN(lat) && !isNaN(lng)) {
                geomSql = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
            }

            const query = `
                INSERT INTO facilities (
                    name, code, type, operational_status, district_id, ownership,
                    latitude, longitude, geom, tenant_code, workflow_status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${geomSql}, $9, 'APPROVED') 
                ON CONFLICT (tenant_code, code) DO UPDATE SET
                    name = EXCLUDED.name,
                    type = EXCLUDED.type,
                    operational_status = EXCLUDED.operational_status,
                    ownership = EXCLUDED.ownership,
                    district_id = EXCLUDED.district_id,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    geom = EXCLUDED.geom
                RETURNING id;
            `;

            // If code is null, conflict resolution via unique constraint fails. 
            // But we will insert anyway if there's no conflict. Let's just catch errors.
            try {
                if (!code) {
                    await client.query(`
                        INSERT INTO facilities (
                            name, code, type, operational_status, district_id, ownership,
                            latitude, longitude, geom, tenant_code, workflow_status
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${geomSql}, $9, 'APPROVED')
                    `, [name, null, type, status, districtId, ownership, lat, lng, TENANT_CODE]);
                } else {
                    await client.query(query, [name, code, type, status, districtId, ownership, lat, lng, TENANT_CODE]);
                }
                facilityCount++;
            } catch (err) {
                console.error(`Failed to insert facility ${name}:`, err.message);
            }
        }

        console.log(`Inserted ${facilityCount} facilities.`);
        await client.query('COMMIT');
        console.log('Seeding completed successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding data:', error);
    } finally {
        client.release();
        pool.end();
    }
}

seedZambia();

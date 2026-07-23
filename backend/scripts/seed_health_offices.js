const fs = require('fs');
const path = require('path');
const pool = require('../db');


async function runSeed() {
    console.log("Starting Health Offices seed...");

    const csvPath = path.join(__dirname, '../../zambia_provincial_and_district_health_offices_gps.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("CSV file not found at:", csvPath);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    console.log(`Processing ${lines.length - 1} records from CSV...`);

    // Basic CSV Parser handling quoted fields
    function parseCSVLine(line) {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur.trim());
        return result.map(v => v.replace(/^"|"$/g, ''));
    }

    const offices = [];

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < 7) continue;

        const officeLevel = row[0]; // Provincial or District
        const province = row[1];
        const district = row[2];
        const officeName = row[3];
        const adminCentre = row[4];
        const lat = parseFloat(row[5]);
        const lng = parseFloat(row[6]);
        const gpsCoord = row[7] || `${lat}, ${lng}`;
        const gmapsUrl = row[8] || '';
        const crs = row[9] || '';
        const pointType = row[10] || '';
        const verification = row[11] || '';
        const isProxy = row[12] === 'Yes';
        const address = row[13] || '';
        const notes = row[14] || '';
        const sourceUrl = row[15] || '';

        if (isNaN(lat) || isNaN(lng)) continue;

        const isProvincialHQ = officeLevel.toLowerCase() === 'provincial';
        const isDistrictHQ = officeLevel.toLowerCase() === 'district';

        offices.push({
            id: i,
            office_level: officeLevel,
            province,
            district,
            office_name: officeName,
            administrative_centre: adminCentre,
            latitude: lat,
            longitude: lng,
            gps_coordinate: gpsCoord,
            google_maps_url: gmapsUrl,
            crs,
            point_type: pointType,
            verification,
            is_proxy: isProxy,
            address,
            notes,
            source_url: sourceUrl,
            is_provincial_hq: isProvincialHQ,
            is_district_hq: isDistrictHQ
        });
    }

    console.log(`Parsed ${offices.length} health offices successfully.`);
    const provCount = offices.filter(c => c.is_provincial_hq).length;
    const distCount = offices.filter(c => c.is_district_hq).length;
    console.log(`Identified ${provCount} Provincial Health Offices and ${distCount} District Health Offices.`);

    // 1. Write static JSON bundle to src/data/zambia_health_offices.json
    const jsonPath = path.join(__dirname, '../../src/data/zambia_health_offices.json');
    const jsonDir = path.dirname(jsonPath);
    if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(offices, null, 2));
    console.log("Saved JSON dataset to:", jsonPath);

    // 2. Create PostgreSQL table & upsert records
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS health_offices (
                id SERIAL PRIMARY KEY,
                office_level VARCHAR(50),
                province VARCHAR(100) NOT NULL,
                district VARCHAR(100),
                office_name VARCHAR(255),
                administrative_centre VARCHAR(150),
                latitude NUMERIC(10, 6) NOT NULL,
                longitude NUMERIC(10, 6) NOT NULL,
                gps_coordinate VARCHAR(100),
                google_maps_url TEXT,
                crs VARCHAR(50),
                point_type VARCHAR(100),
                verification TEXT,
                is_proxy BOOLEAN DEFAULT FALSE,
                address TEXT,
                notes TEXT,
                source_url TEXT,
                is_provincial_hq BOOLEAN DEFAULT FALSE,
                is_district_hq BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_office_name UNIQUE (office_name)
            );
        `);
        console.log("Table 'health_offices' created or already exists.");

        for (const office of offices) {
            await pool.query(`
                INSERT INTO health_offices 
                (office_level, province, district, office_name, administrative_centre, latitude, longitude, gps_coordinate, google_maps_url, crs, point_type, verification, is_proxy, address, notes, source_url, is_provincial_hq, is_district_hq)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                ON CONFLICT (office_name) DO UPDATE SET
                    office_level = EXCLUDED.office_level,
                    province = EXCLUDED.province,
                    district = EXCLUDED.district,
                    administrative_centre = EXCLUDED.administrative_centre,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    gps_coordinate = EXCLUDED.gps_coordinate,
                    google_maps_url = EXCLUDED.google_maps_url,
                    crs = EXCLUDED.crs,
                    point_type = EXCLUDED.point_type,
                    verification = EXCLUDED.verification,
                    is_proxy = EXCLUDED.is_proxy,
                    address = EXCLUDED.address,
                    notes = EXCLUDED.notes,
                    source_url = EXCLUDED.source_url,
                    is_provincial_hq = EXCLUDED.is_provincial_hq,
                    is_district_hq = EXCLUDED.is_district_hq,
                    updated_at = CURRENT_TIMESTAMP;
            `, [
                office.office_level, office.province, office.district, office.office_name, office.administrative_centre, office.latitude, office.longitude,
                office.gps_coordinate, office.google_maps_url, office.crs, office.point_type, office.verification, office.is_proxy, office.address,
                office.notes, office.source_url, office.is_provincial_hq, office.is_district_hq
            ]);
        }
        console.log("Successfully seeded database table 'health_offices'!");
    } catch (err) {
        console.error("Database seed warning:", err.message);
    } finally {
        process.exit(0);
    }
}

runSeed();

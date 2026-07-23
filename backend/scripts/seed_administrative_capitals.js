const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const PROVINCIAL_CAPITALS = {
    'Central': 'Kabwe',
    'Copperbelt': 'Ndola',
    'Eastern': 'Chipata',
    'Luapula': 'Mansa',
    'Lusaka': 'Lusaka',
    'Muchinga': 'Chinsali',
    'Northern': 'Kasama',
    'North-Western': 'Solwezi',
    'Southern': 'Choma',
    'Western': 'Mongu'
};

async function runSeed() {
    console.log("Starting Administrative Capitals seed...");

    const csvPath = path.join(__dirname, '../../zambia_district_capitals_coordinates.csv');
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

    const capitals = [];

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < 5) continue;

        const province = row[0];
        const district = row[1];
        const adminCentre = row[2];
        const lat = parseFloat(row[3]);
        const lng = parseFloat(row[4]);
        const gpsCoord = row[5] || `${lat}, ${lng}`;
        const gmapsUrl = row[6] || '';
        const crs = row[7] || 'WGS 84 / EPSG:4326';
        const pointType = row[8] || 'District reference centroid';
        const verification = row[9] || '';
        const notes = row[10] || '';
        const sourceUrl = row[11] || '';

        if (isNaN(lat) || isNaN(lng)) continue;

        const provCap = PROVINCIAL_CAPITALS[province];
        const isProvincialHQ = provCap && (district.toLowerCase() === provCap.toLowerCase() || adminCentre.toLowerCase() === provCap.toLowerCase());

        capitals.push({
            id: i,
            province,
            district,
            administrative_centre: adminCentre,
            latitude: lat,
            longitude: lng,
            gps_coordinate: gpsCoord,
            google_maps_url: gmapsUrl,
            crs,
            point_type: pointType,
            verification,
            notes,
            source_url: sourceUrl,
            is_provincial_hq: !!isProvincialHQ,
            is_district_hq: true
        });
    }

    console.log(`Parsed ${capitals.length} administrative capitals successfully.`);
    const provCount = capitals.filter(c => c.is_provincial_hq).length;
    console.log(`Identified ${provCount} Provincial Headquarters and ${capitals.length} District Headquarters.`);

    // 1. Write static JSON bundle to src/data/zambia_administrative_capitals.json
    const jsonPath = path.join(__dirname, '../../src/data/zambia_administrative_capitals.json');
    const jsonDir = path.dirname(jsonPath);
    if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(capitals, null, 2));
    console.log("Saved JSON dataset to:", jsonPath);

    // 2. Create PostgreSQL table & upsert records
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS administrative_capitals (
                id SERIAL PRIMARY KEY,
                province VARCHAR(100) NOT NULL,
                district VARCHAR(100) NOT NULL,
                administrative_centre VARCHAR(150),
                latitude NUMERIC(10, 6) NOT NULL,
                longitude NUMERIC(10, 6) NOT NULL,
                gps_coordinate VARCHAR(100),
                google_maps_url TEXT,
                crs VARCHAR(50),
                point_type VARCHAR(100),
                verification TEXT,
                notes TEXT,
                source_url TEXT,
                is_provincial_hq BOOLEAN DEFAULT FALSE,
                is_district_hq BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_province_district UNIQUE (province, district)
            );
        `);
        console.log("Table 'administrative_capitals' created or already exists.");

        for (const cap of capitals) {
            await pool.query(`
                INSERT INTO administrative_capitals 
                (province, district, administrative_centre, latitude, longitude, gps_coordinate, google_maps_url, crs, point_type, verification, notes, source_url, is_provincial_hq, is_district_hq)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (province, district) DO UPDATE SET
                    administrative_centre = EXCLUDED.administrative_centre,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    gps_coordinate = EXCLUDED.gps_coordinate,
                    google_maps_url = EXCLUDED.google_maps_url,
                    point_type = EXCLUDED.point_type,
                    verification = EXCLUDED.verification,
                    notes = EXCLUDED.notes,
                    source_url = EXCLUDED.source_url,
                    is_provincial_hq = EXCLUDED.is_provincial_hq,
                    is_district_hq = EXCLUDED.is_district_hq,
                    updated_at = CURRENT_TIMESTAMP;
            `, [
                cap.province, cap.district, cap.administrative_centre, cap.latitude, cap.longitude,
                cap.gps_coordinate, cap.google_maps_url, cap.crs, cap.point_type, cap.verification,
                cap.notes, cap.source_url, cap.is_provincial_hq, cap.is_district_hq
            ]);
        }
        console.log("Successfully seeded database table 'administrative_capitals'!");
    } catch (err) {
        console.error("Database seed warning:", err.message);
    } finally {
        process.exit(0);
    }
}

runSeed();

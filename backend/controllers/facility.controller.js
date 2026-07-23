// ORIGINAL CODE COMMENTED OUT TO PRESERVE COMPATIBILITY
// const { Pool } = require('pg');
// const dotenv = require('dotenv');
// 
// dotenv.config();
// 
// const pool = new Pool({
//     user: process.env.DB_USER || 'postgres',
//     host: process.env.DB_HOST || 'localhost',
//     database: process.env.DB_NAME || 'mfl_db',
//     password: process.env.DB_PASSWORD || 'password',
//     port: process.env.DB_PORT || 5432,
// });

// REPLACEMENT: Use standardized central pool configuration to support production environment settings
const pool = require('../db');

const { getScopeFilters } = require('../middleware/rbac.middleware');
const AuditService = require('../services/audit.service');
const NotificationService = require('../services/notification.service');
const { appendTenantFilter } = require('../utils/tenant');

exports.getFacilities = async (req, res) => {
    try {
        const { page = 1, limit = 100, status, type, region_id, province_id, district_id, search, sortBy = 'id', sortOrder = 'ASC' } = req.query;
        const offset = (page - 1) * limit;

        // RBAC Scoping
        let userScope = { isNational: true }; // Default open for now if no auth
        if (req.user) {
            userScope = await getScopeFilters(req.user.id);
        }

        console.log('GET /facilities query:', req.query, 'Scope:', userScope);

        // Build query conditions
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        // Apply Tenant Filter (MANDATORY)
        paramIndex = appendTenantFilter(conditions, params, req.tenantCode, 'f');

        // Apply Mandatory Scope Filters (Multi-Location)
        if (userScope && !userScope.isNational) {
            const scopeConditions = [];

            // If user has access to specific regions, they see everything in those regions
            if (userScope.regions && userScope.regions.length > 0) {
                scopeConditions.push(`r.id = ANY($${paramIndex}::int[])`);
                params.push(userScope.regions);
                paramIndex++;
            }

            // If user has access to specific provinces
            if (userScope.provinces && userScope.provinces.length > 0) {
                scopeConditions.push(`p.id = ANY($${paramIndex}::int[])`);
                params.push(userScope.provinces);
                paramIndex++;
            }

            // If user has access to specific districts
            if (userScope.districts && userScope.districts.length > 0) {
                scopeConditions.push(`d.id = ANY($${paramIndex}::int[])`);
                params.push(userScope.districts);
                paramIndex++;
            }

            if (scopeConditions.length > 0) {
                conditions.push(`(${scopeConditions.join(' OR ')})`);
            } else {
                conditions.push('1=0'); // Force empty result
            }
        }

        if (status && status !== 'all') {
            conditions.push(`f.operational_status ILIKE $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (type && type !== 'all') {
            conditions.push(`f.type ILIKE $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }

        if (region_id && region_id !== 'all') {
            conditions.push(`r.id = $${paramIndex}`);
            params.push(parseInt(region_id));
            paramIndex++;
        }

        if (province_id && province_id !== 'all') {
            conditions.push(`p.id = $${paramIndex}`);
            params.push(parseInt(province_id));
            paramIndex++;
        }

        if (district_id && district_id !== 'all') {
            conditions.push(`d.id = $${paramIndex}`);
            params.push(parseInt(district_id));
            paramIndex++;
        }

        if (search) {
            conditions.push(`(f.name ILIKE $${paramIndex} OR f.code ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Safe sorting
        const allowedSorts = {
            'id': 'f.id',
            'name': 'f.name',
            'code': 'f.code',
            'type': 'f.type',
            'status': 'f.operational_status',
            'ownership': 'f.ownership',
            'date_established': 'f.date_established',
            'district': 'd.name',
            'province': 'p.name',
            'region': 'r.name',
            'facility name': 'f.name',
            'date opened': 'f.date_established',
            'facility code': 'f.code'
        };
        const sortColumn = allowedSorts[sortBy.toLowerCase()] || 'f.id';
        const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Query for data
        const dataQuery = `
            SELECT f.*, 
                   d.name as district, d.province_id as province_id,
                   p.name as province, p.region_id as region_id,
                   r.name as region 
            FROM facilities f
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            ${whereClause}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        // Query for total count (for pagination)
        const countQuery = `
            SELECT COUNT(*) 
            FROM facilities f
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            ${whereClause}
        `;

        const result = await pool.query(dataQuery, [...params, limit, offset]);
        const countResult = await pool.query(countQuery, params);

        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: result.rows,
            pagination: {
                total: totalItems,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: totalPages
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching facilities");
    }
};

exports.createFacility = async (req, res) => {
    try {
        const data = req.body;

        if (!data.name && !data.facilityName && !data.common_name) {
            return res.status(400).send("Facility Name is required.");
        }

        const allowedColumns = [
            'name', 'code', 'type', 'operational_status', 'ownership', 'date_established',
            'registration_number', 'license_number', 'description', 'street_address',
            'postal_code', 'city', 'latitude', 'longitude', 'elevation', 'accuracy',
            'district_id', 'total_beds', 'icu_beds', 'emergency_beds', 'operating_theaters',
            'outpatient_rooms', 'consultation_rooms', 'weekday_hours', 'weekend_hours',
            'emergency_contact', 'general_contact', 'contact_email', 'website',
            'doctors', 'nurses', 'specialists', 'technicians', 'pharmacists', 'admin_staff',
            'ct_scanners', 'mri_machines', 'xray_machines', 'ultrasound_machines',
            'ventilators', 'dialysis_machines', 'basic_ambulances', 'advanced_ambulances',
            'air_ambulances', 'equipment_notes', 'services', 'staff_counts', 'equipment_counts', 'boundary_polygon'
        ];

        if (data.facilityName) data.name = data.facilityName;
        if (data.facilityType) data.type = data.facilityType;
        if (data.common_name) data.name = data.common_name;
        if (data.facility_type) data.type = data.facility_type;
        if (data.facility_status) data.operational_status = data.facility_status;
        if (!data.operational_status) data.operational_status = 'Pending';

        // Auto-generate Code: PP-DD-XXX (Province-District-Sequence)
        if (!data.code) {
            if (data.district_id) {
                try {
                    // Fetch Province ID and current count for this district
                    const metaRes = await pool.query(
                        `SELECT d.province_id, (SELECT COUNT(*) FROM facilities WHERE district_id = $1) as count 
                         FROM districts d WHERE d.id = $1`,
                        [data.district_id]
                    );

                    if (metaRes.rows.length > 0) {
                        const { province_id, count } = metaRes.rows[0];
                        const seq = parseInt(count) + 1;
                        const pp = String(province_id).padStart(2, '0');
                        const dd = String(data.district_id).padStart(2, '0');
                        const xxx = String(seq).padStart(3, '0');

                        // Calculate Check Digit (Modulo 10 with weights 1,3)
                        const numStr = `${pp}${dd}${xxx}`;
                        let sum = 0;
                        for (let i = 0; i < numStr.length; i++) {
                            sum += parseInt(numStr[i]) * ((i % 2 === 0) ? 1 : 3);
                        }
                        const checkDigit = (10 - (sum % 10)) % 10;

                        data.code = `${pp}-${dd}-${xxx}-${checkDigit}`;
                    } else {
                        data.code = 'FAC-' + Math.floor(Math.random() * 100000); // Fallback for bad district_id
                    }
                } catch (codeErr) {
                    console.error("Error generating code:", codeErr);
                    data.code = 'FAC-' + Math.floor(Math.random() * 100000);
                }
            } else {
                data.code = 'FAC-' + Math.floor(Math.random() * 100000);
            }
        }

        const columns = [];
        const values = [];
        const placeholders = [];
        let paramIndex = 1;

        Object.keys(data).forEach(key => {
            if (allowedColumns.includes(key)) {
                if (key === 'boundary_polygon') {
                    if (data[key]) {
                        const coords = data[key].map(p => [p[1], p[0]]);
                        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
                            coords.push(coords[0]);
                        }
                        const geoJson = { type: "Polygon", coordinates: [coords] };
                        columns.push('geom');
                        values.push(JSON.stringify(geoJson));
                        placeholders.push(`ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`);
                        paramIndex++;
                    }
                    return;
                }

                columns.push(key);
                let val = data[key];
                // Fix: Stringify JSONB columns (especially Arrays like services) to prevent PG Array format
                if (['services', 'staff_counts', 'equipment_counts'].includes(key) && typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                values.push(val);
                placeholders.push(`$${paramIndex}`);
                paramIndex++;
            }
        });

        columns.push('workflow_status');
        values.push('PENDING_REVIEW');
        placeholders.push(`$${paramIndex}`);
        paramIndex++;

        columns.push('tenant_code');
        values.push(req.tenantCode);
        placeholders.push(`$${paramIndex}`);
        paramIndex++;

        const query = `
            INSERT INTO facilities (${columns.join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING *
        `;

        const result = await pool.query(query, values);

        // Audit Creation
        await AuditService.log({
            userId: req.user ? req.user.id : null,
            action: 'CREATE',
            entityType: 'FACILITIES',
            entityId: result.rows[0].id,
            details: { name: result.rows[0].name, code: result.rows[0].code },
            req
        });

        // NOTIFICATION: Notify Admins of new facility
        // TODO: Replace with dynamic list of admins
        NotificationService.notifyFacilityCreated(
            result.rows[0].name,
            result.rows[0].id,
            req.user ? req.user.username : 'Unknown User',
            'admin@mfl.gov.pg'
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating facility:", err);
        res.status(500).send("Error creating facility");
    }
};

exports.getFacilityById = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query(`
             SELECT f.*, 
                    ST_AsGeoJSON(f.geom) as boundary_geojson,
                    d.name as district, d.province_id as province_id,
                    p.name as province, p.region_id as region_id,
                    r.name as region 
            FROM facilities f
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            WHERE f.id = $1 AND f.tenant_code = $2
        `, [id, req.tenantCode]);

        if (result.rows.length === 0) {
            return res.status(404).send("Facility not found");
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching facility");
    }
};

exports.updateFacility = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const oldRes = await pool.query('SELECT * FROM facilities WHERE id = $1', [id]);
        if (oldRes.rows.length === 0) return res.status(404).send("Facility not found");
        const oldData = oldRes.rows[0];

        const allowedColumns = [
            'name', 'code', 'type', 'operational_status', 'ownership', 'date_established',
            'registration_number', 'license_number', 'description', 'street_address',
            'postal_code', 'city', 'latitude', 'longitude', 'elevation', 'accuracy',
            'district_id', 'total_beds', 'icu_beds', 'emergency_beds', 'operating_theaters',
            'outpatient_rooms', 'consultation_rooms', 'weekday_hours', 'weekend_hours',
            'emergency_contact', 'general_contact', 'contact_email', 'website',
            'doctors', 'nurses', 'specialists', 'technicians', 'pharmacists', 'admin_staff',
            'ct_scanners', 'mri_machines', 'xray_machines', 'ultrasound_machines',
            'ventilators', 'dialysis_machines', 'basic_ambulances', 'advanced_ambulances',
            'air_ambulances', 'equipment_notes', 'services', 'staff_counts', 'equipment_counts',
            'workflow_status', 'boundary_polygon'
        ];

        const setClause = [];
        const values = [];
        let paramIndex = 1;
        const changes = {};

        Object.keys(updates).forEach(key => {
            if (allowedColumns.includes(key)) {
                if (key === 'boundary_polygon') {
                    if (updates[key]) {
                        // Assume boundary_polygon is array of [lat, lng]
                        // GeoJSON Polygon needs array of [lng, lat] and first point == last point
                        const coords = updates[key].map(p => [p[1], p[0]]);
                        if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
                            coords.push(coords[0]);
                        }
                        const geoJson = { type: "Polygon", coordinates: [coords] };
                        setClause.push(`geom = ST_SetSRID(ST_GeomFromGeoJSON($${paramIndex}), 4326)`);
                        values.push(JSON.stringify(geoJson));
                        paramIndex++;
                    } else {
                        setClause.push(`geom = NULL`);
                    }
                    return;
                }

                setClause.push(`${key} = $${paramIndex}`);

                let val = updates[key];
                // Fix: Stringify JSONB columns (especially Arrays like services) to prevent PG Array format {a,b}
                if (['services', 'staff_counts', 'equipment_counts'].includes(key) && typeof val === 'object') {
                    val = JSON.stringify(val);
                }

                values.push(val);
                paramIndex++;

                if (JSON.stringify(updates[key]) != JSON.stringify(oldData[key])) {
                    changes[key] = { from: oldData[key], to: updates[key] };
                }
            }
        });

        if (setClause.length === 0) {
            return res.status(400).send("No valid fields to update");
        }

        values.push(id);
        const query = `
            UPDATE facilities 
            SET ${setClause.join(', ')}, updated_at = NOW() 
            WHERE id = $${paramIndex} 
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).send("Facility not found");
        }

        if (Object.keys(changes).length > 0) {
            await AuditService.log({
                userId: req.user ? req.user.id : null,
                action: 'UPDATE',
                entityType: 'FACILITIES',
                entityId: id,
                changes: changes,
                details: { facilityName: oldData.name, code: oldData.code },
                req
            });

            // NOTIFICATION: Status Change
            if (changes['operational_status']) {
                NotificationService.notifyFacilityStatusChange(
                    oldData.name,
                    id,
                    changes['operational_status'].from,
                    changes['operational_status'].to,
                    'admin@mfl.gov.pg' // TODO: Notify relevant stakeholders
                );
            }
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Error updating facility:", err);
        res.status(500).send("Error updating facility");
    }
};

exports.getFacilities = async (req, res) => {
    try {
        const { page = 1, limit = 100, status, type, region_id, province_id, district_id, ward_id, search, sortBy = 'id', sortOrder = 'ASC' } = req.query;
        const offset = (page - 1) * limit;

        // RBAC Scoping
        let userScope = { isNational: true }; // Default open for now if no auth
        if (req.user) {
            userScope = await getScopeFilters(req.user.id);
        }

        console.log('GET /facilities query:', req.query, 'Scope:', userScope);

        // Build query conditions
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        // Apply Tenant Filter (MANDATORY)
        paramIndex = appendTenantFilter(conditions, params, req.tenantCode, 'f');

        // Apply Mandatory Scope Filters (Multi-Location)
        if (userScope && !userScope.isNational) {
            const scopeConditions = [];

            // If user has access to specific regions, they see everything in those regions
            if (userScope.regions && userScope.regions.length > 0) {
                scopeConditions.push(`r.id = ANY($${paramIndex}::int[])`);
                params.push(userScope.regions);
                paramIndex++;
            }

            // If user has access to specific provinces
            if (userScope.provinces && userScope.provinces.length > 0) {
                scopeConditions.push(`p.id = ANY($${paramIndex}::int[])`);
                params.push(userScope.provinces);
                paramIndex++;
            }

            // If user has access to specific districts
            if (userScope.districts && userScope.districts.length > 0) {
                scopeConditions.push(`d.id = ANY($${paramIndex}::int[])`);
                params.push(userScope.districts);
                paramIndex++;
            }

            if (scopeConditions.length > 0) {
                conditions.push(`(${scopeConditions.join(' OR ')})`);
            } else {
                conditions.push('1=0'); // Force empty result
            }
        }

        if (status && status !== 'all') {
            conditions.push(`f.operational_status ILIKE $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        if (type && type !== 'all') {
            conditions.push(`f.type ILIKE $${paramIndex}`);
            params.push(type);
            paramIndex++;
        }

        if (region_id && region_id !== 'all') {
            conditions.push(`r.id = $${paramIndex}`);
            params.push(parseInt(region_id));
            paramIndex++;
        }

        if (province_id && province_id !== 'all') {
            conditions.push(`p.id = $${paramIndex}`);
            params.push(parseInt(province_id));
            paramIndex++;
        }

        if (district_id && district_id !== 'all') {
            conditions.push(`d.id = $${paramIndex}`);
            params.push(parseInt(district_id));
            paramIndex++;
        }

        if (ward_id && ward_id !== 'all') {
            conditions.push(`(f.ward_id = $${paramIndex} OR w.id = $${paramIndex})`);
            params.push(parseInt(ward_id));
            paramIndex++;
        }

        if (search) {
            conditions.push(`(f.name ILIKE $${paramIndex} OR f.code ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Safe sorting
        const allowedSorts = {
            'id': 'f.id',
            'name': 'f.name',
            'code': 'f.code',
            'type': 'f.type',
            'status': 'f.operational_status',
            'ownership': 'f.ownership',
            'date_established': 'f.date_established',
            'ward': 'w.name',
            'district': 'd.name',
            'province': 'p.name',
            'region': 'r.name',
            'facility name': 'f.name',
            'date opened': 'f.date_established',
            'facility code': 'f.code'
        };
        const sortColumn = allowedSorts[sortBy.toLowerCase()] || 'f.id';
        const sortDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Query for data
        const dataQuery = `
            SELECT f.*, 
                   w.name as ward, w.id as ward_id,
                   d.name as district, d.province_id as province_id,
                   p.name as province, p.region_id as region_id,
                   r.name as region 
            FROM facilities f
            LEFT JOIN wards w ON f.ward_id = w.id
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            ${whereClause}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        // Query for total count (for pagination)
        const countQuery = `
            SELECT COUNT(*) 
            FROM facilities f
            LEFT JOIN wards w ON f.ward_id = w.id
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            ${whereClause}
        `;

        const result = await pool.query(dataQuery, [...params, limit, offset]);
        const countResult = await pool.query(countQuery, params);

        res.status(200).json({
            data: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].count),
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
    } catch (err) {
        console.error("Error fetching facilities:", err);
        res.status(500).json({ error: "Error fetching facilities", details: err.message });
    }
};

exports.getLocations = async (req, res) => {
    try {
        if (req.tenantCode === 'zambia') {
            return exports.getLocationsNoRegion(req, res);
        }

        const query = `
            SELECT 
                r.id as region_id, r.name as region_name,
                p.id as province_id, p.name as province_name,
                d.id as district_id, d.name as district_name,
                w.id as ward_id, w.name as ward_name
            FROM regions r
            LEFT JOIN provinces p ON r.id = p.region_id
            LEFT JOIN districts d ON p.id = d.province_id
            LEFT JOIN wards w ON d.id = w.district_id
            WHERE r.tenant_code = $1 OR p.tenant_code = $1
            ORDER BY r.name, p.name, d.name, w.name
        `;

        const result = await pool.query(query, [req.tenantCode]);
        const rows = result.rows;

        const locations = [];
        const regionMap = new Map();

        rows.forEach(row => {
            if (!row.region_id) return;

            let region = regionMap.get(row.region_id);
            if (!region) {
                region = {
                    id: row.region_id,
                    name: row.region_name,
                    provinces: []
                };
                regionMap.set(row.region_id, region);
                locations.push(region);
            }

            if (row.province_id) {
                let province = region.provinces.find(p => p.id === row.province_id);
                if (!province) {
                    province = {
                        id: row.province_id,
                        name: row.province_name,
                        districts: []
                    };
                    region.provinces.push(province);
                }

                if (row.district_id) {
                    let district = province.districts.find(d => d.id === row.district_id);
                    if (!district) {
                        district = {
                            id: row.district_id,
                            name: row.district_name,
                            wards: []
                        };
                        province.districts.push(district);
                    }

                    if (row.ward_id && !district.wards.some(w => w.id === row.ward_id)) {
                        district.wards.push({
                            id: row.ward_id,
                            name: row.ward_name
                        });
                    }
                }
            }
        });

        res.status(200).json(locations);
    } catch (err) {
        console.error("Error fetching locations:", err);
        res.status(500).json({ error: "Error fetching locations", details: err.message, stack: err.stack });
    }
};

exports.getFacilityTypes = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT type FROM facilities WHERE type IS NOT NULL ORDER BY type ASC');
        res.status(200).json(result.rows.map(row => row.type));
    } catch (err) {
        console.error("Error fetching facility types:", err);
        res.status(500).send("Error fetching facility types");
    }
};

exports.getAllFacilitiesPublic = async (req, res) => {
    try {
        const query = `
      SELECT
        f.id,
        f.name,
        f.type,
        f.operational_status,
        f.workflow_status,
        f.latitude,
        f.longitude,
        f.code,
        f.ownership,
        f.created_at,
        f.updated_at,
        f.ward_id,
        w.name as ward,
        d.name as district,
        d.id as district_id,
        p.name as province,
        p.id as province_id,
        r.name as region,
        r.id as region_id
      FROM facilities f
      LEFT JOIN wards w ON f.ward_id = w.id
      LEFT JOIN districts d ON f.district_id = d.id
      LEFT JOIN provinces p ON d.province_id = p.id
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE f.tenant_code = $1
      ORDER BY f.name;
    `;
        const { rows } = await pool.query(query, [req.tenantCode]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching all facilities:', err);
        res.status(500).json({ error: 'Failed to retrieve facilities' });
    }
};

exports.getAllFacilitiesNoRegion = async (req, res) => {
    try {
        const query = `
      SELECT
        f.id,
        f.name,
        f.type,
        f.operational_status,
        f.workflow_status,
        f.latitude,
        f.longitude,
        f.code,
        f.ownership,
        f.created_at,
        f.updated_at,
        f.ward_id,
        w.name as ward,
        d.name as district,
        d.id as district_id,
        p.name as province,
        p.id as province_id
      FROM facilities f
      LEFT JOIN wards w ON f.ward_id = w.id
      LEFT JOIN districts d ON f.district_id = d.id
      LEFT JOIN provinces p ON d.province_id = p.id
      WHERE f.tenant_code = $1
      ORDER BY f.name;
    `;
        const { rows } = await pool.query(query, [req.tenantCode]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching all facilities (no region):', err);
        res.status(500).json({ error: 'Failed to retrieve facilities' });
    }
};

exports.getLocationsNoRegion = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.id as province_id, p.name as province_name,
                d.id as district_id, d.name as district_name,
                w.id as ward_id, w.name as ward_name
            FROM provinces p
            LEFT JOIN districts d ON p.id = d.province_id
            LEFT JOIN wards w ON d.id = w.district_id
            WHERE p.tenant_code = $1
            ORDER BY p.name, d.name, w.name
        `;

        const result = await pool.query(query, [req.tenantCode]);
        const rows = result.rows;

        const locations = [];
        const provinceMap = new Map();

        rows.forEach(row => {
            if (!row.province_id) return;

            let province = provinceMap.get(row.province_id);
            if (!province) {
                province = {
                    id: row.province_id,
                    name: row.province_name,
                    districts: []
                };
                provinceMap.set(row.province_id, province);
                locations.push(province);
            }

            if (row.district_id) {
                let district = province.districts.find(d => d.id === row.district_id);
                if (!district) {
                    district = {
                        id: row.district_id,
                        name: row.district_name,
                        wards: []
                    };
                    province.districts.push(district);
                }

                if (row.ward_id && !district.wards.some(w => w.id === row.ward_id)) {
                    district.wards.push({
                        id: row.ward_id,
                        name: row.ward_name
                    });
                }
            }
        });

        res.status(200).json(locations);
    } catch (err) {
        console.error("Error fetching locations (no region):", err);
        res.status(500).json({ error: "Error fetching locations", details: err.message });
    }
};

/**
 * FHIR Interoperability Endpoints
 */
const { mapFacilityToFHIR } = require('../utils/fhirTransformer');

exports.getFacilitiesFHIR = async (req, res) => {
    try {
        console.log('GET /fhir/Location');
        // Retrieve all public facilities (using the logic from getAllFacilitiesPublic for consistency)
        const query = `
             SELECT 
                f.*, 
                d.name as district, 
                p.name as province, 
                r.name as region 
             FROM facilities f
             LEFT JOIN districts d ON f.district_id = d.id
             LEFT JOIN provinces p ON d.province_id = p.id
             LEFT JOIN regions r ON p.region_id = r.id
             WHERE f.tenant_code = $1 AND (f.workflow_status = 'APPROVED' OR f.workflow_status = 'PENDING_REVIEW')
             LIMIT 500
        `;
        const { rows } = await pool.query(query, [req.tenantCode]);

        const fhirBundle = {
            resourceType: "Bundle",
            type: "searchset",
            total: rows.length,
            entry: rows.map(facility => ({
                fullUrl: `https://mfl.gov.pg/fhir/Location/${facility.id}`,
                resource: mapFacilityToFHIR(facility)
            }))
        };

        res.set('Content-Type', 'application/fhir+json');
        res.json(fhirBundle);
    } catch (err) {
        console.error("FHIR Error:", err);
        res.status(500).json({
            resourceType: "OperationOutcome",
            issue: [{
                severity: "error",
                code: "exception",
                diagnostics: err.message
            }]
        });
    }
};

exports.getFacilityFHIR = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
             SELECT 
                f.*, 
                d.name as district, 
                p.name as province, 
                r.name as region 
             FROM facilities f
             LEFT JOIN districts d ON f.district_id = d.id
             LEFT JOIN provinces p ON d.province_id = p.id
             LEFT JOIN regions r ON p.region_id = r.id
             WHERE f.id = $1 OR f.code = $2 -- Allow lookup by ID or Code
        `;
        const { rows } = await pool.query(query, [parseInt(id) || 0, id]); // Handle integer parse safety

        if (rows.length === 0) {
            return res.status(404).json({
                resourceType: "OperationOutcome",
                issue: [{
                    severity: "error",
                    code: "not-found",
                    diagnostics: `Location with ID ${id} not found`
                }]
            });
        }

        const fhirResource = mapFacilityToFHIR(rows[0]);
        res.set('Content-Type', 'application/fhir+json');
        res.json(fhirResource);

    } catch (err) {
        console.error("FHIR Single Error:", err);
        res.status(500).json({
            resourceType: "OperationOutcome",
            issue: [{
                severity: "error",
                code: "exception",
                diagnostics: err.message
            }]
        });
    }
};

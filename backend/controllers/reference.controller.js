/**
 * Reference Data Controller
 * Serves WHO-aligned reference tables for facility types, services, and verification
 */

// ORIGINAL CODE COMMENTED OUT TO PRESERVE COMPATIBILITY
// require('dotenv').config();
// const { Pool } = require('pg');
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

/**
 * GET /api/reference/facility-types
 * Returns the standardized facility type taxonomy
 */
exports.getFacilityTypes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, code, name, description, level, can_admit, typical_beds_min, typical_beds_max
            FROM facility_types
            WHERE active = true
            ORDER BY level, name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching facility types:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/reference/service-types
 * Returns the WHO-aligned service taxonomy
 */
exports.getServiceTypes = async (req, res) => {
    try {
        const { category } = req.query;
        let query = `
            SELECT id, code, category, name, description, who_service_package, requires_certification
            FROM service_types
            WHERE active = true
        `;
        const params = [];

        if (category) {
            query += ` AND category = $1`;
            params.push(category);
        }

        query += ` ORDER BY category, name`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching service types:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/reference/service-categories
 * Returns distinct service categories for filtering
 */
exports.getServiceCategories = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT category, who_service_package
            FROM service_types
            WHERE active = true
            ORDER BY category
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching service categories:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/reference/verification-methods
 * Returns valid verification method codes
 */
exports.getVerificationMethods = async (req, res) => {
    const methods = [
        { code: 'field_visit', name: 'Field Visit', description: 'Physical site inspection' },
        { code: 'phone_call', name: 'Phone Call', description: 'Telephone verification with facility staff' },
        { code: 'desk_review', name: 'Desk Review', description: 'Review of submitted documents' },
        { code: 'self_report', name: 'Self-Report', description: 'Facility-submitted verification' },
        { code: 'administrative', name: 'Administrative', description: 'Data from administrative sources' }
    ];
    res.json(methods);
};

/**
 * GET /api/reference/workflow-states
 * Returns valid workflow status codes with descriptions
 */
exports.getWorkflowStates = async (req, res) => {
    const states = [
        { code: 'DRAFT', name: 'Draft', description: 'Initial entry, not yet submitted', next: ['DISTRICT_REVIEW'] },
        { code: 'DISTRICT_REVIEW', name: 'District Review', description: 'Pending district health officer review', next: ['PROVINCE_REVIEW', 'REQUIRES_CLARIFICATION', 'REJECTED'] },
        { code: 'PROVINCE_REVIEW', name: 'Province Review', description: 'Pending provincial health authority review', next: ['NATIONAL_REVIEW', 'REQUIRES_CLARIFICATION', 'REJECTED'] },
        { code: 'NATIONAL_REVIEW', name: 'National Review', description: 'Pending NDoH final approval', next: ['APPROVED', 'REQUIRES_CLARIFICATION', 'REJECTED'] },
        { code: 'APPROVED', name: 'Approved', description: 'Published to the official registry', next: ['DRAFT'] },
        { code: 'REQUIRES_CLARIFICATION', name: 'Requires Clarification', description: 'Returned for additional information', next: ['DISTRICT_REVIEW'] },
        { code: 'REJECTED', name: 'Rejected', description: 'Rejected with reason', next: ['DRAFT'] }
    ];
    res.json(states);
};

/**
 * GET /api/export/dhis2/orgunits
 * Exports approved facilities in DHIS2 OrgUnit import format
 * 
 * DHIS2 Format Fixes Applied:
 * - Uses GeoJSON geometry format instead of string coordinates
 * - Ensures openingDate is always set (DHIS2 requirement)
 * - Removed deprecated featureType field
 * - Omits null fields instead of including them
 */
exports.exportDHIS2OrgUnits = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                f.id,
                f.code,
                f.name,
                f.date_established,
                f.date_closed,
                f.latitude,
                f.longitude,
                f.operational_status,
                d.code as district_code,
                d.name as district_name,
                p.code as province_code,
                p.name as province_name,
                r.code as region_code,
                r.name as region_name
            FROM facilities f
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            WHERE f.workflow_status = 'APPROVED'
            ORDER BY f.name
        `);

        const orgUnits = result.rows.map(f => {
            // Build org unit with proper DHIS2 format
            const orgUnit = {
                id: f.code || `MFL-${f.id}`,
                name: f.name,
                shortName: f.name.substring(0, 50),
                code: f.code,
                // DHIS2 requires openingDate - use default if not available
                openingDate: f.date_established
                    ? new Date(f.date_established).toISOString().split('T')[0]
                    : '1900-01-01',
                parent: {
                    id: f.district_code || `DIST-${f.district_name}`
                }
            };

            // Only include closedDate if facility is closed
            if (f.date_closed) {
                orgUnit.closedDate = new Date(f.date_closed).toISOString().split('T')[0];
            }

            // Use proper GeoJSON geometry format (not string coordinates)
            if (f.latitude && f.longitude) {
                orgUnit.geometry = {
                    type: 'Point',
                    coordinates: [parseFloat(f.longitude), parseFloat(f.latitude)]
                };
            }

            // Only include attributeValues if operational_status exists
            if (f.operational_status) {
                orgUnit.attributeValues = [
                    { attribute: { name: 'operationalStatus' }, value: f.operational_status }
                ];
            }

            return orgUnit;
        });

        res.json({
            organisationUnits: orgUnits,
            meta: {
                exportDate: new Date().toISOString(),
                totalCount: orgUnits.length,
                source: 'PNG Master Facility List'
            }
        });
    } catch (err) {
        console.error('DHIS2 Export Error:', err);
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};


/**
 * GET /api/facilities/:id/services
 * Returns services available at a specific facility
 */
exports.getFacilityServices = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                fs.id,
                fs.available,
                fs.availability_notes,
                fs.certification_date,
                fs.last_verified,
                st.code,
                st.name,
                st.category,
                st.who_service_package
            FROM facility_services fs
            JOIN service_types st ON fs.service_type_id = st.id
            WHERE fs.facility_id = $1
            ORDER BY st.category, st.name
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching facility services:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * PUT /api/facilities/:id/services
 * Updates services for a facility
 */
exports.updateFacilityServices = async (req, res) => {
    const { id } = req.params;
    const { services } = req.body; // Array of { service_type_id, available, availability_notes }

    try {
        await pool.query('BEGIN');

        // Delete existing services not in the new list
        const serviceIds = services.map(s => s.service_type_id);
        if (serviceIds.length > 0) {
            await pool.query(`
                DELETE FROM facility_services 
                WHERE facility_id = $1 AND service_type_id NOT IN (${serviceIds.join(',')})
            `, [id]);
        } else {
            await pool.query('DELETE FROM facility_services WHERE facility_id = $1', [id]);
        }

        // Upsert each service
        for (const svc of services) {
            await pool.query(`
                INSERT INTO facility_services (facility_id, service_type_id, available, availability_notes)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (facility_id, service_type_id) 
                DO UPDATE SET available = $3, availability_notes = $4
            `, [id, svc.service_type_id, svc.available !== false, svc.availability_notes || null]);
        }

        await pool.query('COMMIT');
        res.json({ message: 'Services updated successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error updating facility services:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/facilities/:id/verify
 * Records a facility verification event
 */
exports.verifyFacility = async (req, res) => {
    const { id } = req.params;
    const { method, notes, gps_updated, services_updated, issues_found } = req.body;
    const userId = req.user?.id;

    try {
        await pool.query('BEGIN');

        // Insert verification record
        await pool.query(`
            INSERT INTO facility_verifications 
            (facility_id, verified_by, verification_date, method, status, gps_updated, services_updated, notes, issues_found)
            VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
        `, [
            id,
            userId,
            method || 'desk_review',
            issues_found?.length > 0 ? 'discrepancy_found' : 'verified',
            gps_updated || false,
            services_updated || false,
            notes || null,
            JSON.stringify(issues_found || [])
        ]);

        // Update facility's last_verified_date
        await pool.query(`
            UPDATE facilities 
            SET last_verified_date = NOW(), 
                verified_by = $2,
                verification_method = $3,
                updated_at = NOW()
            WHERE id = $1
        `, [id, userId, method || 'desk_review']);

        await pool.query('COMMIT');
        res.json({ message: 'Facility verified successfully', verified_at: new Date() });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error verifying facility:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/facilities/:id/verifications
 * Returns verification history for a facility
 */
exports.getFacilityVerifications = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                fv.id,
                fv.verification_date,
                fv.method,
                fv.status,
                fv.gps_updated,
                fv.services_updated,
                fv.notes,
                fv.issues_found,
                u.username as verified_by_name
            FROM facility_verifications fv
            LEFT JOIN users u ON fv.verified_by = u.id
            WHERE fv.facility_id = $1
            ORDER BY fv.verification_date DESC
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching verifications:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/facilities/:id/identifiers
 * Returns external system identifiers for a facility
 */
exports.getFacilityIdentifiers = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT id, system_name, identifier, is_primary, valid_from, valid_to, notes
            FROM facility_identifiers
            WHERE facility_id = $1
            ORDER BY is_primary DESC, system_name
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching identifiers:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/facilities/:id/identifiers
 * Adds an external system identifier to a facility
 */
exports.addFacilityIdentifier = async (req, res) => {
    const { id } = req.params;
    const { system_name, identifier, is_primary, valid_from, valid_to, notes } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO facility_identifiers 
            (facility_id, system_name, identifier, is_primary, valid_from, valid_to, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [id, system_name, identifier, is_primary || false, valid_from, valid_to, notes]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ message: 'This identifier already exists for this facility' });
        } else {
            console.error('Error adding identifier:', err);
            res.status(500).json({ message: 'Server error' });
        }
    }
};

/**
 * GET /api/reference/data-dictionary
 * Returns all data dictionary elements describing HFML schema per RMR F4 & RMR F5
 */
exports.getDataDictionary = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, code, name, category, data_type, description, criticality_level, requirement_code, is_required, is_unique, is_sensitive, active
            FROM data_dictionary_elements
            WHERE active = true
            ORDER BY category, code
        `);
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        console.error('Error fetching data dictionary:', err);
        res.status(500).json({ success: false, message: 'Server error fetching data dictionary.' });
    }
};

/**
 * POST /api/reference/data-dictionary
 * Allows admins to register/edit data dictionary elements per RMR F4
 */
exports.createDataDictionaryElement = async (req, res) => {
    try {
        const { code, name, category, data_type, description, criticality_level, requirement_code, is_required, is_unique, is_sensitive } = req.body;
        const result = await pool.query(`
            INSERT INTO data_dictionary_elements 
            (code, name, category, data_type, description, criticality_level, requirement_code, is_required, is_unique, is_sensitive)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                data_type = EXCLUDED.data_type,
                description = EXCLUDED.description,
                criticality_level = EXCLUDED.criticality_level,
                requirement_code = EXCLUDED.requirement_code,
                is_required = EXCLUDED.is_required,
                is_unique = EXCLUDED.is_unique,
                is_sensitive = EXCLUDED.is_sensitive
            RETURNING *
        `, [code, name, category, data_type || 'string', description, criticality_level || 'Recommended', requirement_code || 'RMR F4', is_required || false, is_unique || false, is_sensitive || false]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error creating data dictionary element:', err);
        res.status(500).json({ success: false, message: 'Server error updating data dictionary.' });
    }
};


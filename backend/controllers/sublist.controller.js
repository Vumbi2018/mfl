const pool = require('../db');

// GET /api/sublists - Get custom saved sub-lists for user/tenant
exports.getSublists = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const userId = req.user.id;

    const query = `
      SELECT s.*, u.username as creator_name,
             array_length(s.facility_ids, 1) as facility_count
      FROM facility_sublists s
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.tenant_code = $1 AND (s.is_public = TRUE OR s.created_by = $2)
      ORDER BY s.updated_at DESC
    `;

    const result = await pool.query(query, [tenantCode, userId]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching sublists:', err);
    res.status(500).json({ success: false, message: 'Server error fetching facility sub-lists.' });
  }
};

// GET /api/sublists/:id - Get specific sublist with facility details
exports.getSublistById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantCode = req.tenantCode || 'png';

    const sublistRes = await pool.query(
      `SELECT * FROM facility_sublists WHERE id = $1 AND tenant_code = $2`,
      [id, tenantCode]
    );

    if (sublistRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Facility sub-list not found.' });
    }

    const sublist = sublistRes.rows[0];

    let facilities = [];
    if (sublist.facility_ids && sublist.facility_ids.length > 0) {
      const facRes = await pool.query(
        `SELECT id, code, name, type, operational_status, ownership, province_id, district_id, latitude, longitude
         FROM facilities WHERE id = ANY($1)`,
        [sublist.facility_ids]
      );
      facilities = facRes.rows;
    }

    res.status(200).json({
      success: true,
      data: {
        ...sublist,
        facilities
      }
    });
  } catch (err) {
    console.error('Error fetching sublist by id:', err);
    res.status(500).json({ success: false, message: 'Server error fetching sub-list details.' });
  }
};

// POST /api/sublists - Create new custom saved sub-list
exports.createSublist = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const userId = req.user.id;
    const { name, description, version_label, facility_ids, criteria_json, is_public } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Sub-list name is required.' });
    }

    const query = `
      INSERT INTO facility_sublists 
      (tenant_code, name, description, version_label, facility_ids, criteria_json, is_public, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      tenantCode,
      name,
      description || '',
      version_label || 'v1.0',
      facility_ids || [],
      criteria_json ? JSON.stringify(criteria_json) : '{}',
      is_public !== undefined ? is_public : false,
      userId
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Facility sub-list created successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating sublist:', err);
    res.status(500).json({ success: false, message: 'Server error creating sub-list.' });
  }
};

// DELETE /api/sublists/:id
exports.deleteSublist = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantCode = req.tenantCode || 'png';

    const result = await pool.query(
      `DELETE FROM facility_sublists WHERE id = $1 AND tenant_code = $2 RETURNING id`,
      [id, tenantCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sub-list not found.' });
    }

    res.status(200).json({ success: true, message: 'Facility sub-list deleted successfully.' });
  } catch (err) {
    console.error('Error deleting sublist:', err);
    res.status(500).json({ success: false, message: 'Server error deleting sub-list.' });
  }
};

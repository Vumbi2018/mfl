const pool = require('../db');

// GET /api/versions/releases - List all HFML published releases
exports.getReleases = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';

    const result = await pool.query(
      `SELECT r.id, r.version_tag, r.title, r.description, r.facility_count, r.is_active_release, r.created_at, u.username as creator_name
       FROM hfml_releases r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.tenant_code = $1
       ORDER BY r.created_at DESC`,
      [tenantCode]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching releases:', err);
    res.status(500).json({ success: false, message: 'Server error fetching version releases.' });
  }
};

// POST /api/versions/releases - Create and seal a new HFML release snapshot
exports.createRelease = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const userId = req.user.id;
    const { version_tag, title, description } = req.body;

    if (!version_tag || !title) {
      return res.status(400).json({ success: false, message: 'Version tag (e.g. v1.1.0) and title are required.' });
    }

    // Fetch current facilities snapshot for sealing
    const facRes = await pool.query(
      `SELECT id, code, name, type, operational_status, ownership, province_id, district_id, latitude, longitude, updated_at
       FROM facilities WHERE tenant_code = $1`,
      [tenantCode]
    );

    const snapshot = facRes.rows;
    const facilityCount = snapshot.length;

    const query = `
      INSERT INTO hfml_releases 
      (tenant_code, version_tag, title, description, facility_count, snapshot_json, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, version_tag, title, description, facility_count, created_at
    `;

    const result = await pool.query(query, [
      tenantCode,
      version_tag,
      title,
      description || '',
      facilityCount,
      JSON.stringify(snapshot),
      userId
    ]);

    res.status(201).json({
      success: true,
      message: `HFML Release ${version_tag} snapshot created and sealed successfully.`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating release snapshot:', err);
    res.status(500).json({ success: false, message: 'Server error creating version release.' });
  }
};

// GET /api/versions/diff?v1=1&v2=2 - Compare two releases
exports.compareReleases = async (req, res) => {
  try {
    const { v1, v2 } = req.query;
    const tenantCode = req.tenantCode || 'png';

    if (!v1 || !v2) {
      return res.status(400).json({ success: false, message: 'Both v1 and v2 release IDs are required.' });
    }

    const r1Res = await pool.query(`SELECT * FROM hfml_releases WHERE id = $1 AND tenant_code = $2`, [v1, tenantCode]);
    const r2Res = await pool.query(`SELECT * FROM hfml_releases WHERE id = $1 AND tenant_code = $2`, [v2, tenantCode]);

    if (r1Res.rows.length === 0 || r2Res.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'One or both release snapshots were not found.' });
    }

    const snap1 = r1Res.rows[0].snapshot_json || [];
    const snap2 = r2Res.rows[0].snapshot_json || [];

    const map1 = new Map(snap1.map(f => [f.code || f.id, f]));
    const map2 = new Map(snap2.map(f => [f.code || f.id, f]));

    const added = [];
    const removed = [];
    const modified = [];

    snap2.forEach(f => {
      const key = f.code || f.id;
      if (!map1.has(key)) {
        added.push(f);
      } else {
        const oldF = map1.get(key);
        if (oldF.name !== f.name || oldF.operational_status !== f.operational_status || oldF.type !== f.type) {
          modified.push({ old: oldF, new: f });
        }
      }
    });

    snap1.forEach(f => {
      const key = f.code || f.id;
      if (!map2.has(key)) {
        removed.push(f);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        release1: { id: r1Res.rows[0].id, tag: r1Res.rows[0].version_tag, title: r1Res.rows[0].title },
        release2: { id: r2Res.rows[0].id, tag: r2Res.rows[0].version_tag, title: r2Res.rows[0].title },
        summary: {
          addedCount: added.length,
          removedCount: removed.length,
          modifiedCount: modified.length
        },
        added,
        removed,
        modified
      }
    });
  } catch (err) {
    console.error('Error comparing releases:', err);
    res.status(500).json({ success: false, message: 'Server error comparing releases.' });
  }
};

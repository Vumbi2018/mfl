const pool = require('../db');
const axios = require('axios');
const { createNotification } = require('./notification.controller');

// GET /api/connections - Get configured HIS connection profiles
exports.getConnections = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';

    const result = await pool.query(
      `SELECT c.*, u.username as creator_name
       FROM his_connections c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.tenant_code = $1
       ORDER BY c.created_at DESC`,
      [tenantCode]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching HIS connections:', err);
    res.status(500).json({ success: false, message: 'Server error fetching HIS connections.' });
  }
};

// POST /api/connections - Create new connection profile
exports.createConnection = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const userId = req.user.id;
    const {
      name, system_type, base_url, auth_type, auth_credentials,
      sync_direction, entity_scope, filter_criteria, field_mappings, sync_frequency
    } = req.body;

    if (!name || !base_url || !system_type) {
      return res.status(400).json({ success: false, message: 'Connection name, system type, and base URL are required.' });
    }

    const query = `
      INSERT INTO his_connections 
      (tenant_code, name, system_type, base_url, auth_type, auth_credentials, sync_direction, entity_scope, filter_criteria, field_mappings, sync_frequency, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      tenantCode,
      name,
      system_type,
      base_url,
      auth_type || 'bearer',
      auth_credentials ? JSON.stringify(auth_credentials) : '{}',
      sync_direction || 'PUSH',
      entity_scope || 'facilities',
      filter_criteria ? JSON.stringify(filter_criteria) : '{}',
      field_mappings ? JSON.stringify(field_mappings) : '{}',
      sync_frequency || 'manual',
      userId
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'HIS connection profile created successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating connection:', err);
    res.status(500).json({ success: false, message: 'Server error creating HIS connection.' });
  }
};

// PUT /api/connections/:id - Update connection profile
exports.updateConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantCode = req.tenantCode || 'png';
    const {
      name, system_type, base_url, auth_type, auth_credentials,
      sync_direction, entity_scope, filter_criteria, field_mappings, sync_frequency, active
    } = req.body;

    const query = `
      UPDATE his_connections SET
        name = COALESCE($1, name),
        system_type = COALESCE($2, system_type),
        base_url = COALESCE($3, base_url),
        auth_type = COALESCE($4, auth_type),
        auth_credentials = COALESCE($5, auth_credentials),
        sync_direction = COALESCE($6, sync_direction),
        entity_scope = COALESCE($7, entity_scope),
        filter_criteria = COALESCE($8, filter_criteria),
        field_mappings = COALESCE($9, field_mappings),
        sync_frequency = COALESCE($10, sync_frequency),
        active = COALESCE($11, active),
        updated_at = NOW()
      WHERE id = $12 AND tenant_code = $13
      RETURNING *
    `;

    const values = [
      name, system_type, base_url, auth_type,
      auth_credentials ? JSON.stringify(auth_credentials) : undefined,
      sync_direction, entity_scope,
      filter_criteria ? JSON.stringify(filter_criteria) : undefined,
      field_mappings ? JSON.stringify(field_mappings) : undefined,
      sync_frequency, active,
      id, tenantCode
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Connection profile not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'HIS Connection profile updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating connection:', err);
    res.status(500).json({ success: false, message: 'Server error updating connection.' });
  }
};

// DELETE /api/connections/:id
exports.deleteConnection = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantCode = req.tenantCode || 'png';

    const result = await pool.query(
      `DELETE FROM his_connections WHERE id = $1 AND tenant_code = $2 RETURNING id`,
      [id, tenantCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Connection profile not found.' });
    }

    res.status(200).json({ success: true, message: 'HIS Connection profile deleted.' });
  } catch (err) {
    console.error('Error deleting connection:', err);
    res.status(500).json({ success: false, message: 'Server error deleting connection.' });
  }
};

// POST /api/connections/:id/sync - Trigger live PUSH / PULL / BIDIRECTIONAL data synchronization
exports.executeSync = async (req, res) => {
  const startTime = new Date();
  try {
    const { id } = req.params;
    const tenantCode = req.tenantCode || 'png';

    // 1. Fetch connection profile
    const connRes = await pool.query(
      `SELECT * FROM his_connections WHERE id = $1 AND tenant_code = $2`,
      [id, tenantCode]
    );

    if (connRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Connection profile not found.' });
    }

    const conn = connRes.rows[0];
    const direction = conn.sync_direction || 'PUSH';

    // Create log entry in IN_PROGRESS state
    const logRes = await pool.query(
      `INSERT INTO his_sync_logs (connection_id, tenant_code, sync_direction, status, started_at)
       VALUES ($1, $2, $3, 'IN_PROGRESS', NOW()) RETURNING id`,
      [conn.id, tenantCode, direction]
    );
    const logId = logRes.rows[0].id;

    let recordsPushed = 0;
    let recordsPulled = 0;
    let errors = [];

    // Setup headers and auth
    const headers = { 'Content-Type': 'application/json' };
    const creds = conn.auth_credentials || {};
    if (conn.auth_type === 'bearer' && creds.token) {
      headers['Authorization'] = `Bearer ${creds.token}`;
    } else if (conn.auth_type === 'api_key' && creds.apiKey) {
      headers['x-api-key'] = creds.apiKey;
    }

    // 2. Execute PUSH Logic (HFRS -> Target Application)
    if (direction === 'PUSH' || direction === 'BIDIRECTIONAL') {
      const facRes = await pool.query(
        `SELECT f.*, d.name as district_name, p.name as province_name
         FROM facilities f
         LEFT JOIN districts d ON f.district_id = d.id
         LEFT JOIN provinces p ON d.province_id = p.id
         WHERE f.tenant_code = $1`,
        [tenantCode]
      );

      const facilities = facRes.rows;
      recordsPushed = facilities.length;

      // Apply field mappings if present
      const mappedData = facilities.map(f => {
        const mapped = {};
        const mappings = conn.field_mappings || {};
        if (Object.keys(mappings).length > 0) {
          Object.keys(mappings).forEach(localKey => {
            const remoteKey = mappings[localKey];
            mapped[remoteKey] = f[localKey] !== undefined ? f[localKey] : f.name;
          });
        } else {
          mapped.code = f.code;
          mapped.name = f.name;
          mapped.type = f.type;
          mapped.status = f.operational_status;
          mapped.district = f.district_name;
        }
        return mapped;
      });

      // Attempt transmitting data to target application URL if external
      if (conn.base_url.startsWith('http')) {
        try {
          await axios.post(conn.base_url, {
            syncType: 'PUSH',
            timestamp: new Date(),
            data: mappedData
          }, { headers, timeout: 10000 });
        } catch (pushErr) {
          // Log HTTP error or endpoint response
          errors.push({ error: 'PUSH endpoint error', details: pushErr.message });
        }
      }
    }

    // 3. Execute PULL Logic (Target Application -> HFRS)
    if (direction === 'PULL' || direction === 'BIDIRECTIONAL') {
      if (conn.base_url.startsWith('http')) {
        try {
          const response = await axios.get(conn.base_url, { headers, timeout: 10000 });
          const remoteRecords = Array.isArray(response.data) ? response.data : (response.data.data || response.data.facilities || []);
          recordsPulled = remoteRecords.length;

          // Upsert / Ingest records safely per Data Safety Rules (UPSERT ONLY)
          for (const rec of remoteRecords) {
            const facCode = rec.code || rec.lmisFacilityCode || rec.id;
            const facName = rec.name || rec.facilityName || 'Imported Facility';

            if (facCode) {
              await pool.query(
                `INSERT INTO facilities (tenant_code, code, name, type, operational_status, workflow_status)
                 VALUES ($1, $2, $3, $4, $5, 'APPROVED')
                 ON CONFLICT (tenant_code, code) DO UPDATE SET
                   name = EXCLUDED.name,
                   updated_at = NOW()`,
                [tenantCode, facCode, facName, rec.type || rec.facilityType || 'Health Centre', rec.status || 'Operational']
              );
            }
          }
        } catch (pullErr) {
          errors.push({ error: 'PULL endpoint error', details: pullErr.message });
        }
      }
    }

    const finalStatus = errors.length > 0 && recordsPushed === 0 && recordsPulled === 0 ? 'FAILED' : 'SUCCESS';

    // 4. Update sync logs and connection status
    await pool.query(
      `UPDATE his_sync_logs SET
        status = $1,
        records_pushed = $2,
        records_pulled = $3,
        details = $4,
        errors_json = $5,
        completed_at = NOW()
       WHERE id = $6`,
      [finalStatus, recordsPushed, recordsPulled, `Sync completed in ${Date.now() - startTime.getTime()}ms`, JSON.stringify(errors), logId]
    );

    await pool.query(
      `UPDATE his_connections SET last_sync_at = NOW(), last_sync_status = $1 WHERE id = $2`,
      [finalStatus, conn.id]
    );

    // Create notification alert
    await createNotification({
      userId: req.user.id,
      tenantCode,
      title: `HIS Sync Completed: ${conn.name}`,
      message: `Synchronization (${direction}) finished. Pushed: ${recordsPushed}, Pulled: ${recordsPulled}. Status: ${finalStatus}`,
      type: finalStatus === 'SUCCESS' ? 'success' : 'warning',
      link: '/interoperability-hub'
    });

    res.status(200).json({
      success: true,
      message: `Sync execution (${direction}) completed for ${conn.name}.`,
      data: {
        connectionId: conn.id,
        direction,
        status: finalStatus,
        recordsPushed,
        recordsPulled,
        errors
      }
    });
  } catch (err) {
    console.error('Error executing sync:', err);
    res.status(500).json({ success: false, message: 'Server error during sync execution.' });
  }
};

// GET /api/connections/:id/logs - Get execution logs for a connection
exports.getSyncLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantCode = req.tenantCode || 'png';

    const result = await pool.query(
      `SELECT * FROM his_sync_logs 
       WHERE connection_id = $1 AND tenant_code = $2
       ORDER BY started_at DESC LIMIT 50`,
      [id, tenantCode]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching sync logs:', err);
    res.status(500).json({ success: false, message: 'Server error fetching sync logs.' });
  }
};

if (typeof self === 'undefined') {
  global.self = global;
}

const pool = require('../db');
const shp = require('shpjs');
const fs = require('fs');


// GET /api/spatial/hierarchy - Return complete 4-level administrative hierarchy tree with counts
exports.getHierarchy = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';

    const regionsRes = await pool.query(
      `SELECT r.id, r.name, r.code, COUNT(p.id) as province_count
       FROM regions r
       LEFT JOIN provinces p ON p.region_id = r.id
       WHERE r.tenant_code = $1
       GROUP BY r.id, r.name, r.code
       ORDER BY r.name`,
      [tenantCode]
    );

    const provincesRes = await pool.query(
      `SELECT p.id, p.name, p.code, p.region_id, COUNT(d.id) as district_count
       FROM provinces p
       LEFT JOIN districts d ON d.province_id = p.id
       WHERE p.tenant_code = $1
       GROUP BY p.id, p.name, p.code, p.region_id
       ORDER BY p.name`,
      [tenantCode]
    );

    const districtsRes = await pool.query(
      `SELECT d.id, d.name, d.code, d.province_id, COUNT(w.id) as ward_count
       FROM districts d
       LEFT JOIN wards w ON w.district_id = d.id
       WHERE d.tenant_code = $1
       GROUP BY d.id, d.name, d.code, d.province_id
       ORDER BY d.name`,
      [tenantCode]
    );

    const wardsRes = await pool.query(
      `SELECT w.id, w.name, w.code, w.district_id, w.population
       FROM wards w
       WHERE w.tenant_code = $1
       ORDER BY w.name`,
      [tenantCode]
    );

    res.status(200).json({
      success: true,
      data: {
        level1_regions: regionsRes.rows,
        level2_provinces: provincesRes.rows,
        level3_districts: districtsRes.rows,
        level4_wards: wardsRes.rows
      }
    });
  } catch (err) {
    console.error('Error fetching spatial hierarchy:', err);
    res.status(500).json({ success: false, message: 'Server error fetching spatial hierarchy.' });
  }
};

// GET /api/spatial/level1 - Level 1 Country / Regions GeoJSON
exports.getRegions = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const result = await pool.query(
      `SELECT id, name, code, ST_AsGeoJSON(geom)::json as geometry FROM regions WHERE tenant_code = $1 AND geom IS NOT NULL`,
      [tenantCode]
    );
    res.json({
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        id: row.id,
        properties: { id: row.id, name: row.name, code: row.code, level: 1 },
        geometry: row.geometry
      }))
    });
  } catch (err) {
    console.error('Error fetching Level 1 GeoJSON:', err);
    res.status(500).json({ error: 'Failed to fetch Level 1 spatial data' });
  }
};

// GET /api/spatial/level2 - Level 2 Provinces GeoJSON
exports.getProvinces = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const result = await pool.query(
      `SELECT id, name, code, ST_AsGeoJSON(geom)::json as geometry FROM provinces WHERE tenant_code = $1 AND geom IS NOT NULL`,
      [tenantCode]
    );
    res.json({
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        id: row.id,
        properties: { id: row.id, name: row.name, code: row.code, level: 2 },
        geometry: row.geometry
      }))
    });
  } catch (err) {
    console.error('Error fetching Level 2 GeoJSON:', err);
    res.status(500).json({ error: 'Failed to fetch Level 2 spatial data' });
  }
};

// GET /api/spatial/level3 - Level 3 Districts GeoJSON
exports.getDistricts = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const result = await pool.query(
      `SELECT d.id, d.name, d.code, p.name as province_name, ST_AsGeoJSON(d.geom)::json as geometry
       FROM districts d
       LEFT JOIN provinces p ON d.province_id = p.id
       WHERE d.tenant_code = $1 AND d.geom IS NOT NULL`,
      [tenantCode]
    );
    res.json({
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        id: row.id,
        properties: { id: row.id, name: row.name, code: row.code, province: row.province_name, level: 3 },
        geometry: row.geometry
      }))
    });
  } catch (err) {
    console.error('Error fetching Level 3 GeoJSON:', err);
    res.status(500).json({ error: 'Failed to fetch Level 3 spatial data' });
  }
};

// GET /api/spatial/level4 - Level 4 Wards / LLGs GeoJSON
exports.getWards = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const result = await pool.query(
      `SELECT w.id, w.name, w.code, w.population, d.name as district_name, ST_AsGeoJSON(w.geom)::json as geometry
       FROM wards w
       LEFT JOIN districts d ON w.district_id = d.id
       WHERE w.tenant_code = $1 AND w.geom IS NOT NULL`,
      [tenantCode]
    );
    res.json({
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        id: row.id,
        properties: { id: row.id, name: row.name, code: row.code, district: row.district_name, population: row.population, level: 4 },
        geometry: row.geometry
      }))
    });
  } catch (err) {
    console.error('Error fetching Level 4 GeoJSON:', err);
    res.status(500).json({ error: 'Failed to fetch Level 4 spatial data' });
  }
};

// POST /api/spatial/inspect-shapefile - Inspect uploaded shapefile fields and sample features
exports.inspectShapefile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No shapefile or geojson uploaded.' });
    }

    const filePath = req.file.path;
    let geojson = null;

    if (req.file.originalname.endsWith('.zip')) {
      const buffer = fs.readFileSync(filePath);
      const shpModule = await import('shpjs');
      const parseShp = shpModule.default || shpModule.parseZip || shpModule;
      geojson = await parseShp(buffer);
    } else {
      const fileText = fs.readFileSync(filePath, 'utf8');
      geojson = JSON.parse(fileText);
    }

    if (Array.isArray(geojson)) {
      geojson = geojson[0];
    }

    const features = geojson.features || [];
    if (features.length === 0) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Uploaded file contains 0 spatial features.' });
    }

    // Collect all unique property keys
    const fieldSet = new Set();
    features.forEach(f => {
      if (f.properties) {
        Object.keys(f.properties).forEach(k => fieldSet.add(k));
      }
    });

    const fields = Array.from(fieldSet);

    // Auto-detect name field
    const suggestedNameField = fields.find(f => 
      /^(name|nam|adm4_en|adm4_name|adm3_en|adm3_name|ward_name|ward|district|province|lgt_name|llg_name)$/i.test(f)
    ) || fields.find(f => /name/i.test(f)) || fields[0] || '';

    // Auto-detect code field
    const suggestedCodeField = fields.find(f => 
      /^(code|pcode|adm4_pcode|adm4_code|adm3_pcode|ward_code|dist_code|prov_code|id)$/i.test(f)
    ) || fields.find(f => /code/i.test(f)) || '';

    // Auto-detect population field
    const suggestedPopField = fields.find(f => 
      /^(pop|population|pop_total|tot_pop|pop_2020|pop_2021|pop_2022)$/i.test(f)
    ) || fields.find(f => /pop/i.test(f)) || '';

    // Sample first 5 features
    const sampleFeatures = features.slice(0, 5).map((f, idx) => ({
      index: idx + 1,
      properties: f.properties || {},
      geometryType: f.geometry?.type || 'Unknown'
    }));

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      totalFeatures: features.length,
      fields,
      suggestedNameField,
      suggestedCodeField,
      suggestedPopField,
      sampleFeatures
    });
  } catch (err) {
    console.error('Error inspecting shapefile:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to inspect shapefile: ' + err.message });
  }
};

// POST /api/spatial/upload-shapefile - Process uploaded .zip Shapefile or GeoJSON with custom field mapping & Replace/Upsert mode
exports.uploadShapefile = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const { target_level, parent_id, name_field, code_field, pop_field, mode } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No spatial shapefile (.zip) or .geojson file uploaded.' });
    }

    const level = parseInt(target_level) || 3;
    const filePath = req.file.path;
    let geojson = null;

    if (req.file.originalname.endsWith('.zip')) {
      const buffer = fs.readFileSync(filePath);
      const shpModule = await import('shpjs');
      const parseShp = shpModule.default || shpModule.parseZip || shpModule;
      geojson = await parseShp(buffer);
    } else {
      const fileText = fs.readFileSync(filePath, 'utf8');
      geojson = JSON.parse(fileText);
    }

    if (Array.isArray(geojson)) {
      geojson = geojson[0];
    }

    const features = geojson.features || [];
    let updatedCount = 0;
    let insertedCount = 0;
    let indexCount = 0;

    for (const feat of features) {
      indexCount++;
      const props = feat.properties || {};

      // Dynamic name resolution based on user selection or auto fallback
      let name = '';
      if (name_field && props[name_field]) {
        name = String(props[name_field]).trim();
      } else {
        name = props.NAME || props.name || props.ADM4_EN || props.ADM4_NAME || props.NAME_4 || props.WARD_NAME || props.ward_name || props.ADM3_EN || props.ADM3_NAME || props.NAME_3 || props.District || props.Ward || props.Province || `Boundary ${indexCount}`;
      }

      // Dynamic code resolution
      let code = '';
      if (code_field && code_field !== 'auto' && props[code_field]) {
        code = String(props[code_field]).trim();
      } else {
        code = props.CODE || props.code || props.ADM4_PCODE || props.ADM4_CODE || props.ADM3_PCODE || props.PCODE || `SPAT_${Date.now()}_${indexCount}`;
      }

      // Dynamic population resolution
      let population = 0;
      if (pop_field && props[pop_field]) {
        population = parseInt(props[pop_field]) || 0;
      } else {
        population = parseInt(props.POPULATION || props.pop || props.population || 0) || 0;
      }

      const geomJson = JSON.stringify(feat.geometry);

      // Determine Table
      const tableName = level === 1 ? 'regions' : level === 2 ? 'provinces' : level === 3 ? 'districts' : 'wards';

      // Check if boundary exists by code OR lower(name) within tenant to UPSERT in-place
      const existingRes = await pool.query(
        `SELECT id FROM ${tableName} WHERE tenant_code = $1 AND (code = $2 OR lower(name) = lower($3)) LIMIT 1`,
        [tenantCode, code, name]
      );

      if (existingRes.rows.length > 0 && mode !== 'append_only') {
        // REPLACE / UPDATE existing record in place
        const existingId = existingRes.rows[0].id;
        if (level === 1) {
          await pool.query(
            `UPDATE regions SET name = $1, code = $2, geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)) WHERE id = $4`,
            [name, code, geomJson, existingId]
          );
        } else if (level === 2) {
          await pool.query(
            `UPDATE provinces SET name = $1, code = $2, region_id = COALESCE($3, region_id), geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)) WHERE id = $5`,
            [name, code, parent_id || null, geomJson, existingId]
          );
        } else if (level === 3) {
          await pool.query(
            `UPDATE districts SET name = $1, code = $2, province_id = COALESCE($3, province_id), geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)) WHERE id = $5`,
            [name, code, parent_id || null, geomJson, existingId]
          );
        } else if (level === 4) {
          await pool.query(
            `UPDATE wards SET name = $1, code = $2, district_id = COALESCE($3, district_id), population = GREATEST($4, population), geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)) WHERE id = $6`,
            [name, code, parent_id || null, population, geomJson, existingId]
          );
        }
        updatedCount++;
      } else {
        // INSERT new record
        if (level === 1) {
          await pool.query(
            `INSERT INTO regions (tenant_code, name, code, geom)
             VALUES ($1, $2, $3, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326)))`,
            [tenantCode, name, code, geomJson]
          );
        } else if (level === 2) {
          await pool.query(
            `INSERT INTO provinces (tenant_code, name, code, region_id, geom)
             VALUES ($1, $2, $3, $4, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)))`,
            [tenantCode, name, code, parent_id || null, geomJson]
          );
        } else if (level === 3) {
          await pool.query(
            `INSERT INTO districts (tenant_code, name, code, province_id, geom)
             VALUES ($1, $2, $3, $4, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)))`,
            [tenantCode, name, code, parent_id || null, geomJson]
          );
        } else if (level === 4) {
          await pool.query(
            `INSERT INTO wards (tenant_code, name, code, district_id, population, geom)
             VALUES ($1, $2, $3, $4, $5, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)))`,
            [tenantCode, name, code, parent_id || null, population, geomJson]
          );
        }
        insertedCount++;
      }
    }

    // Auto Spatial Linking for Level 4 Wards & Facilities
    if (level === 4) {
      try {
        await pool.query(`
          UPDATE wards w
          SET district_id = d.id, province_id = d.province_id
          FROM districts d
          WHERE w.district_id IS NULL AND w.geom IS NOT NULL AND d.geom IS NOT NULL AND ST_Intersects(w.geom, d.geom);

          UPDATE facilities f
          SET ward_id = w.id
          FROM wards w
          WHERE f.ward_id IS NULL AND f.latitude IS NOT NULL AND f.longitude IS NOT NULL AND f.latitude != 0 AND f.longitude != 0 AND w.geom IS NOT NULL AND ST_Contains(w.geom, ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326));
        `);
      } catch (linkErr) {
        console.error('Auto spatial linking warning:', linkErr.message);
      }
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: `Successfully processed shapefile into Level ${level}: ${updatedCount} boundaries updated/replaced, ${insertedCount} new boundaries inserted.`,
      updatedCount,
      insertedCount,
      totalProcessed: indexCount,
      targetLevel: level
    });
  } catch (err) {
    console.error('Error uploading shapefile:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Failed to process shapefile: ' + err.message });
  }
};

// PUT /api/spatial/boundaries/:level/:id - Update boundary details
exports.updateBoundary = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const { level, id } = req.params;
    const { name, code, population, parent_id } = req.body;

    const lvl = parseInt(level);
    const boundaryId = parseInt(id);

    if (lvl === 1) {
      await pool.query(
        `UPDATE regions SET name = $1, code = $2 WHERE id = $3 AND tenant_code = $4`,
        [name, code, boundaryId, tenantCode]
      );
    } else if (lvl === 2) {
      await pool.query(
        `UPDATE provinces SET name = $1, code = $2, region_id = $3 WHERE id = $4 AND tenant_code = $5`,
        [name, code, parent_id || null, boundaryId, tenantCode]
      );
    } else if (lvl === 3) {
      await pool.query(
        `UPDATE districts SET name = $1, code = $2, province_id = $3 WHERE id = $4 AND tenant_code = $5`,
        [name, code, parent_id || null, boundaryId, tenantCode]
      );
    } else if (lvl === 4) {
      await pool.query(
        `UPDATE wards SET name = $1, code = $2, population = $3, district_id = $4 WHERE id = $5 AND tenant_code = $6`,
        [name, code, parseInt(population) || 0, parent_id || null, boundaryId, tenantCode]
      );
    }

    res.status(200).json({ success: true, message: `Level ${lvl} boundary ID ${boundaryId} updated successfully.` });
  } catch (err) {
    console.error('Error updating boundary:', err);
    res.status(500).json({ success: false, message: 'Failed to update boundary: ' + err.message });
  }
};

// DELETE /api/spatial/boundaries/:level/:id - Safely delete boundary
exports.deleteBoundary = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const { level, id } = req.params;
    const lvl = parseInt(level);
    const boundaryId = parseInt(id);

    const tableName = lvl === 1 ? 'regions' : lvl === 2 ? 'provinces' : lvl === 3 ? 'districts' : 'wards';

    await pool.query(
      `DELETE FROM ${tableName} WHERE id = $1 AND tenant_code = $2`,
      [boundaryId, tenantCode]
    );

    res.status(200).json({ success: true, message: `Boundary ID ${boundaryId} deleted successfully.` });
  } catch (err) {
    console.error('Error deleting boundary:', err);
    res.status(500).json({ success: false, message: 'Failed to delete boundary: ' + err.message });
  }
};

// DELETE /api/spatial/level/:level - Wipe/Clear all shapefiles for a specific administrative level
exports.deleteLevelBoundaries = async (req, res) => {
  try {
    const tenantCode = req.tenantCode || 'png';
    const lvl = parseInt(req.params.level);

    if (![1, 2, 3, 4].includes(lvl)) {
      return res.status(400).json({ success: false, message: 'Invalid administrative level.' });
    }

    const tableName = lvl === 1 ? 'regions' : lvl === 2 ? 'provinces' : lvl === 3 ? 'districts' : 'wards';

    if (lvl === 4) {
      // Unlink facilities first
      await pool.query(`UPDATE facilities SET ward_id = NULL WHERE ward_id IN (SELECT id FROM wards WHERE tenant_code = $1)`, [tenantCode]);
    }

    const deleteRes = await pool.query(`DELETE FROM ${tableName} WHERE tenant_code = $1`, [tenantCode]);

    res.status(200).json({
      success: true,
      message: `Successfully cleared ${deleteRes.rowCount} Level ${lvl} boundaries for tenant '${tenantCode}'. You can now upload a fresh shapefile.`,
      deletedCount: deleteRes.rowCount,
      level: lvl
    });
  } catch (err) {
    console.error(`Error deleting Level ${req.params.level} boundaries:`, err);
    res.status(500).json({ success: false, message: `Failed to clear Level ${req.params.level} boundaries: ${err.message}` });
  }
};

// GET /api/spatial/health-offices - Retrieve District and Provincial Health Offices
exports.getHealthOffices = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    let offices = [];
    try {
      const dbRes = await pool.query(`SELECT * FROM health_offices ORDER BY province, district`);
      if (dbRes.rows.length > 0) {
        offices = dbRes.rows.map(r => ({
          ...r,
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude)
        }));
      }
    } catch (e) {
      console.warn("Table health_offices query failed, falling back to static JSON bundle:", e.message);
    }

    if (offices.length === 0) {
      const jsonPath = path.join(__dirname, '../../src/data/zambia_health_offices.json');
      if (fs.existsSync(jsonPath)) {
        offices = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      }
    }

    res.status(200).json({
      success: true,
      count: offices.length,
      provincial_hq_count: offices.filter(c => c.is_provincial_hq).length,
      district_hq_count: offices.filter(c => c.is_district_hq).length,
      data: offices
    });
  } catch (err) {
    console.error('Error fetching health offices:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch health offices: ' + err.message });
  }
};




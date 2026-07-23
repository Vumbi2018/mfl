const pool = require('../db');

async function autoLinkSpatialWards() {
  try {
    console.log('🔄 Spatially linking wards to districts via ST_Contains/ST_Intersects...');
    
    const wardDistrictLink = await pool.query(`
      UPDATE wards w
      SET district_id = d.id,
          province_id = d.province_id
      FROM districts d
      WHERE w.district_id IS NULL
        AND w.geom IS NOT NULL
        AND d.geom IS NOT NULL
        AND ST_Intersects(w.geom, d.geom);
    `);
    console.log(`✅ Updated ${wardDistrictLink.rowCount} wards with parent district_id via spatial intersection.`);

    console.log('🔄 Spatially linking facilities to wards via ST_Contains...');
    const facilityWardLink = await pool.query(`
      UPDATE facilities f
      SET ward_id = w.id
      FROM wards w
      WHERE f.ward_id IS NULL
        AND f.latitude IS NOT NULL
        AND f.longitude IS NOT NULL
        AND f.latitude != 0
        AND f.longitude != 0
        AND w.geom IS NOT NULL
        AND ST_Contains(w.geom, ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326));
    `);
    console.log(`✅ Updated ${facilityWardLink.rowCount} facilities with ward_id via spatial point-in-polygon.`);

    const facWardCount = await pool.query('SELECT count(*) FROM facilities WHERE ward_id IS NOT NULL');
    console.log(`📊 Total facilities now linked to a ward_id: ${facWardCount.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error linking spatial wards:', err);
    process.exit(1);
  }
}

autoLinkSpatialWards();

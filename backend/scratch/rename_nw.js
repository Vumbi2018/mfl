const pool = require('../db');

async function renameNW() {
    try {
        const res = await pool.query(
            "UPDATE provinces SET name = 'Northwestern' WHERE name = 'North-Western' AND tenant_code = 'zambia' RETURNING id"
        );
        if (res.rowCount > 0) {
            console.log(`Renamed North-Western to Northwestern (ID: ${res.rows[0].id})`);
        } else {
            console.log("North-Western not found or already renamed.");
        }
        
        // Also update districts if they use North-Western in their names (though they usually don't)
        // But more importantly, the spatial data import script uses name matching.
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

renameNW();

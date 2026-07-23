const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mfl_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function check() {
    try {
        console.log("Checking Table Columns...");

        const tables = ['users', 'facilities', 'roles', 'regions', 'user_jurisdictions'];

        for (const tbl of tables) {
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [tbl]);
            console.log(`Columns in '${tbl}':`, res.rows.map(r => r.column_name).join(', '));
        }

        console.log("\nAttempting Full Controller Query...");
        const userQuery = `
            SELECT u.id, u.username, u.email, u.active, u.created_at, u.role_id, 
                   u.first_name, u.last_name, u.phone_number, u.facility_id, u.is_national,
                   r.name as role,
                   f.name as facility_name,
                   COALESCE(
                       json_agg(DISTINCT jsonb_build_object(
                           'id', up.permission_id,
                           'slug', p_direct.slug,
                           'is_granted', up.is_granted
                       )) FILTER (WHERE up.id IS NOT NULL),
                       '[]'
                   ) as direct_permissions,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', uj.id,
                               'region_id', uj.region_id,
                               'province_id', uj.province_id,
                               'district_id', uj.district_id,
                               'region_name', reg.name,
                               'province_name', prov.name,
                               'district_name', dist.name
                           )
                       ) FILTER (WHERE uj.id IS NOT NULL), 
                       '[]'
                   ) as jurisdictions
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN facilities f ON u.facility_id = f.id
            LEFT JOIN user_jurisdictions uj ON u.id = uj.user_id
            LEFT JOIN regions reg ON uj.region_id = reg.id
            LEFT JOIN provinces prov ON uj.province_id = prov.id
            LEFT JOIN districts dist ON uj.district_id = dist.id
            LEFT JOIN user_permissions up ON u.id = up.user_id
            LEFT JOIN permissions p_direct ON up.permission_id = p_direct.id
            GROUP BY u.id, r.name, f.name
            ORDER BY u.id DESC
            LIMIT 100
        `;
        const res2 = await pool.query(userQuery);
        console.log("Query Success! Rows:", res2.rows.length);
        console.log("First Row:", JSON.stringify(res2.rows[0], null, 2));

    } catch (err) {
        console.error("FAILURE:", err.message);
        if (err.detail) console.error("Detail:", err.detail);
        if (err.hint) console.error("Hint:", err.hint);
    } finally {
        pool.end();
    }
}

check();

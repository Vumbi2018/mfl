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

// Helper to generate random reference number
const generateRef = (facilityName, i) => {
    const code = facilityName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${code}-GEN-${date}-${String(i).padStart(4, '0')}`;
};

async function seedMassTickets() {
    try {
        const client = await pool.connect();
        console.log('Fetching facilities...');
        const facRes = await client.query('SELECT id, name FROM facilities LIMIT 100'); // Get top 100 facilities
        const userRes = await client.query('SELECT id FROM users');

        const facilities = facRes.rows;
        const technicians = userRes.rows; // Likely just the admin, but fine

        if (facilities.length === 0) {
            console.log("No facilities found to link tickets to.");
            return;
        }

        console.log(`Seeding tickets for ${facilities.length} facilities...`);

        const equipmentTypes = ['Refrigerator', 'Cold Room', 'Freezer', 'Incinerator', 'Generator', 'Solar Panel'];
        const priorities = ['Low', 'Medium', 'High', 'Critical'];
        const statuses = ['New', 'Assigned', 'In Progress', 'Resolved', 'Escalated'];
        const faultDescriptions = [
            'Temperature fluctuation',
            'Compressor failure',
            'Door seal broken',
            'Power supply unstable',
            'Strange noise from motor',
            'Leaking water',
            'Thermostat broken',
            'Scheduled maintenance'
        ];

        const ticketValues = [];

        // Generate 50 tickets
        for (let i = 0; i < 50; i++) {
            const facility = facilities[Math.floor(Math.random() * facilities.length)];
            const tech = Math.random() > 0.3 && technicians.length > 0
                ? technicians[Math.floor(Math.random() * technicians.length)].id
                : null;

            const ref = generateRef(facility.name, i + 1000);
            const equip = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
            const fault = faultDescriptions[Math.floor(Math.random() * faultDescriptions.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const sla = ['normal', 'warning', 'critical'][Math.floor(Math.random() * 3)];

            // Prepare for batch insert or single insert. Single is loop is fine for 50.
            await client.query(`
                INSERT INTO tickets (reference_number, facility_id, equipment_name, equipment_type, fault_description, priority, status, assigned_technician_id, sla_status, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - (random() * interval '10 days'))
                ON CONFLICT (reference_number) DO NOTHING
            `, [
                ref, facility.id, `Generic ${equip}`, equip, fault, priority, status, tech, sla
            ]);
        }

        console.log('Successfully seeded 50 realistic tickets.');
        client.release();
    } catch (err) {
        console.error('Error seeding tickets:', err);
    } finally {
        pool.end();
    }
}

seedMassTickets();

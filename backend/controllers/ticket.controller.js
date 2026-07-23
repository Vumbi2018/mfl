// ORIGINAL CODE COMMENTED OUT TO PRESERVE COMPATIBILITY AND COMPLY WITH DEVELOPMENT PRINCIPLES
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

// REPLACEMENT: Standardized database pool from central db.js configuration to respect SSL and environment configs
const pool = require('../db');

exports.getTickets = async (req, res) => {
    try {
        // ORIGINAL CODE QUERY COMMENTED OUT:
        // const query = `
        //     SELECT t.*, 
        //            f.facility_name as facility_name, 
        //            f.latitude, f.longitude,
        //            d.district_name as district,
        //            p.province_name as province,
        //            r.region_name as region,
        //            u.username as assigned_technician
        //     FROM tickets t
        //     LEFT JOIN facilities f ON t.facility_id = f.facility_id
        //     LEFT JOIN districts d ON f.district_id = d.district_id
        //     LEFT JOIN provinces p ON d.province_id = p.province_id
        //     LEFT JOIN regions r ON p.region_id = r.region_id
        //     LEFT JOIN users u ON t.assigned_to = u.user_id
        //     ORDER BY t.created_at DESC
        // `;

        // REPLACEMENT QUERY: Corrected to match true PostgreSQL schema columns and relationships
        const query = `
            SELECT t.*, 
                   f.name as facility_name, 
                   f.latitude, f.longitude,
                   d.name as district,
                   p.name as province,
                   r.name as region,
                   u.username as assigned_technician
            FROM tickets t
            LEFT JOIN facilities f ON t.facility_id = f.id
            LEFT JOIN districts d ON f.district_id = d.id
            LEFT JOIN provinces p ON d.province_id = p.id
            LEFT JOIN regions r ON p.region_id = r.id
            LEFT JOIN users u ON t.assigned_technician_id = u.id
            ORDER BY t.created_at DESC
        `;

        const { rows } = await pool.query(query);
        res.status(200).json(rows);
    } catch (err) {
        console.error("Error fetching tickets:", err);
        res.status(500).send("Server Error Fetching Tickets");
    }
};

exports.createTicket = async (req, res) => {
    try {
        const { reference_number, facility_id, equipment_name, equipment_type, fault_description, priority } = req.body;

        // Auto-generate reference number if not supplied by the frontend
        let ref = reference_number;
        if (!ref) {
            const code = 'TIC';
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const rand = Math.floor(1000 + Math.random() * 9000);
            ref = `${code}-${date}-${rand}`;
        }

        // ORIGINAL CODE INSERT COMMENTED OUT:
        // const result = await pool.query(
        //     `INSERT INTO tickets (ticket_reference_number, facility_id, equipment_model, notes, fault_description, priority, ticket_status)
        //      VALUES ($1, $2, $3, $4, $5, $6, 'New') RETURNING *`,
        //     [reference_number, facility_id, equipment_name, `Type: ${equipment_type}`, fault_description, priority]
        // );

        // REPLACEMENT INSERT: Aligned with the actual tickets table schema
        const result = await pool.query(
            `INSERT INTO tickets (reference_number, facility_id, equipment_name, equipment_type, fault_description, priority, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'New') RETURNING *`,
            [ref, facility_id, equipment_name, equipment_type, fault_description, priority]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating ticket:", err);
        res.status(500).send("Error Creating Ticket");
    }
};


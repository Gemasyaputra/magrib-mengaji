const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables like migrate.js does
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function checkGroups() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to DB...');
    const client = await pool.connect();
    try {
      console.log('Querying study_groups...');
      const res = await client.query('SELECT * FROM study_groups');
      console.log('Study Groups Count:', res.rowCount);
      console.log('Study Groups Data:', res.rows);

      console.log('Querying users (teachers)...');
      const userRes = await client.query("SELECT id, name, role FROM users WHERE role = 'teacher'");
      console.log('Teachers:', userRes.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkGroups();

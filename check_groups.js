const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkGroups() {
  try {
    const res = await pool.query('SELECT * FROM study_groups');
    console.log('Study Groups:', res.rows);
    
    // Also check users to confirm Ustadz Ali's ID
    const userRes = await pool.query("SELECT id, name, role FROM users WHERE name LIKE '%Ali%'");
    console.log('Ali User:', userRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkGroups();

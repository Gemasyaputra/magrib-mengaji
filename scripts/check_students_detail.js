const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function checkStudentsDetail() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    try {
      console.log('Checking students detail...');
      const students = await client.query(`
        SELECT id, name, group_id, mosque_id 
        FROM students 
        WHERE group_id = 1
      `);
      console.log('Students in Group 1:', students.rows);
      
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkStudentsDetail();

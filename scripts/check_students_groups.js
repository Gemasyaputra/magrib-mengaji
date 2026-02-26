const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function checkStudents() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    try {
      console.log('Checking students and groups...');
      const students = await client.query(`
        SELECT s.id, s.name, s.group_id, g.name as group_name, g.teacher_id 
        FROM students s 
        LEFT JOIN study_groups g ON s.group_id = g.id
      `);
      console.log('Students:', students.rows);
      
      console.log('Checking study groups for Ustadz Ali (ID 2)...');
      const groups = await client.query(`SELECT * FROM study_groups WHERE teacher_id = 2`);
      console.log('Groups for Ustadz Ali:', groups.rows);

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkStudents();

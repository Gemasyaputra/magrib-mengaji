const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function fixData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    try {
      console.log('Fixing data...');
      // Update all study groups assigned to ANY 'Ustadz Ali' to be assigned to ID 2 (our hardcoded login user)
      // First, get ID 2
      const targetUser = await client.query("SELECT id FROM users WHERE id = 2 AND name = 'Ustadz Ali'");
      
      if (targetUser.rows.length === 0) {
        console.log('User ID 2 (Ustadz Ali) not found! Cannot fix.');
        return;
      }

      // Find other Ustadz Ali IDs
      const allAlis = await client.query("SELECT id FROM users WHERE name = 'Ustadz Ali' AND id != 2");
      const aliIds = allAlis.rows.map(r => r.id);

      if (aliIds.length > 0) {
          console.log(`Found duplicate Ustadz Ali IDs: ${aliIds.join(', ')}`);
          // Update study_groups
          const updateRes = await client.query(`
            UPDATE study_groups 
            SET teacher_id = 2 
            WHERE teacher_id = ANY($1::int[])
          `, [aliIds]);
          console.log(`Updated ${updateRes.rowCount} study groups to belong to User ID 2.`);
      } else {
          console.log('No duplicate Ustadz Ali users found to merge from.');
          // Check if there are groups with NO teacher or WRONG teacher?
          // Force update 'kelompok 1' to ID 2 just in case
          const forceUpdate = await client.query(`UPDATE study_groups SET teacher_id = 2 WHERE name = 'kelompok 1'`);
          console.log(`Force updated 'kelompok 1' to User ID 2: ${forceUpdate.rowCount} rows.`);
      }

    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

fixData();

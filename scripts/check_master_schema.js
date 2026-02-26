const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'master_daily_prayers';
    `);
    console.log('Daily Prayers Columns:', res.rows);

    const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'master_prayer_readings';
    `);
    console.log('Prayer Readings Columns:', res2.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkSchema();

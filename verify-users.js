const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query(
      "UPDATE users SET is_verified = true, password_hash = 'pass123' WHERE email IN ('ali@hikmah.com', 'admin@hikmah.com')"
    );
    console.log('Rows updated:', res.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

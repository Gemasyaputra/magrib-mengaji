const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const listSql = `
      SELECT 
        m.id, 
        m.name, 
        m.address,
        m.is_approved,
        COALESCE(s.santri_count, 0) as santri_count,
        COALESCE(u.guru_count, 0) as guru_count
      FROM mosques m
      LEFT JOIN (
        SELECT mosque_id, COUNT(*) as santri_count FROM students GROUP BY mosque_id
      ) s ON m.id = s.mosque_id
      LEFT JOIN (
        SELECT mosque_id, COUNT(*) as guru_count FROM users WHERE role = 'teacher' GROUP BY mosque_id
      ) u ON m.id = u.mosque_id
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(listSql);
    console.log("SUCCESS:", JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    pool.end();
  }
}

main();

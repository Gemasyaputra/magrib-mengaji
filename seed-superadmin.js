const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const check = await pool.query("SELECT * FROM users WHERE role = 'superadmin' LIMIT 1");
    if (check.rows.length > 0) {
      console.log('Super admin already exists with email: ' + check.rows[0].email);
      await pool.query("UPDATE users SET password_hash = 'admin123', is_verified = true WHERE id = $1", [check.rows[0].id]);
      console.log('Password reset to admin123');
      process.exit(0);
    }

    let mId;
    const existingMosque = await pool.query("SELECT id FROM mosques WHERE slug = 'pusat-admin'");
    if (existingMosque.rows.length > 0) {
       mId = existingMosque.rows[0].id;
    } else {
       const m = await pool.query("INSERT INTO mosques (name, slug, address, is_approved) VALUES ('Pusat', 'pusat-admin', 'HQ', true) RETURNING id");
       mId = m.rows[0].id;
    }

    await pool.query("INSERT INTO users (mosque_id, name, email, password_hash, role, is_verified) VALUES ($1, 'Super Admin', 'superadmin@gmail.com', 'admin123', 'superadmin', true)", [mId]);
    console.log('Super admin created! Email: superadmin@gmail.com | Password: admin123');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

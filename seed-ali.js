const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    // Drop the unique constraint on email if we are making dummy accounts? No, let's just use unique emails.
    const mosqueSlug = 'al-hikmah-1';
    let mId;
    
    // Check if Mosque exists
    const existingMosque = await pool.query("SELECT id FROM mosques WHERE slug = $1", [mosqueSlug]);
    if (existingMosque.rows.length > 0) {
       mId = existingMosque.rows[0].id;
    } else {
       const m = await pool.query("INSERT INTO mosques (name, slug, address, is_approved) VALUES ('Masjid Al-Hikmah', $1, 'Jalan Kebenaran No. 1', true) RETURNING id", [mosqueSlug]);
       mId = m.rows[0].id;
    }

    // 1. Create Admin DKM Account
    const adminEmail = 'admin.ali@gmail.com';
    const existingAdmin = await pool.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.rows.length === 0) {
        await pool.query(
            "INSERT INTO users (mosque_id, name, email, password_hash, role, is_verified) VALUES ($1, 'Ustadz Ali (Admin DKM)', $2, 'password123', 'admin', true)", 
            [mId, adminEmail]
        );
        console.log(`Admin DKM created! Email: ${adminEmail} | Password: password123`);
    } else {
        await pool.query("UPDATE users SET password_hash = 'password123', is_verified = true WHERE email = $1", [adminEmail]);
         console.log(`Admin DKM reset! Email: ${adminEmail} | Password: password123`);
    }

    // 2. Create Teacher Account
    const teacherEmail = 'guru.ali@gmail.com';
    const existingTeacher = await pool.query("SELECT id FROM users WHERE email = $1", [teacherEmail]);
    if (existingTeacher.rows.length === 0) {
        await pool.query(
            "INSERT INTO users (mosque_id, name, email, password_hash, role, is_verified) VALUES ($1, 'Ustadz Ali (Pengajar)', $2, 'password123', 'teacher', true)", 
            [mId, teacherEmail]
        );
        console.log(`Teacher created! Email: ${teacherEmail} | Password: password123`);
    } else {
         await pool.query("UPDATE users SET password_hash = 'password123', is_verified = true WHERE email = $1", [teacherEmail]);
         console.log(`Teacher reset! Email: ${teacherEmail} | Password: password123`);
    }

  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

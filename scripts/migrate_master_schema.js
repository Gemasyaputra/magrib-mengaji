const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Dropping old tables...');
    await pool.query('DROP TABLE IF EXISTS master_daily_prayers');
    await pool.query('DROP TABLE IF EXISTS master_prayer_readings');

    console.log('Creating master_daily_prayers...');
    await pool.query(`
      CREATE TABLE master_daily_prayers (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(50),
        arabic_text TEXT,
        latin_text TEXT,
        translation TEXT
      );
    `);

    console.log('Creating master_prayer_readings...');
    await pool.query(`
      CREATE TABLE master_prayer_readings (
        id BIGSERIAL PRIMARY KEY,
        step_order INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(50),
        arabic_text TEXT,
        translation TEXT
      );
    `);

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}

migrate();

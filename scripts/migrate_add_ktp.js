const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting migration to add KTP columns...');
    const client = await pool.connect();

    try {
      console.log('Executing ALTER TABLE users...');
      
      const alterQuery = `
        ALTER TABLE users 
        DROP COLUMN IF EXISTS ktp,
        DROP COLUMN IF EXISTS berlaku_hingga,
        ADD COLUMN IF NOT EXISTS nik VARCHAR(50),
        ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100),
        ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
        ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20),
        ADD COLUMN IF NOT EXISTS golongan_darah VARCHAR(5),
        ADD COLUMN IF NOT EXISTS alamat TEXT,
        ADD COLUMN IF NOT EXISTS rt_rw VARCHAR(20),
        ADD COLUMN IF NOT EXISTS kel_desa VARCHAR(100),
        ADD COLUMN IF NOT EXISTS kecamatan VARCHAR(100),
        ADD COLUMN IF NOT EXISTS agama VARCHAR(50),
        ADD COLUMN IF NOT EXISTS status_perkawinan VARCHAR(50),
        ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(100),
        ADD COLUMN IF NOT EXISTS kewarganegaraan VARCHAR(50);
      `;
      
      await client.query(alterQuery);
      console.log('Migration completed successfully: KTP columns added.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

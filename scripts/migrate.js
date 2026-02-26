const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local (Next.js style)
const dotenv = require('dotenv');

// Load environment variables from .env.local first, then .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting database migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate.sql'),
      'utf-8',
    );

    const client = await pool.connect();

    try {
      console.log('Executing migration SQL...');
      await client.query(migrationSQL);
      console.log('Migration completed successfully!');
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

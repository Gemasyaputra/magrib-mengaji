const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
// Load environment variables from .env.local first, then .env
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrate_comments.sql'), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log('Migration comments completed!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

runMigration();

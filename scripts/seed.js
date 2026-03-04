const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function runSeed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting database seeding...');

    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed.sql'),
      'utf-8',
    );

    const client = await pool.connect();

    try {
      console.log('Executing seed SQL...');
      await client.query(seedSQL);
      console.log('Seed data inserted successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();


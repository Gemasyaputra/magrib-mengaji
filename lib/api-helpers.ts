import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: (string | number | boolean | null)[]) {
  try {
    const result = await pool.query(text, params);
    return { success: true, data: result.rows, error: null };
  } catch (error: any) {
    console.error('Database error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

export async function queryOne(text: string, params?: (string | number | boolean | null)[]) {
  const result = await query(text, params);
  return result.success && result.data ? result.data[0] : null;
}

export async function execute(text: string, params?: (string | number | boolean | null)[]) {
  try {
    await pool.query(text, params);
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Database error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function executeReturning(text: string, params?: (string | number | boolean | null)[]) {
  try {
    const result = await pool.query(text, params);
    return { success: true, data: result.rows[0] ?? null, error: null };
  } catch (error: any) {
    console.error('Database error:', error.message);
    return { success: false, data: null, error: error.message };
  }
}

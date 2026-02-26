import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/api-helpers';

// Auto-create table if not exists
async function ensureTable() {
  await execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          SERIAL PRIMARY KEY,
      mosque_id   INTEGER NOT NULL,
      user_id     INTEGER,
      type        TEXT NOT NULL DEFAULT 'system',
      message     TEXT NOT NULL,
      is_read     BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `, []);
  await execute(`CREATE INDEX IF NOT EXISTS idx_notif_mosque ON notifications(mosque_id)`, []);
}

export async function GET(req: NextRequest) {
  await ensureTable();
  const { searchParams } = new URL(req.url);
  const mosqueId = searchParams.get('mosque_id');
  const userId = searchParams.get('user_id');
  const limit = searchParams.get('limit') || '20';

  if (!mosqueId) {
    return NextResponse.json({ success: false, error: 'mosque_id required' }, { status: 400 });
  }

  try {
    const params: (string | number)[] = [mosqueId];
    let sql = `
      SELECT * FROM notifications
      WHERE mosque_id = $1
    `;

    // Filter: tampilkan notifikasi milik user ini ATAU broadcast (user_id IS NULL)
    if (userId) {
      sql += ` AND (user_id = $2 OR user_id IS NULL)`;
      params.push(userId);
    } else {
      sql += ` AND user_id IS NULL`;
    }

    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)}`;

    const result = await query(sql, params);
    return NextResponse.json({ success: true, data: result.data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: mark notifications as read
export async function PATCH(req: NextRequest) {
  await ensureTable();
  try {
    const body = await req.json();
    const { ids } = body; // array of notification IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: 'ids array required' }, { status: 400 });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    await execute(
      `UPDATE notifications SET is_read = TRUE WHERE id IN (${placeholders})`,
      ids
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper: create a notification (used by other API routes)
export async function createNotification({
  mosque_id,
  user_id = null,
  type = 'system',
  message,
}: {
  mosque_id: number;
  user_id?: number | null;
  type?: string;
  message: string;
}) {
  try {
    await ensureTable();
    await execute(
      `INSERT INTO notifications (mosque_id, user_id, type, message) VALUES ($1, $2, $3, $4)`,
      [mosque_id, user_id, type, message]
    );
  } catch (err) {
    // Non-fatal — don't block the main save
    console.error('createNotification error:', err);
  }
}

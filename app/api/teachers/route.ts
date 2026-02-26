import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mosqueId = searchParams.get('mosque_id');

  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.mosque_id, m.name as mosque_name 
    FROM users u
    LEFT JOIN mosques m ON u.mosque_id = m.id
    WHERE u.role = 'teacher'
  `;
  const params: (string | number)[] = [];

  if (mosqueId) {
    sql += ` AND u.mosque_id = $${params.length + 1}`;
    params.push(mosqueId);
  }

  sql += ' ORDER BY u.name ASC';

  try {
    const result = await query(sql, params);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, mosque_id, password } = body;

    if (!name || !email || !mosque_id) {
        return NextResponse.json({ success: false, error: 'Name, Email, and Mosque ID are required' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.success && Array.isArray(existing.data) && existing.data.length > 0) {
        return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 });
    }

    // Default password if not provided
    const passwordHash = password || 'teacher123'; 

    const result = await execute(
        `INSERT INTO users (name, email, phone, role, mosque_id, password_hash, is_verified, created_at)
         VALUES ($1, $2, $3, 'teacher', $4, $5, true, NOW())`,
        [name, email, phone || null, mosque_id, passwordHash]
    );

    return NextResponse.json(result, { status: result.success ? 201 : 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, email, phone } = body;

        if (!id) {
             return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }

        const result = await execute(
            `UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 AND role = 'teacher'`,
            [name, email, phone, id]
        );

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }

    try {
        const result = await execute("DELETE FROM users WHERE id = $1 AND role = 'teacher'", [id]);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

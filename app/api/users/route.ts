import { NextRequest, NextResponse } from 'next/server';
import { query, executeReturning, execute } from '@/lib/api-helpers';

// GET: List Users (Admin DKM for a specific mosque)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mosque_id = searchParams.get('mosque_id');
  const role = searchParams.get('role'); // e.g., 'admin'

  if (!mosque_id && role !== 'superadmin') {
    return NextResponse.json({ success: false, error: "Mosque ID is required for non-superadmin roles" }, { status: 400 });
  }

  try {
    let sql: string;
    const params: any[] = [];

    if (role === 'superadmin') {
       sql = 'SELECT id, name, email, phone, role, created_at FROM users WHERE role = $1 ORDER BY created_at DESC';
       params.push('superadmin');
    } else {
       sql = 'SELECT id, name, email, phone, role, created_at FROM users WHERE mosque_id = $1';
       params.push(mosque_id);
       if (role) {
         sql += ' AND role = $2';
         params.push(role);
       }
       sql += ' ORDER BY created_at DESC';
    }

    const result = await query(sql, params);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create New User (Admin DKM)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mosque_id, name, email, password, role = 'admin' } = body;

    let targetMosqueId: number;
    let password_hash: string;

    if (role === 'superadmin') {
      if (!name || !email) {
        return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
      }
      // Super admins don't need a real mosque_id or password since they use Google SSO
      targetMosqueId = 1;
      password_hash = 'OAUTH_ACCOUNT_NO_PASSWORD';
    } else {
      if (!mosque_id || !name || !email || !password) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }
      targetMosqueId = mosque_id;
      password_hash = password;
    }

    const result = await executeReturning(
      `INSERT INTO users (mosque_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [targetMosqueId, name, email, password_hash, role]
    );

    if (!result.success) {
      // Check for duplicate email
      if (result.error?.includes('unique constraint') || result.error?.includes('duplicate key')) {
          return NextResponse.json({ success: false, error: "Email already exists" }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update User (Reset Password or Edit Profile)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, password } = body;

    if (!id) {
       return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    let sql = 'UPDATE users SET ';
    const params: any[] = [];
    const updates: string[] = [];
    let idx = 1;

    if (name) {
        updates.push(`name = $${idx++}`);
        params.push(name);
    }
    if (email) {
        updates.push(`email = $${idx++}`);
        params.push(email);
    }
    if (password) {
        updates.push(`password_hash = $${idx++}`);
        params.push(password); // Again, storing plain/simple for demo
    }

    if (updates.length === 0) {
        return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    sql += updates.join(', ') + ` WHERE id = $${idx} RETURNING id, name, email`;
    params.push(id);

    const result = await executeReturning(sql, params);

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove User
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const caller_id = searchParams.get('caller_id'); // Optional: pass caller ID to prevent self-deletion

  if (!id) {
    return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
  }

  // Self-deletion check (additional layer in the API)
  if (caller_id && id === caller_id) {
    return NextResponse.json({ success: false, error: "Anda tidak dapat menghapus akun Anda sendiri." }, { status: 400 });
  }

  try {
    const result = await execute('DELETE FROM users WHERE id = $1', [id]);
    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

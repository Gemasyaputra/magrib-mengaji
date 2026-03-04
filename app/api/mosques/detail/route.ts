import { NextRequest, NextResponse } from 'next/server';
import { query, executeReturning } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
  }

  try {
    const mosqueSql = `SELECT * FROM mosques WHERE id = $1`;
    const mosqueResult = await query(mosqueSql, [id]);

    if (!mosqueResult.success || !mosqueResult.data || mosqueResult.data.length === 0) {
       return NextResponse.json({ success: false, error: "Mosque not found" }, { status: 404 });
    }

    const mosque = mosqueResult.data[0];

    // Get Counts
    const santriSql = `SELECT COUNT(*) as count FROM students s JOIN study_groups sg ON s.group_id = sg.id WHERE sg.mosque_id = $1`;
    const guruSql = `SELECT COUNT(*) as count FROM users WHERE mosque_id = $1 AND role = 'teacher'`;
    
    const [santriRes, guruRes] = await Promise.all([
        query(santriSql, [id]),
        query(guruSql, [id])
    ]);

    const santriCount = santriRes.success && santriRes.data && santriRes.data.length > 0 ? santriRes.data[0].count : 0;
    const guruCount = guruRes.success && guruRes.data && guruRes.data.length > 0 ? guruRes.data[0].count : 0;

    return NextResponse.json({ 
        success: true, 
        data: { ...mosque, santri_count: santriCount, guru_count: guruCount } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, address, contact_phone } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: "ID and Name are required" }, { status: 400 });
    }

    const result = await executeReturning(
      `UPDATE mosques SET name = $1, address = $2, contact_phone = $3 WHERE id = $4 RETURNING *`,
      [name, address || null, contact_phone || null, id]
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { query, executeReturning } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const listSql = `
      SELECT 
        m.id, 
        m.name, 
        m.address,
        m.is_approved,
        COALESCE(s.santri_count, 0) as santri_count,
        COALESCE(u.guru_count, 0) as guru_count
      FROM mosques m
      LEFT JOIN (
        SELECT mosque_id, COUNT(*) as santri_count FROM students GROUP BY mosque_id
      ) s ON m.id = s.mosque_id
      LEFT JOIN (
        SELECT mosque_id, COUNT(*) as guru_count FROM users WHERE role = 'teacher' GROUP BY mosque_id
      ) u ON m.id = u.mosque_id
      ORDER BY m.created_at DESC
    `;
    const result = await query(listSql);
    
    // Fallback if santri count logic is complex due to group linkage, 
    // for now we assume students are linked via groups which are linked to mosque via teacher or direct mosque_id in groups?
    // Wait, study_groups has mosque_id? Let's check schema assumption.
    // If study_groups table has mosque_id, the above query works.
    // If not, we might need to join via teachers.
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, contact_phone } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

    const result = await executeReturning(
      `INSERT INTO mosques (name, slug, address, contact_phone, is_approved) VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [name, slug, address || null, contact_phone || null]
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const deleteSql = `DELETE FROM mosques WHERE id = $1 RETURNING id`;
    const result = await executeReturning(deleteSql, [id]);

    if (!result.success) {
      if (result.error && result.error.includes('violates foreign key constraint')) {
        return NextResponse.json({ success: false, error: 'Gagal menghapus: Masjid masih memiliki data terkait (Santri/Guru/Kelompok).' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    if (result.data.length === 0) {
      return NextResponse.json({ success: false, error: 'Masjid tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Masjid berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

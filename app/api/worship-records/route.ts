import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/api-helpers';
import { createNotification } from '@/app/api/notifications/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
        student_id, 
        teacher_id, 
        date, 
        type, 
        daily_prayer_id, 
        prayer_reading_id, 
        is_completed, 
        quality 
    } = body;

    if (!student_id || !teacher_id || !type || !quality) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'DOA_HARIAN' && !daily_prayer_id) {
         return NextResponse.json({ success: false, error: 'daily_prayer_id required for DOA_HARIAN' }, { status: 400 });
    }
    if (type === 'BACAAN_SHOLAT' && !prayer_reading_id) {
         return NextResponse.json({ success: false, error: 'prayer_reading_id required for BACAAN_SHOLAT' }, { status: 400 });
    }

    const result = await execute(
      `INSERT INTO worship_records (
          student_id, teacher_id, date, type, 
          daily_prayer_id, prayer_reading_id, 
          is_completed, quality
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
          student_id, 
          teacher_id, 
          date || new Date().toLocaleDateString('en-CA'), 
          type, 
          daily_prayer_id || null, 
          prayer_reading_id || null, 
          is_completed || false, 
          quality
      ]
    );

    if (result.success) {
      try {
        const infoResult = await query(`
          SELECT st.name as student_name, u.name as teacher_name, st.mosque_id,
                 mdp.title as prayer_title, mpr.title as reading_title
          FROM students st
          JOIN users u ON u.id = $2
          LEFT JOIN master_daily_prayers mdp ON mdp.id = $3
          LEFT JOIN master_prayer_readings mpr ON mpr.id = $4
          WHERE st.id = $1 LIMIT 1
        `, [student_id, teacher_id, daily_prayer_id || null, prayer_reading_id || null]);

        if (infoResult.data && infoResult.data.length > 0) {
          const { student_name, teacher_name, mosque_id, prayer_title, reading_title } = infoResult.data[0];
          const itemName = type === 'DOA_HARIAN' ? (prayer_title || 'Doa Harian') : (reading_title || 'Bacaan Sholat');
          const status = is_completed ? 'Lulus' : 'Belum Lulus';
          await createNotification({
            mosque_id,
            type: 'worship',
            message: `Hafalan ${student_name}: ${itemName} — ${status} (Nilai ${quality}) oleh ${teacher_name}`
          });
        }
      } catch (e) { console.error('notif error:', e); }
    }

    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');
    const limit = searchParams.get('limit') || '20';
    const groupStudentIds = searchParams.get('group_student_ids');
    const date = searchParams.get('date');

    let sql = `
      SELECT wr.*, 
             u.name as teacher_name,
             mdp.title as daily_prayer_title,
             mpr.title as prayer_reading_title
      FROM worship_records wr
      LEFT JOIN users u ON wr.teacher_id = u.id
      LEFT JOIN master_daily_prayers mdp ON wr.daily_prayer_id = mdp.id
      LEFT JOIN master_prayer_readings mpr ON wr.prayer_reading_id = mpr.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
  
    if (studentId) {
      sql += ` AND wr.student_id = $${params.length + 1}`;
      params.push(studentId);
    }

    // Support fetching today's records for multiple students in a group
    if (groupStudentIds) {
      const ids = groupStudentIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const placeholders = ids.map((_, i) => `$${params.length + i + 1}`).join(', ');
        sql += ` AND wr.student_id IN (${placeholders})`;
        params.push(...ids);
      }
    }

    // Filter by specific date (for today's indicator)
    if (date) {
      sql += ` AND wr.date::date = $${params.length + 1}::date`;
      params.push(date);
    }
  
    sql += ` ORDER BY wr.date DESC, wr.created_at DESC LIMIT ${groupStudentIds ? 999 : limit}`;
  
    try {
      const result = await query(sql, params);
      const data = (result.data ?? []).map((r: any) => ({
        ...r,
        date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toLocaleDateString('en-CA')) : null
      }));
      return NextResponse.json({ success: result.success, data });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

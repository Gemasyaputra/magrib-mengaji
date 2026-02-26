
import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/api-helpers';
import { createNotification } from '@/app/api/notifications/route';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  const type = searchParams.get('type');
  const limit = searchParams.get('limit') || '20';
  const groupStudentIds = searchParams.get('group_student_ids'); // comma-separated student IDs
  const date = searchParams.get('date'); // YYYY-MM-DD — filter by specific date

  let sql = `
    SELECT lr.*, u.name as teacher_name 
    FROM learning_records lr
    LEFT JOIN users u ON lr.teacher_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (studentId) {
    sql += ` AND lr.student_id = $${params.length + 1}`;
    params.push(studentId);
  }

  // Support fetching today's records for multiple students in a group
  if (groupStudentIds) {
    const ids = groupStudentIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${params.length + i + 1}`).join(', ');
      sql += ` AND lr.student_id IN (${placeholders})`;
      params.push(...ids);
    }
  }

  if (type) {
    sql += ` AND lr.type = $${params.length + 1}`;
    params.push(type);
  }

  // Filter by specific date (for today's submissions indicator)
  if (date) {
    sql += ` AND lr.date::date = $${params.length + 1}::date`;
    params.push(date);
  }

  sql += ` ORDER BY lr.date DESC, lr.created_at DESC LIMIT ${groupStudentIds ? 999 : limit}`;

  try {
    const result = await query(sql, params);
    // Re-format dates to plain string to avoid timezone shift
    const data = (result.data ?? []).map((r: any) => ({
      ...r,
      date: r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toLocaleDateString('en-CA')) : null
    }));
    return NextResponse.json({ success: result.success, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
        student_id, 
        teacher_id, 
        date, 
        type, 
        level_or_surah, 
        start_point, 
        end_point, 
        quality, 
        notes 
    } = body;

    if (!student_id || !teacher_id || !type || !level_or_surah || !quality) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await execute(
      `INSERT INTO learning_records (
          student_id, teacher_id, date, type, 
          level_or_surah, start_point, end_point, 
          quality, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
          student_id, 
          teacher_id, 
          date || new Date().toLocaleDateString('en-CA'), 
          type, 
          level_or_surah, 
          start_point, 
          end_point, 
          quality, 
          notes || null
      ]
    );

    if (result.success) {
      // Fire notification (non-fatal)
      try {
        const infoResult = await query(`
          SELECT st.name as student_name, u.name as teacher_name, st.mosque_id
          FROM students st
          JOIN users u ON u.id = $2
          WHERE st.id = $1 LIMIT 1
        `, [student_id, teacher_id]);

        if (infoResult.data && infoResult.data.length > 0) {
          const { student_name, teacher_name, mosque_id } = infoResult.data[0];
          const halStr = start_point && end_point ? ` · Hal ${start_point}–${end_point}` : '';
          await createNotification({
            mosque_id,
            type: 'learning',
            message: `Setoran ${student_name}: ${level_or_surah}${halStr} (Nilai ${quality}) — oleh ${teacher_name}`
          });
        }
      } catch (e) { console.error('notif error:', e); }
    }

    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, level_or_surah, start_point, end_point, quality, notes } = body;
        
        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        const result = await execute(
            `UPDATE learning_records SET 
                level_or_surah = COALESCE($1, level_or_surah),
                start_point = COALESCE($2, start_point),
                end_point = COALESCE($3, end_point),
                quality = COALESCE($4, quality),
                notes = COALESCE($5, notes)
             WHERE id = $6`,
            [level_or_surah, start_point, end_point, quality, notes, id]
        );
        
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    try {
        const result = await execute('DELETE FROM learning_records WHERE id = $1', [id]);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

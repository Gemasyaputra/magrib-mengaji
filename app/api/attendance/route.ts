import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/api-helpers';
import { createNotification } from '@/app/api/notifications/route';


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  const date = searchParams.get('date');
  const groupId = searchParams.get('group_id');
  const month = searchParams.get('month'); // YYYY-MM
  const history = searchParams.get('history'); // true/false
  const chart = searchParams.get('chart'); // true/false

  try {
    // 0. Get Chart Data (Monthly attendance for last 6 months)
    if (chart === 'true' && studentId) {
        // Generate last 6 months list
        const result = await query(
            `SELECT 
                TO_CHAR(date::DATE, 'YYYY-MM') as month,
                TO_CHAR(date::DATE, 'Mon') as month_label,
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) as total_present
             FROM attendance
             WHERE student_id = $1
             AND date::DATE >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
             GROUP BY TO_CHAR(date::DATE, 'YYYY-MM'), TO_CHAR(date::DATE, 'Mon')
             ORDER BY month ASC`,
            [studentId]
        );
        return NextResponse.json({ success: result.success, data: result.data ?? [] });
    }

    // 1. Get History Summary (grouped by date and group)
    if (history === 'true') {
        const mosqueId = searchParams.get('mosque_id');
        const teacherId = searchParams.get('teacher_id');
        
        let sql = `
            SELECT 
                TO_CHAR(a.date, 'YYYY-MM-DD') as date,
                COUNT(a.id) as total_attendance,
                SUM(CASE WHEN a.status = 'HADIR' THEN 1 ELSE 0 END) as total_hadir,
                MAX(g.name) as group_name,
                MAX(u.name) as teacher_name,
                s.group_id
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            LEFT JOIN study_groups g ON s.group_id = g.id
            LEFT JOIN users u ON a.teacher_id = u.id
            WHERE 1=1
        `;
        const params: (string | number)[] = [];
        let idx = 1;

        if (mosqueId) {
            sql += ` AND s.mosque_id = $${idx}`;
            params.push(mosqueId);
            idx++;
        }
        
        if (teacherId) {
            sql += ` AND a.teacher_id = $${idx}`;
            params.push(teacherId);
            idx++;
        }
        
        sql += ` GROUP BY a.date, s.group_id, a.teacher_id ORDER BY a.date DESC LIMIT 30`;
        
        const result = await query(sql, params);
        return NextResponse.json({ success: result.success, data: result.data ?? [] });
    }
    
    // 2. Get Detail for specific date and group (or just date)
    if (date) {
         let sql = `
            SELECT 
                a.id, a.student_id, a.teacher_id,
                TO_CHAR(a.date, 'YYYY-MM-DD') as date,
                a.status, a.notes, a.created_at,
                s.name as student_name,
                s.group_id,
                g.name as group_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            LEFT JOIN study_groups g ON s.group_id = g.id
            WHERE a.date::date = $1::date
        `;
        const params: (string | number)[] = [date];
        
        if (groupId) {
             sql += ` AND s.group_id = $2`;
             params.push(groupId);
        }
        
        sql += ` ORDER BY s.name ASC`;
        const result = await query(sql, params);
        return NextResponse.json({ success: result.success, data: result.data ?? [] });
    }

    // 3. Filter by Student ID (e.g. for Profile History)
    if (studentId) {
        let sql = `
            SELECT 
                a.id, a.student_id, a.teacher_id,
                TO_CHAR(a.date, 'YYYY-MM-DD') as date,
                a.status, a.notes, a.created_at,
                s.name as student_name,
                g.name as group_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            LEFT JOIN study_groups g ON s.group_id = g.id
            WHERE a.student_id = $1
            ORDER BY a.date DESC LIMIT 50
        `;
        const result = await query(sql, [studentId]);
        return NextResponse.json({ success: result.success, data: result.data ?? [] });
    }

    // Default: list all (maybe limit)
    const result = await query('SELECT * FROM attendance ORDER BY date DESC LIMIT 100');
    return NextResponse.json({ success: result.success, data: result.data ?? [] });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
      const body = await req.json();
      // Expecting array of attendance records or single object? 
      // Plan implies bulk save or single. Let's support bulk for efficiency.
      // But body structure from previous file was single. I will support array to save all students at once.
      
      const records = Array.isArray(body) ? body : [body];
      
      if (records.length === 0) {
          return NextResponse.json({ success: false, error: "No data" }, { status: 400 });
      }

      // Check for first record to validate fields
      if (!records[0].student_id || !records[0].teacher_id || !records[0].status) {
           return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }
      
      // We'll use a transaction ideally, but for now loop inserts or construct multi-value insert
      // Construct multi-value insert
      // INSERT INTO attendance (student_id, teacher_id, date, status, notes) VALUES ...
      
      // CAUTION: Conflict handling. If record exists for student+date, update it?
      // Schema doesn't have unique constraint on student_id + date explicitly shown in previous view, 
      // but logically it should be unique.
      // Let's assume we delete existing for that date/student combination first or use ON CONFLICT if constraint exists.
      // I'll check constraint later. For now, let's just insert. 
      // actually, to avoid dupes, deleting first for these students on this date is safer if we are re-submitting.
      
      const date = records[0].date || new Date().toISOString().split('T')[0];
      const studentIds = records.map((r: any) => r.student_id).join(',');
      
      // creating placeholders
      // const values = records.map((r, i) => `($${i*5+1}, $${i*5+2}, $${i*5+3}, $${i*5+4}, $${i*5+5})`).join(',');
      // This might get too large.
      
      // Let's do a simple loop for now, it's safer/easier to debug.
      let successCount = 0;
      
      for (const r of records) {
        await execute('DELETE FROM attendance WHERE student_id = $1 AND date::date = $2::date', [r.student_id, r.date]);
        await execute(
            `INSERT INTO attendance (student_id, teacher_id, date, status, notes)
             VALUES ($1, $2, $3, $4, $5)`,
            [r.student_id, r.teacher_id, r.date, r.status, r.notes || null]
        );
        successCount++;
      }

      // Fire notification (non-blocking) after successful bulk save
      try {
        const teacherId = records[0].teacher_id;
        const dateStr = records[0].date || new Date().toLocaleDateString('en-CA');

        // Fetch teacher name, group name, mosque_id via first student
        const infoResult = await query(`
          SELECT u.name as teacher_name, g.name as group_name, s.mosque_id
          FROM users u
          JOIN students s ON s.id = $2
          LEFT JOIN study_groups g ON g.id = s.group_id
          WHERE u.id = $1
          LIMIT 1
        `, [teacherId, records[0].student_id]);

        if (infoResult.data && infoResult.data.length > 0) {
          const { teacher_name, group_name, mosque_id } = infoResult.data[0];
          const hadirCount = records.filter((r: any) => r.status === 'HADIR').length;
          const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

          await createNotification({
            mosque_id,
            type: 'attendance',
            message: `Presensi ${group_name || 'kelompok'} tgl ${formattedDate} tersimpan — ${hadirCount}/${records.length} hadir (oleh ${teacher_name || 'Guru'})`
          });
        }
      } catch (notifErr) {
        console.error('Notification trigger error:', notifErr);
      }

      return NextResponse.json({ success: true, count: successCount }, { status: 201 });

      
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

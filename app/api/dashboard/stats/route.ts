import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mosqueId = searchParams.get('mosque_id');
  const teacherId = searchParams.get('teacher_id');

  if (!mosqueId) {
       return NextResponse.json({ success: false, error: 'Mosque ID required' }, { status: 400 });
  }

  try {
    let santriQuery = 'SELECT COUNT(*) as count FROM students WHERE mosque_id = $1';
    let santriParams: any[] = [mosqueId];
    
    let presentQuery = `
         SELECT COUNT(*) as count 
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         WHERE s.mosque_id = $1 
           AND a.date = CURRENT_DATE 
           AND a.status = 'HADIR'
    `;
    let presentParams: any[] = [mosqueId];

    if (teacherId) {
      santriQuery = `
        SELECT COUNT(s.*) as count 
        FROM students s
        JOIN study_groups g ON s.group_id = g.id
        WHERE s.mosque_id = $1 AND g.teacher_id = $2
      `;
      santriParams.push(teacherId);

      presentQuery = `
         SELECT COUNT(a.*) as count 
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         JOIN study_groups g ON s.group_id = g.id
         WHERE s.mosque_id = $1 
           AND g.teacher_id = $2
           AND a.date = CURRENT_DATE 
           AND a.status = 'HADIR'
      `;
      presentParams.push(teacherId);
    }

    // Run all queries in parallel using Promise.all to improve loading speed
    const [totalSantriResult, presentTodayResult, mosqueResult] = await Promise.all([
      // Count Total Santri
      query(santriQuery, santriParams),
      
      // Count Present Today — JOIN through students to filter by mosque
      query(presentQuery, presentParams),
           
      // Get Mosque Name
      query('SELECT name FROM mosques WHERE id = $1', [mosqueId])
    ]);

    const totalSantri = totalSantriResult.success && totalSantriResult.data && totalSantriResult.data.length > 0 
        ? Number(totalSantriResult.data[0].count) 
        : 0;

    const presentToday = presentTodayResult.success && presentTodayResult.data && presentTodayResult.data.length > 0 
        ? Number(presentTodayResult.data[0].count) 
        : 0;

    const mosqueName = mosqueResult.success && mosqueResult.data && mosqueResult.data.length > 0
        ? mosqueResult.data[0].name
        : 'Masjid Anda';

    return NextResponse.json({
        success: true,
        data: {
            total_santri: totalSantri,
            present_today: presentToday,
            mosque_name: mosqueName
        }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

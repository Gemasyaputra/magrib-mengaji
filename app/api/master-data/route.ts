import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'daily-prayers' or 'prayer-readings'

  try {
    let sql = '';
    let result;

    if (type === 'daily-prayers') {
      sql = 'SELECT * FROM master_daily_prayers ORDER BY title ASC';
      result = await query(sql);
    } else if (type === 'prayer-readings') {
      sql = 'SELECT * FROM master_prayer_readings ORDER BY step_order ASC, title ASC';
      result = await query(sql);
    } else {
        return NextResponse.json({ success: false, error: 'Invalid type parameter' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

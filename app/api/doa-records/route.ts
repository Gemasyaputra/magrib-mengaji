import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');

  let sql = 'SELECT * FROM doa_records WHERE 1=1';
  const params: (string | number)[] = [];

  if (studentId) {
    sql += ` AND student_id = $${params.length + 1}`;
    params.push(studentId);
  }

  sql += ' ORDER BY record_date DESC';

  const result = await query(sql, params);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, doa_id, category, completion_status, notes } = body;

  const result = await execute(
    `INSERT INTO doa_records (student_id, doa_id, category, completion_status, notes, record_date, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())`,
    [student_id, doa_id, category, completion_status, notes]
  );

  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, completion_status, notes } = body;

  const result = await execute(
    'UPDATE doa_records SET completion_status = $1, notes = $2, updated_at = NOW() WHERE id = $3',
    [completion_status, notes, id]
  );

  return NextResponse.json(result);
}

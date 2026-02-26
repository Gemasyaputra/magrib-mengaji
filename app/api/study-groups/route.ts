import { NextRequest, NextResponse } from 'next/server';
import { query, executeReturning, execute } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mosque_id, teacher_id, name, description } = body;

    if (!mosque_id || !name) {
      return NextResponse.json(
        { success: false, error: 'Mosque ID and Name are required' },
        { status: 400 },
      );
    }

    const result = await executeReturning(
      `INSERT INTO study_groups (mosque_id, teacher_id, name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [mosque_id, teacher_id || null, name, description || null],
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mosqueId = searchParams.get('mosque_id');
  const teacherId = searchParams.get('teacher_id');

  let sql = `
    SELECT sg.id, sg.mosque_id, sg.teacher_id, sg.name, sg.description, u.name as teacher_name
    FROM study_groups sg
    LEFT JOIN users u ON sg.teacher_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let idx = 1;

  if (mosqueId) {
    sql += ` AND sg.mosque_id = $${idx}`;
    params.push(mosqueId);
    idx++;
  }
  
  if (teacherId) {
    sql += ` AND sg.teacher_id = $${idx}`;
    params.push(teacherId);
    idx++;
  }

  sql += ' ORDER BY sg.name ASC';

  const result = await query(sql, params);
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, mosque_id, teacher_id, name, description } = body;

    if (!id || !mosque_id || !name) {
      return NextResponse.json(
        { success: false, error: 'ID, Mosque ID, and Name are required' },
        { status: 400 },
      );
    }

    const result = await executeReturning(
      `UPDATE study_groups 
       SET mosque_id = $1, teacher_id = $2, name = $3, description = $4
       WHERE id = $5
       RETURNING *`,
      [mosque_id, teacher_id || null, name, description || null, id],
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: 'Study group not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'ID is required' },
      { status: 400 },
    );
  }

  const result = await execute('DELETE FROM study_groups WHERE id = $1', [id]);
  return NextResponse.json(result);
}

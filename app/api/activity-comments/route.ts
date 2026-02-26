import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('post_id');

  if (!postId) {
    return NextResponse.json({ success: false, error: 'post_id required' }, { status: 400 });
  }

  try {
    const sql = `
      SELECT ac.*, u.name as user_name, u.role as user_role 
      FROM activity_comments ac
      LEFT JOIN users u ON ac.user_id = u.id
      WHERE ac.post_id = $1
      ORDER BY ac.created_at ASC
    `;
    const result = await query(sql, [postId]);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, user_id, parent_name, content } = body;

    if (!post_id || !content) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await execute(
      `INSERT INTO activity_comments (post_id, user_id, parent_name, content) 
       VALUES ($1, $2, $3, $4)`,
      [post_id, user_id || null, parent_name || null, content]
    );

    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

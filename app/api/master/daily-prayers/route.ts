import { NextRequest, NextResponse } from 'next/server';
import { query, executeReturning, execute } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const result = await query('SELECT * FROM master_daily_prayers ORDER BY title ASC');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, arabic_text, latin_text, translation } = body;

    if (!title) {
        return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }

    const result = await executeReturning(
        `INSERT INTO master_daily_prayers (title, category, arabic_text, latin_text, translation) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, category || null, arabic_text || null, latin_text || null, translation || null]
    );

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, category, arabic_text, latin_text, translation } = body;

    if (!id || !title) {
        return NextResponse.json({ success: false, error: "ID and Title are required" }, { status: 400 });
    }

    const result = await executeReturning(
        `UPDATE master_daily_prayers SET title = $1, category = $2, arabic_text = $3, latin_text = $4, translation = $5 WHERE id = $6 RETURNING *`,
        [title, category || null, arabic_text || null, latin_text || null, translation || null, id]
    );

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const result = await execute('DELETE FROM master_daily_prayers WHERE id = $1', [id]);

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

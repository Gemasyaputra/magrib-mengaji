import { NextRequest, NextResponse } from 'next/server';
import { query, execute, executeReturning } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mosqueId = searchParams.get('mosque_id');
  const id = searchParams.get('id');
  const limit = parseInt(searchParams.get('limit') || '5');
  const page = parseInt(searchParams.get('page') || '1');
  const offset = (page - 1) * limit;

  // Determine image limit: if fetching single post (id present), get all images. Else get 1.
  const imageLimit = '';

  // Join with users to get author name and count comments, and agg images
  let sql = `
    SELECT ap.*, u.name as author_name, 
    (SELECT COUNT(*) FROM activity_comments ac WHERE ac.post_id = ap.id) as comment_count,
    (
      SELECT COALESCE(json_agg(x.image_url), '[]'::json) 
      FROM (
        SELECT image_url 
        FROM activity_images ai 
        WHERE ai.post_id = ap.id
        ORDER BY ai.id ASC
        ${imageLimit}
      ) x
    ) as images
    FROM activity_posts ap
    LEFT JOIN users u ON ap.author_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (id) {
      sql += ` AND ap.id = $${params.length + 1}`;
      params.push(id);
  }

  if (mosqueId) {
    sql += ` AND ap.mosque_id = $${params.length + 1}`;
    params.push(mosqueId);
  }

  sql += ` ORDER BY ap.created_at DESC`;

  // Apply pagination only if NOT fetching a single post by ID
  if (!id) {
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  try {
      const result = await query(sql, params);
      return NextResponse.json(result);
  } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
      const body = await req.json();
      const { mosque_id, author_id, title, content, activity_date, images } = body;
    
      if (!title || !author_id) {
           return NextResponse.json({ success: false, error: 'Title and Author ID are required' }, { status: 400 });
      }

      // 1. Insert Post
      const postResult = await executeReturning(
        `INSERT INTO activity_posts (mosque_id, author_id, title, content, activity_date, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
        [
            mosque_id || 1, 
            author_id, 
            title, 
            content, 
            activity_date || new Date().toISOString()
        ]
      );

      if (!postResult.success || !postResult.data) {
          throw new Error(postResult.error || 'Failed to create post');
      }

      const postId = postResult.data.id;

      // 2. Insert Images if any
      if (images && Array.isArray(images) && images.length > 0) {
          for (const imgUrl of images) {
              await execute(
                  `INSERT INTO activity_images (post_id, image_url, created_at) VALUES ($1, $2, NOW())`,
                  [postId, imgUrl]
              );
          }
      }
    
      return NextResponse.json({ success: true, data: { ...postResult.data, images } }, { status: 201 });
  } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
  }

  try {
      const result = await execute('DELETE FROM activity_posts WHERE id = $1', [id]);
      return NextResponse.json(result);
  } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
      const body = await req.json();
      const { id, title, content, images } = body;
    
      if (!id || !title) {
           return NextResponse.json({ success: false, error: 'ID and Title are required' }, { status: 400 });
      }

      // 1. Update Post
      const postResult = await executeReturning(
        `UPDATE activity_posts 
         SET title = $1, content = $2
         WHERE id = $3 RETURNING *`,
        [title, content, id]
      );

      if (!postResult.success || !postResult.data) {
          throw new Error(postResult.error || 'Failed to update post');
      }

      // 2. Update Images (Delete old, Insert new)
      // First, delete existing images
      await execute('DELETE FROM activity_images WHERE post_id = $1', [id]);

      // Then insert new ones
      if (images && Array.isArray(images) && images.length > 0) {
          for (const imgUrl of images) {
              await execute(
                  `INSERT INTO activity_images (post_id, image_url, created_at) VALUES ($1, $2, NOW())`,
                  [id, imgUrl]
              );
          }
      }
    
      return NextResponse.json({ success: true, data: { ...postResult.data, images } });
  } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

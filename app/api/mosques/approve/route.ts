import { NextRequest, NextResponse } from 'next/server';
import { executeReturning } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Mosque ID is required" }, { status: 400 });
    }

    const result = await executeReturning(
      `UPDATE mosques SET is_approved = true WHERE id = $1 RETURNING id, is_approved`,
      [id]
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    if (result.data.length === 0) {
      return NextResponse.json({ success: false, error: 'Masjid tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Masjid berhasil disetujui' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

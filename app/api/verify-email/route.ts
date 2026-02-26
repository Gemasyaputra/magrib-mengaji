import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new Response(`
      <html>
        <head><title>Verifikasi Gagal</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Link Verifikasi Tidak Valid</h2>
          <p>Token tidak ditemukan.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  try {
    const userResult = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);
    
    if (userResult.length === 0) {
      return new Response(`
        <html>
          <head><title>Verifikasi Gagal</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2>Verifikasi Gagal</h2>
            <p>Token kadaluarsa atau tidak valid.</p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const user = userResult[0];

    await db.update(users)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(users.id, user.id));

    return new Response(`
      <html>
        <head>
          <title>Verifikasi Berhasil</title>
          <meta http-equiv="refresh" content="5;url=/" />
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #059669;">Verifikasi Email Berhasil!</h2>
          <p>Email pengguna <strong>${user.name}</strong> telah berhasil diverifikasi.</p>
          <p>Sekarang harap tunggu persetujuan dari Super Admin sebelum Anda bisa login.</p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">Anda akan dialihkan ke halaman utama dalam 5 detik...</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err) {
    console.error('Verify email error:', err);
    return new Response(`
      <html>
        <head><title>Error Sistem</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Terjadi Kesalahan Server</h2>
          <p>Silakan coba beberapa saat lagi.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
}

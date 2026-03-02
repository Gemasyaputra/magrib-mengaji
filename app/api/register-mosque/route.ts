import { NextRequest, NextResponse } from 'next/server';
import { executeReturning } from '@/lib/api-helpers';
import nodemailer from 'nodemailer';

// const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mosque_name, mosque_address, admin_name, admin_email } = body;

    // 1. Validation
    if (!mosque_name || !admin_name || !admin_email) {
      return NextResponse.json({ success: false, error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // 2. Insert Mosque
    const slug = mosque_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    const mosqueResult = await executeReturning(
      `INSERT INTO mosques (name, slug, address, is_approved) VALUES ($1, $2, $3, false) RETURNING id, name, is_approved`,
      [mosque_name, slug, mosque_address || null]
    );

    if (!mosqueResult.success) {
      return NextResponse.json({ success: false, error: "Gagal mendaftarkan masjid: " + mosqueResult.error }, { status: 500 });
    }

    const newMosque = mosqueResult.data;

    // 3. Insert Admin User
    // Note: Password is no longer needed as authentication is handled exclusively via Google OAuth.
    // We insert a dummy value for the legacy password_hash column to satisfy potential DB constraints.
    const password_hash = 'OAUTH_ACCOUNT_NO_PASSWORD'; 
    const vToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const userResult = await executeReturning(
      `INSERT INTO users (mosque_id, name, email, password_hash, role, is_verified, verification_token) VALUES ($1, $2, $3, $4, 'admin', false, $5) RETURNING id, name, email, role, mosque_id`,
      [newMosque.id, admin_name, admin_email, password_hash, vToken]
    );

    if (!userResult.success) {
      // Rollback would be ideal here (transaction), but for now we just report error. 
      // User creation failed, but mosque exists. Manual cleanup scenario in rigorous systems.
      return NextResponse.json({ success: false, error: "Gagal mendaftarkan admin: " + userResult.error }, { status: 500 });
    }

    const newUser = userResult.data;

    // 4. Send Verification Email via Nodemailer
    const verificationUrl = `${req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/verify-email?token=${vToken}`;

    // === FALLBACK FOR LOCAL TESTING ===
    // Always print the URL to the terminal so the developer can click it directly.
    console.log('\n\n======================================================');
    console.log('🕌 PENDAFTARAN MASJID BARU: ' + mosque_name);
    console.log('✅ LINK VERIFIKASI EMAIL:');
    console.log(verificationUrl);
    console.log('======================================================\n\n');

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail', // Standard fallback, can be configured via ENV
        auth: {
          user: process.env.EMAIL_USER || '', // Needs to be set in .env if actually sending emails
          pass: process.env.EMAIL_PASS || '',
        },
      });

      // Only attempt to send actual email if credentials exist
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: `"MagribMengaji" <${process.env.EMAIL_USER}>`,
          to: admin_email,
          subject: 'Verifikasi Email Admin DKM - MagribMengaji',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Halo, ${admin_name}</h2>
              <p>Terima kasih telah mendaftarkan ${mosque_name} di MagribMengaji.</p>
              <p>Silakan klik tautan di bawah ini untuk memverifikasi alamat email Anda. Setelah email terverifikasi, Super Admin akan meninjau pendaftaran masjid Anda.</p>
              <div style="margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verifikasi Email Anda</a>
              </div>
              <p style="color: #64748b; font-size: 14px;">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
            </div>
          `,
        });
      } else {
        console.warn('⚠️ SMTP/Email credentials not found in .env. Skipping actual email delivery. Use the link in the terminal above to verify.');
      }
    } catch (emailError: any) {
       console.error("Nodemailer Error:", emailError.message);
       // We still return success for the db insert, but log the email failure.
    }

    return NextResponse.json({ 
      success: true, 
      message: "Pendaftaran berhasil. Silakan cek email Anda untuk tautan verifikasi.",
      data: {
        mosque: newMosque,
        user: newUser // verification_token has been intentionally removed from this object based on RETURNING clause
      }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

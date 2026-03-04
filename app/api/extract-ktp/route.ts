import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 60; // Allow more time for AI processing

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,...")
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'), // Using gemini-2.5-flash as supported by the user's API Key
      schema: z.object({
        nik: z.string().describe('Nomor Induk Kependudukan (NIK), usually 16 digits'),
        name: z.string().describe('Nama lengkap sesuai KTP'),
        tempat_lahir: z.string().describe('City or place of birth'),
        tanggal_lahir: z.string().describe('Date of birth in YYYY-MM-DD or DD-MM-YYYY format, strictly standard representation like 1990-12-21'),
        jenis_kelamin: z.string().describe('LAKI-LAKI or PEREMPUAN'),
        golongan_darah: z.string().describe('Blood type e.g., A, B, O, AB, or -'),
        alamat: z.string().describe('Full street address'),
        rt_rw: z.string().describe('RT/RW e.g., 001/002'),
        kel_desa: z.string().describe('Kelurahan or Desa'),
        kecamatan: z.string().describe('Kecamatan'),
        agama: z.string().describe('Religion e.g., ISLAM, KRISTEN'),
        status_perkawinan: z.string().describe('Marital status e.g., BELUM KAWIN, KAWIN'),
        pekerjaan: z.string().describe('Occupation'),
        kewarganegaraan: z.string().describe('Citizenship e.g., WNI'),
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the details from this Indonesian Identity Card (KTP) into a precise structured JSON object. Read all fields carefully.',
            },
            {
              type: 'image',
              image: base64Data,
            },
          ],
        },
      ],
    });

    return NextResponse.json({ success: true, data: object });
  } catch (error: any) {
    console.error('Error extracting KTP:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

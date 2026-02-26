import type { Metadata } from 'next';
import LaporanClient from './LaporanClient';

interface Props {
  params: Promise<{ studentId: string }>;
}

export const metadata: Metadata = {
  title: 'Laporan Santri — Maghrib Mengaji',
  description: 'Portal perkembangan santri untuk orang tua',
};

export default async function LaporanPage({ params }: Props) {
  const { studentId } = await params;
  return <LaporanClient studentId={studentId} />;
}

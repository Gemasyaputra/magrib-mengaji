'use client';

import ParentViewPage from '@/components/pages/ParentViewPage';
import { useRouter } from 'next/navigation';

interface Props {
  studentId: string;
}

export default function LaporanClient({ studentId }: Props) {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50">
      <ParentViewPage
        studentId={studentId}
        onBack={() => router.back()}
      />
    </div>
  );
}

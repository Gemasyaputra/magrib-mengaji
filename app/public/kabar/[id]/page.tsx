'use client';

import { useParams, useRouter } from 'next/navigation';
import KabarDetailPage from '@/components/pages/KabarDetailPage';

export default function PublicKabarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const handleNavigate = (page: string) => {
    // For public view, "back" or navigate just goes to home or stays put
    if (page === 'kabar-masjid') {
        router.push('/');
    } else {
        router.push('/');
    }
  };

  if (!id) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
        <div className="w-full max-w-md bg-white shadow-xl min-h-screen">
            <KabarDetailPage 
                onNavigate={handleNavigate} 
                postId={id} 
                currentUser={null} 
            />
        </div>
    </div>
  );
}

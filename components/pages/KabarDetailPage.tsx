'use client';

import { ArrowLeft, ChevronLeft, ChevronRight, X, Share2, Check, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { Post } from '@/types';

interface KabarDetailPageProps {
    onNavigate: (page: string) => void;
    postId: number;
    currentUser: any;
}

export default function KabarDetailPage({ onNavigate, postId, currentUser }: KabarDetailPageProps) {
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [copied, setCopied] = useState(false);
    const imageSliderRef = useRef<HTMLDivElement>(null);

    const handleImageScroll = () => {
        if (imageSliderRef.current) {
            const { scrollLeft, offsetWidth } = imageSliderRef.current;
            const newIndex = Math.round(scrollLeft / offsetWidth);
            setCurrentImageIndex(newIndex);
        }
    };

    const handleShare = () => {
        try {
            const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/kabar/${postId}`;
            const text = `Lihat kabar terbaru dari masjid:\n*${post?.title}*\n\n${url}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } catch (err) {
            console.error('Failed to open WhatsApp', err);
            toast.error('Gagal membuka WhatsApp.');
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/activities?id=${postId}`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    const p = json.data[0];
                    setPost({
                        id: p.id,
                        author: p.author_name || 'Admin',
                        author_id: p.author_id,
                        title: p.title,
                        content: p.content,
                        timestamp: new Date(p.created_at).toLocaleDateString(),
                        avatar: (p.author_name || 'A').charAt(0).toUpperCase(),
                        activity_date: p.activity_date,
                        comment_count: Number(p.comment_count) || 0,
                        images: Array.isArray(p.images) ? p.images : []
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId]);

    if (loading) return <div className="p-8 text-center text-slate-500">Memuat detail...</div>;
    if (!post) return <div className="p-8 text-center text-slate-500">Kabar tidak ditemukan.</div>;

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onNavigate('kabar')}
                        className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            {post.avatar}
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-800">{post.author}</h4>
                            <p className="text-[10px] text-slate-400">{post.timestamp}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                    <MessageCircle size={14} />
                    Bagikan ke WA
                </button>
            </div>

            <div className="p-4">
                <h1 className="text-xl font-bold text-slate-800 mb-3">{post.title}</h1>
                
                {/* Image Slider */}
                {post.images && post.images.length > 0 && (
                    <div className="mb-6 -mx-4 group relative">
                        <div 
                            ref={imageSliderRef}
                            onScroll={handleImageScroll}
                            className="flex overflow-x-auto snap-x snap-mandatory bg-slate-100 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {post.images.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    className="snap-center shrink-0 w-full aspect-video sm:aspect-[2/1] relative cursor-pointer"
                                    onClick={() => setLightboxImage(img)}
                                >
                                    <img src={img} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                        
                        {/* Dot Indicators */}
                        {post.images.length > 1 && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                                {post.images.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`transition-all duration-300 rounded-full shadow-sm ${
                                            currentImageIndex === idx 
                                            ? 'w-6 h-1.5 bg-white' 
                                            : 'w-1.5 h-1.5 bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                        
                        {post.images.length > 1 && (
                             <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
                                {post.images.length} Foto
                            </div>
                        )}
                    </div>
                )}

                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                    {post.content}
                </div>
            </div>
            
            {/* Lightbox Modal */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-center items-center animate-in fade-in duration-200">
                    <button 
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <X size={24} />
                    </button>
                    
                    <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                        <img 
                            src={lightboxImage} 
                            alt="Full view" 
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}


'use client';

import * as React from 'react';
import Image from 'next/image';
import { X, ThumbsUp, Download, Bookmark, ListPlus, Play, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { Video } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Rating } from './rating';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

interface VideoLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video;
  animations: any;
  averageRating: number;
  userRating: number;
  stats: { icon: React.ElementType; value: string }[];
  handleInteraction: (type: 'favorite' | 'playlist' | 'reaction' | 'rating', value?: 'heart' | 'fire' | 'hot-face' | number) => void;
}

export function VideoLightbox({ 
  isOpen, 
  onOpenChange, 
  video,
  animations,
  averageRating,
  userRating,
  stats,
  handleInteraction,
}: VideoLightboxProps) {
    const firestore = useFirestore();

    const handleWatchNowClick = React.useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!firestore) return;

        const storageKey = `download_timestamp_${video.id}`;
        const now = Date.now();
        const lastClick = localStorage.getItem(storageKey);

        if (lastClick && (now - parseInt(lastClick)) < 120000) {
            return;
        }

        localStorage.setItem(storageKey, now.toString());

        const videoRef = doc(firestore, 'videos', video.id);
        try {
            await updateDoc(videoRef, {
                downloadCount: increment(1)
            });
        } catch (error) {
            console.error("Error incrementing download count:", error);
        }
    }, [firestore, video.id]);

  if (!video) return null;

  const [dragStart, setDragStart] = React.useState<{ y: number, time: number } | null>(null);
  const [translateY, setTranslateY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only initiate drag on the background, not on buttons or other interactive elements
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    setDragStart({ y: e.clientY, time: Date.now() });
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart || !isDragging) return;
    const deltaY = e.clientY - dragStart.y;
    if (deltaY > 0) { // Only allow dragging down
        setTranslateY(deltaY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart || !isDragging) return;
    
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    const deltaY = e.clientY - dragStart.y;
    const deltaTime = Date.now() - dragStart.time;
    const velocity = deltaY / deltaTime;

    setIsDragging(false);

    // If swipe is fast or far enough, close
    if (Math.abs(deltaY) > 100 || Math.abs(velocity) > 0.5) {
      onOpenChange(false);
      setTimeout(() => {
        setTranslateY(0);
        setDragStart(null);
      }, 300);
    } else {
      // Snap back
      setTranslateY(0);
      setDragStart(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setTranslateY(0); // Reset position on close
      }
      onOpenChange(open);
    }}>
       <DialogContent 
        className="bg-transparent border-0 shadow-none p-0 w-full h-full max-w-none max-h-none flex items-center justify-center overflow-hidden" 
        style={{
          '--tw-bg-opacity': isDragging ? 1 - Math.min(Math.abs(translateY) / 500, 0.7) : 1,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div 
          className="relative w-full h-full flex flex-col items-center justify-center"
           style={{ 
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            transform: `translateY(${translateY}px) scale(${1 - Math.min(Math.abs(translateY) / 1000, 0.2)})`,
          }}
        >
          <div className="relative w-full max-w-4xl flex-1 max-h-[80vh]">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="w-full bg-gradient-to-t from-black/80 via-black/70 to-transparent p-4 text-white">
              <div className="container max-w-4xl">
                   <h2 className="font-headline text-2xl font-bold">{video.title}</h2>
                   <p className="text-sm text-white/80 mt-1 mb-4 max-w-2xl">{video.description}</p>
                  <div className="flex items-center justify-between mb-4">
                      <Rating
                          starAnimation={animations.star}
                          userRating={userRating}
                          averageRating={averageRating}
                          onRate={(rating) => handleInteraction('rating', rating)}
                      />
                      <div className="flex items-center gap-4">
                          {stats.map((stat, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <stat.icon className="h-5 w-5" />
                                <span className='font-medium'>{stat.value}</span>
                            </div>
                        ))}
                      </div>
                  </div>
                   <div className="grid grid-cols-3 gap-px border-t border-white/20 bg-white/10 p-0 rounded-lg overflow-hidden">
                      <Button variant="ghost" className="rounded-none text-white/90 hover:bg-white/20 hover:text-white" onClick={() => handleInteraction('favorite')}>
                          <Bookmark className="h-5 w-5 mr-2" />
                          Favorite
                      </Button>
                       <Button asChild variant="ghost" className="rounded-none text-white/90 hover:bg-white/20 hover:text-white">
                          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" onClick={handleWatchNowClick}>
                              <Play className="h-5 w-5 mr-2" />
                               <span className="animate-shimmer bg-[linear-gradient(110deg,hsl(var(--primary-foreground))_35%,hsl(var(--primary)),hsl(var(--primary-foreground))_65%)] bg-[length:200%_100%] bg-clip-text text-transparent">
                                  Watch now
                              </span>
                          </a>
                      </Button>
                      <Button variant="ghost" className="rounded-none text-white/90 hover:bg-white/20 hover:text-white" onClick={() => handleInteraction('playlist')}>
                          <ListPlus className="h-5 w-5 mr-2" />
                          Add to list
                      </Button>
                  </div>
              </div>
          </div>
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 left-4 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white z-10"
            aria-label="Go back"
        >
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white z-10"
            aria-label="Close lightbox"
        >
        </Button>
      </DialogContent>
    </Dialog>
  );
}

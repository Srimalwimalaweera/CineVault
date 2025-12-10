
'use client';

import * as React from 'react';
import Image from 'next/image';
import { X, ThumbsUp, Download, Bookmark, ListPlus, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Video } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Rating } from './rating';

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
  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="bg-transparent border-0 shadow-none p-0 w-full h-full max-w-none max-h-none flex flex-col items-center justify-center">
        <DialogTitle className="sr-only">{video.title}</DialogTitle>
        <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex-1">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
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
                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
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
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/75 hover:text-white"
            aria-label="Close lightbox"
        >
            <X className="h-6 w-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import * as React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from '@/components/ui/dialog';
import type { Video } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface VideoLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  video: Video;
}

export function VideoLightbox({ isOpen, onOpenChange, video }: VideoLightboxProps) {
  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="bg-transparent border-0 shadow-none p-0 w-full h-full max-w-none max-h-none flex items-center justify-center">
        <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
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

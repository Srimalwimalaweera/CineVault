"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, ListPlus, Star, ThumbsUp } from 'lucide-react';
import type { Video } from '@/lib/types';
import * as React from 'react';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();

  const handleInteraction = (e: React.MouseEvent, type: 'favorite' | 'playlist') => {
    e.preventDefault();
    e.stopPropagation();

    const messages = {
      favorite: {
        login: "Please log in to add to favorites.",
        success: `"${video.title}" has been added to favorites.`,
        title: "Added to Favorites"
      },
      playlist: {
        login: "Please log in to add to a playlist.",
        success: `"${video.title}" has been added to your playlist.`,
        title: "Added to Playlist"
      }
    };

    const message = messages[type];

    if (!isLoggedIn) {
      toast({ title: "Login Required", description: message.login, variant: "destructive" });
    } else {
      toast({ title: message.title, description: message.success });
    }
  };

  return (
    <Link href={`/video/${video.id}`} target="_blank" rel="noopener noreferrer" className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:shadow-xl group-focus-visible:-translate-y-1 group-focus-visible:shadow-xl">
        <div className="relative aspect-[2/3] w-full">
          <Image 
            src={video.thumbnailUrl} 
            alt={video.title} 
            fill 
            className="object-cover transition-transform duration-300 group-hover:scale-105" 
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 14vw"
            data-ai-hint={video.thumbnailHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Button size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-sm" onClick={(e) => handleInteraction(e, 'favorite')} aria-label="Add to favorites">
              <Heart className="h-4 w-4 text-white" />
            </Button>
            <Button size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-sm" onClick={(e) => handleInteraction(e, 'playlist')} aria-label="Add to playlist">
              <ListPlus className="h-4 w-4 text-white" />
            </Button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
             <h3 className="truncate font-headline text-base font-bold text-white shadow-black [text-shadow:0_1px_3px_var(--tw-shadow-color)]">{video.title}</h3>
          </div>
        </div>
        <CardContent className="p-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1" title="Rating">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{video.stats.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1" title="Reactions">
                <ThumbsUp className="h-3 w-3" />
                <span>{Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.stats.reactions)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
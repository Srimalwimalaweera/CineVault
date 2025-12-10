
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, ListPlus, Star, ThumbsUp } from 'lucide-react';
import type { Video } from '@/lib/types';
import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleInteraction = (e: React.MouseEvent, type: 'favorite' | 'playlist') => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !firestore) {
      toast({ title: "Login Required", description: `Please log in to add to ${type}s.`, variant: "destructive" });
      return;
    }
    
    const collectionName = type === 'favorite' ? 'favorites' : 'playlists';
    const collectionRef = collection(firestore, `users/${user.uid}/${collectionName}`);
    
    const data = type === 'favorite' 
        ? { videoId: video.id, userId: user.uid }
        : { name: 'My Playlist', videoIds: [video.id], userId: user.uid };

    addDocumentNonBlocking(collectionRef, data);
    
    toast({ 
        title: type === 'favorite' ? "Added to Favorites" : "Added to Playlist",
        description: `"${video.title}" has been added.`
    });
  };

  return (
    <Link href={`/video/${video.id}`} className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
      <Card className="h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:shadow-xl group-focus-visible:-translate-y-1 group-focus-visible:shadow-xl">
        <div className="relative aspect-[2/3] w-full">
          <Image 
            src={video.thumbnailUrl} 
            alt={video.title} 
            fill 
            className="object-cover transition-transform duration-300 group-hover:scale-105" 
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 14vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute top-2 right-2 flex flex-col gap-2">
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
                <span className="font-semibold">{video.ratings?.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1" title="Reactions">
                <ThumbsUp className="h-3 w-3" />
                <span>{Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.reactionCount || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

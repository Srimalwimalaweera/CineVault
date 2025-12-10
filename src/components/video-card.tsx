
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, ListPlus, Star, ThumbsUp, Download, Eye } from 'lucide-react';
import type { Video } from '@/lib/types';
import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
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

  const stats = [
    { icon: ThumbsUp, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.reactionCount || 0) },
    { icon: Eye, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.viewCount || 0) },
    { icon: Download, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.downloadCount || 0) },
  ]

  return (
      <Card className="w-full overflow-hidden transition-all duration-300 ease-in-out">
         <CardHeader className="p-4">
            <Link href={`/video/${video.id}`} className="group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                <CardTitle className="font-headline text-lg group-hover:underline">{video.title}</CardTitle>
            </Link>
         </CardHeader>
        <Link href={`/video/${video.id}`} className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <div className="relative max-h-[500px] w-full overflow-hidden">
                <Image 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    width={1080}
                    height={1080}
                    className="object-contain h-full w-full transition-transform duration-300 group-hover:scale-105" 
                />
            </div>
        </Link>
        <CardContent className="p-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1" title="Rating">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-foreground">{video.ratings?.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-3">
                {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <stat.icon className="h-4 w-4" />
                        <span>{stat.value}</span>
                    </div>
                ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-px border-t bg-muted/50 p-0">
            <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={(e) => handleInteraction(e, 'favorite')}>
                <Bookmark className="h-5 w-5 mr-2" />
                Favorite
            </Button>
            <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={(e) => handleInteraction(e, 'playlist')}>
                <ListPlus className="h-5 w-5 mr-2" />
                Add to list
            </Button>
        </CardFooter>
      </Card>
  );
}


"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, ListPlus, Star, ThumbsUp, Download, Eye, Heart } from 'lucide-react';
import type { Video } from '@/lib/types';
import * as React from 'react';
import { useFirestore } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import Lottie from "lottie-react";

// Hook to detect single/double/triple clicks
const useClickDetection = (
  onSingleClick: () => void,
  onDoubleClick: () => void,
  onTripleClick: () => void,
  delay = 250
) => {
  const [clickCount, setClickCount] = React.useState(0);

  React.useEffect(() => {
    if (clickCount === 0) return;

    const timer = setTimeout(() => {
      if (clickCount === 1) {
        onSingleClick();
      } else if (clickCount === 2) {
        onDoubleClick();
      } else if (clickCount >= 3) {
        onTripleClick();
      }
      setClickCount(0);
    }, delay);

    return () => clearTimeout(timer);
  }, [clickCount, onSingleClick, onDoubleClick, onTripleClick, delay]);

  return () => setClickCount(prev => prev + 1);
};


export function VideoCard({ video, priority = false }: { video: Video, priority?: boolean }) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [showReactions, setShowReactions] = React.useState(false);
  const [animations, setAnimations] = React.useState({ heart: null, fire: null, hotFace: null });
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const fetchAnimations = async () => {
      try {
        const [heartRes, fireRes, hotFaceRes] = await Promise.all([
          fetch('https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/lottie.json'),
          fetch('https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json'),
          fetch('https://fonts.gstatic.com/s/e/notoemoji/latest/1f975/lottie.json')
        ]);
        const heart = await heartRes.json();
        const fire = await fireRes.json();
        const hotFace = await hotFaceRes.json();
        setAnimations({ heart, fire, hotFace });
      } catch (error) {
        console.error("Failed to load Lottie animations", error);
      }
    };
    fetchAnimations();
  }, []);

  const handleInteraction = React.useCallback((type: 'favorite' | 'playlist' | 'reaction', reactionType?: 'heart' | 'fire' | 'hot-face') => {
    if (!user || !firestore) {
      toast({ title: "Login Required", description: `Please log in to interact.`, variant: "destructive" });
      return;
    }
    
    if (type === 'reaction' && reactionType) {
        // Use user's UID as the document ID for their reaction on this video
        const reactionRef = doc(firestore, `videos/${video.id}/reactions`, user.uid);
        const newReaction = {
            userId: user.uid,
            videoId: video.id,
            type: reactionType,
            createdAt: serverTimestamp(),
        };
        // Use setDoc with merge to create or update the user's reaction
        setDocumentNonBlocking(reactionRef, newReaction, { merge: true });
        
        toast({ 
            title: "Reaction Added!",
            description: `You reacted with ${reactionType} to "${video.title}".`
        });
        setShowReactions(false); // Close the panel after selection
        return;
    }

    if (type === 'favorite') {
        const favRef = doc(firestore, `users/${user.uid}/favorites`, video.id);
        const favData = { videoId: video.id, userId: user.uid, createdAt: serverTimestamp() };
        setDocumentNonBlocking(favRef, favData, { merge: true });
        toast({ 
            title: "Added to Favorites",
            description: `"${video.title}" has been added.`
        });
        return;
    }
    
    if (type === 'playlist') {
        // For simplicity, we add to a default playlist. A real app would let user choose.
        const collectionRef = collection(firestore, `users/${user.uid}/playlists`);
        const data = { name: 'My Playlist', videoIds: [video.id], userId: user.uid };
        addDocumentNonBlocking(collectionRef, data);
        toast({ 
            title: "Added to Playlist",
            description: `"${video.title}" has been added.`
        });
        return;
    }
  }, [user, firestore, video.id, video.title, toast]);

  const onSingleClick = React.useCallback(() => handleInteraction('reaction', 'heart'), [handleInteraction]);
  const onDoubleClick = React.useCallback(() => handleInteraction('reaction', 'fire'), [handleInteraction]);
  const onTripleClick = React.useCallback(() => handleInteraction('reaction', 'hot-face'), [handleInteraction]);

  const handleClicks = useClickDetection(onSingleClick, onDoubleClick, onTripleClick);
  
  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => {
      setShowReactions(true);
    }, 500); // 500ms for long press
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // If panel is open, close it. Otherwise, handle clicks.
      if (showReactions) {
          setShowReactions(false);
      } else if (!pressTimer.current) { // Ensure it's a click, not the end of a long press
          handleClicks();
      }
  };


  const stats = [
    { icon: ThumbsUp, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.reactionCount || 0) },
    { icon: Eye, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.viewCount || 0) },
    { icon: Download, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.downloadCount || 0) },
  ];
  
  const reactionEmojis = [
    { type: 'fire', animation: animations.fire, transform: 'translateX(-60px) translateY(10px) rotate(-30deg)' },
    { type: 'heart', animation: animations.heart, transform: 'translateY(-20px)' },
    { type: 'hot-face', animation: animations.hotFace, transform: 'translateX(60px) translateY(10px) rotate(30deg)' },
  ] as const;

  return (
      <Card className="w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300 ease-in-out">
         <CardHeader className="p-4">
            <Link href={`/video/${video.id}`} className="group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                <CardTitle className="font-headline text-lg group-hover:underline">{video.title}</CardTitle>
            </Link>
         </CardHeader>
        <Link href={`/video/${video.id}`} className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <div className="relative w-full overflow-hidden rounded-b-lg max-h-[500px] bg-muted flex justify-center items-center">
                <Image 
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    width={1080}
                    height={1080}
                    priority={priority}
                    className="object-contain h-full w-full transition-transform duration-300 group-hover:scale-105" 
                />
            </div>
        </Link>
        <div className="relative">
             <CardContent className="p-2 pt-4 text-sm text-muted-foreground">
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
                <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={() => handleInteraction('favorite')}>
                    <Bookmark className="h-5 w-5 mr-2" />
                    Favorite
                </Button>
                <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={() => handleInteraction('playlist')}>
                    <ListPlus className="h-5 w-5 mr-2" />
                    Add to list
                </Button>
            </CardFooter>
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
                <div className="relative flex flex-col items-center gap-1">
                    <div className="absolute bottom-full mb-2 flex justify-center items-end">
                      {reactionEmojis.map((emoji) => (
                        <div
                          key={emoji.type}
                          onClick={() => handleInteraction('reaction', emoji.type)}
                          className={`cursor-pointer absolute transition-all duration-300 ease-out w-12 h-12 hover:scale-125 ${showReactions ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                          style={{ transform: showReactions ? emoji.transform : 'translateY(0) scale(0)' }}
                        >
                          {emoji.animation && <Lottie animationData={emoji.animation} loop={true} />}
                        </div>
                      ))}
                    </div>
                    <Button 
                        size="icon" 
                        className="rounded-full h-12 w-12 shadow-lg" 
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        onClick={handleButtonClick}
                        onContextMenu={(e) => e.preventDefault()} // Prevents context menu on long press
                        aria-label="Add reaction"
                    >
                        <Heart className="h-6 w-6" />
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground">Reaction</span>
                </div>
            </div>
        </div>
      </Card>
  );
}

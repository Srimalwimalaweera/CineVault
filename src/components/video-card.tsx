
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, ListPlus, ThumbsUp, Play, Download } from 'lucide-react';
import type { Video } from '@/lib/types';
import * as React from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import Lottie from "lottie-react";
import { cn } from '@/lib/utils';
import { Rating } from '@/components/rating';
import type { Rating as RatingType } from '@/lib/types';
import { VideoLightbox } from '@/components/video-lightbox';

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
  // The functions are wrapped in useCallback, so this is safe.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickCount]);

  return () => setClickCount(prev => prev + 1);
};


export function VideoCard({ video, priority = false }: { video: Video, priority?: boolean }) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [showReactions, setShowReactions] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [animations, setAnimations] = React.useState<{ heart: any; fire: any; hotFace: any; star: any; }>({ heart: null, fire: null, hotFace: null, star: null });
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const userReactionRef = useMemoFirebase(() => {
    if (!firestore || !user || !video.id) return null;
    return doc(firestore, `videos/${video.id}/reactions`, user.uid);
  }, [firestore, user, video.id]);

  const reactionsCollectionRef = useMemoFirebase(() => {
    if (!firestore || !video.id) return null;
    return collection(firestore, `videos/${video.id}/reactions`);
  }, [firestore, video.id]);
  
  const videoRatingsRef = useMemoFirebase(() => {
      if (!firestore || !video.id) return null;
      return collection(firestore, `videos/${video.id}/ratings`);
  }, [firestore, video.id]);

  const userRatingRef = useMemoFirebase(() => {
    if (!firestore || !user || !video.id) return null;
    return doc(firestore, `videos/${video.id}/ratings`, user.uid);
  }, [firestore, user, video.id]);


  const { data: userReaction } = useDoc<{type: 'heart' | 'fire' | 'hot-face'}>(userReactionRef);
  const { data: reactions } = useCollection(reactionsCollectionRef);
  const { data: ratingsData } = useCollection<RatingType>(videoRatingsRef);
  const { data: userRating } = useDoc<RatingType>(userRatingRef);


  const averageRating = React.useMemo(() => {
    if (!ratingsData || ratingsData.length === 0) {
      return 0;
    }
    const total = ratingsData.reduce((acc, r) => acc + r.rating, 0);
    return total / ratingsData.length;
  }, [ratingsData]);


  React.useEffect(() => {
    const fetchAnimations = async () => {
      try {
        const [heartRes, fireRes, hotFaceRes, starRes] = await Promise.all([
          fetch('https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/lottie.json'),
          fetch('https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/lottie.json'),
          fetch('https://fonts.gstatic.com/s/e/notoemoji/latest/1f975/lottie.json'),
          fetch('https://fonts.gstatic.com/s/e/notoemoji/latest/1f31f/lottie.json')
        ]);
        const heart = await heartRes.json();
        const fire = await fireRes.json();
        const hotFace = await hotFaceRes.json();
        const star = await starRes.json();
        setAnimations({ heart, fire, hotFace, star });
      } catch (error) {
        console.error("Failed to load Lottie animations", error);
      }
    };
    fetchAnimations();
  }, []);

  const handleInteraction = React.useCallback((type: 'favorite' | 'playlist' | 'reaction' | 'rating', value?: 'heart' | 'fire' | 'hot-face' | number) => {
    if (!user || !firestore) {
      toast({ title: "Login Required", description: `Please log in to interact.`, variant: "destructive" });
      return;
    }
    
    if (type === 'reaction' && (value === 'heart' || value === 'fire' || value === 'hot-face')) {
        const reactionRef = doc(firestore, `videos/${video.id}/reactions`, user.uid);
        const newReaction = {
            userId: user.uid,
            videoId: video.id,
            type: value,
            createdAt: serverTimestamp(),
        };
        setDocumentNonBlocking(reactionRef, newReaction, { merge: true });
        
        toast({ 
            title: "Reaction Added!",
            description: `You reacted with ${value} to "${video.title}".`
        });
        setShowReactions(false);
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
        const collectionRef = collection(firestore, `users/${user.uid}/playlists`);
        const data = { name: 'My Playlist', videoIds: [video.id], userId: user.uid };
        addDocumentNonBlocking(collectionRef, data);
        toast({ 
            title: "Added to Playlist",
            description: `"${video.title}" has been added.`
        });
        return;
    }
    
    if (type === 'rating' && typeof value === 'number') {
        const ratingRef = doc(firestore, `videos/${video.id}/ratings`, user.uid);
        const newRating = {
            userId: user.uid,
            videoId: video.id,
            rating: value,
            createdAt: serverTimestamp(),
        };
        setDocumentNonBlocking(ratingRef, newRating, { merge: true });
        toast({
            title: "Rating Submitted!",
            description: `You rated "${video.title}" ${value} stars.`
        });
    }

  }, [user, firestore, video.id, video.title, toast]);

  const onSingleClick = React.useCallback(() => {
    if (userReaction) {
      if (userReactionRef) {
        deleteDocumentNonBlocking(userReactionRef);
        toast({
          title: "Reaction Removed",
        });
      }
    } else {
      handleInteraction('reaction', 'heart');
    }
  }, [userReaction, userReactionRef, handleInteraction, toast]);

  const onDoubleClick = React.useCallback(() => handleInteraction('reaction', 'fire'), [handleInteraction]);
  const onTripleClick = React.useCallback(() => handleInteraction('reaction', 'hot-face'), [handleInteraction]);

  const handleClicks = useClickDetection(onSingleClick, onDoubleClick, onTripleClick);
  
  const handlePressStart = () => {
    pressTimer.current = setTimeout(() => {
      setShowReactions(true);
    }, 500);
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
      if (showReactions) {
          setShowReactions(false);
      } else if (!pressTimer.current) { 
          handleClicks();
      }
  };

  const stats = [
    { icon: ThumbsUp, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(reactions?.length || 0) },
    { icon: Download, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.downloadCount || 0) },
  ];
  
  const reactionEmojis = [
    { type: 'fire', animation: animations.fire, transform: 'translateX(-60px) translateY(10px) rotate(-30deg)' },
    { type: 'heart', animation: animations.heart, transform: 'translateY(-20px)' },
    { type: 'hotFace', animation: animations.hotFace, transform: 'translateX(60px) translateY(10px) rotate(30deg)' },
  ] as const;

  const MainReactionIcon = () => {
    const reactionType = userReaction?.type;
    if (reactionType && animations[reactionType]) {
        return <Lottie animationData={animations[reactionType]} loop={true} className="h-6 w-6" />;
    }
    return <Lottie animationData={animations.heart} loop={true} className="h-6 w-6" />;
  };

  return (
      <>
      <Card className="w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300 ease-in-out">
         <CardHeader className="p-4">
            <Link href={`/video/${video.id}`} className="group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                <CardTitle className="font-headline text-lg group-hover:underline">{video.title}</CardTitle>
            </Link>
         </CardHeader>
        <div 
          className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          onClick={() => setIsLightboxOpen(true)}
        >
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
        </div>
        <div className="relative">
             <CardContent className="p-2 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                 <Rating
                    starAnimation={animations.star}
                    userRating={userRating?.rating || 0}
                    averageRating={averageRating}
                    onRate={(rating) => handleInteraction('rating', rating)}
                  />
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
            <CardFooter className="grid grid-cols-3 gap-px border-t bg-muted/50 p-0">
                <Button variant="ghost" className="rounded-none text-muted-foreground" onClick={() => handleInteraction('favorite')}>
                    <Bookmark className="h-5 w-5 mr-2" />
                    Favorite
                </Button>
                <Button asChild variant="ghost" className="rounded-none text-muted-foreground">
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="h-5 w-5 mr-2" />
                        <span className="animate-shimmer bg-[linear-gradient(110deg,hsl(var(--foreground))_35%,hsl(var(--primary)),hsl(var(--foreground))_65%)] bg-[length:200%_100%] bg-clip-text text-transparent">
                          Watch now
                        </span>
                    </a>
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
                          className={cn(
                            'cursor-pointer absolute transition-all duration-300 ease-out w-12 h-12 hover:scale-125',
                            showReactions ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                          )}
                          style={{ transform: showReactions ? emoji.transform : 'translateY(0) scale(0)' }}
                        >
                          {emoji.animation && <Lottie animationData={emoji.animation} loop={true} />}
                        </div>
                      ))}
                    </div>
                    <Button 
                        size="icon" 
                        className="rounded-full h-12 w-12 shadow-lg flex items-center justify-center" 
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        onClick={handleButtonClick}
                        onContextMenu={(e) => e.preventDefault()}
                        aria-label="Add reaction"
                    >
                       <MainReactionIcon />
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground">Reaction</span>
                </div>
            </div>
        </div>
      </Card>
      <VideoLightbox 
        isOpen={isLightboxOpen} 
        onOpenChange={setIsLightboxOpen}
        video={video}
      />
      </>
  );
}

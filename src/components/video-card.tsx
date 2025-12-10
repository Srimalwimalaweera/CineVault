
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/hooks/use-auth";
import { Bookmark, ListPlus, ThumbsUp, Play, Download, Heart, Trash2 } from 'lucide-react';
import type { Video } from '@/lib/types';
import * as React from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, serverTimestamp, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import Lottie from "lottie-react";
import { cn } from '@/lib/utils';
import { Rating } from '@/components/rating';
import type { Rating as RatingType } from '@/lib/types';
import { VideoLightbox } from '@/components/video-lightbox';
import { AddToListDialog } from '@/components/add-to-list-dialog';

// Hook to detect single/double/triple clicks
const useClickDetection = (
  onSingleClick: (e: React.MouseEvent<HTMLDivElement>) => void,
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void,
  onTripleClick: (e: React.MouseEvent<HTMLDivElement>) => void,
  delay = 250
) => {
  const [clickCount, setClickCount] = React.useState(0);

  return (e: React.MouseEvent<HTMLDivElement>) => {
    // Capture necessary event data immediately, before the setTimeout.
    const currentTarget = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Create a new lightweight event object.
    const persistedEvent = {
        currentTarget,
        clientX,
        clientY,
    } as unknown as React.MouseEvent<HTMLDivElement>;

    setClickCount(prev => prev + 1);

    setTimeout(() => {
      setClickCount(currentClickCount => {
        if (currentClickCount === 1) onSingleClick(persistedEvent);
        else if (currentClickCount === 2) onDoubleClick(persistedEvent);
        else if (currentClickCount >= 3) onTripleClick(persistedEvent);
        return 0; // Reset after handling
      });
    }, delay);
  };
};

type HeartAnimation = {
  id: number;
  x: number;
  y: number;
  rotation: number;
};

export function VideoCard({ video, priority = false }: { video: Video, priority?: boolean }) {
  const { user, isAdmin } = useAuthContext();
  const firestore = useFirestore();

  const [showReactions, setShowReactions] = React.useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [animations, setAnimations] = React.useState<{ heart: any; fire: any; hotFace: any; star: any; }>({ heart: null, fire: null, hotFace: null, star: null });
  const [hearts, setHearts] = React.useState<HeartAnimation[]>([]);
  const likedInSession = React.useRef(false);
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
  
  const favoriteRef = useMemoFirebase(() => {
    if (!firestore || !user || !video.id) return null;
    return doc(firestore, `users/${user.uid}/favorites`, video.id);
  }, [firestore, user, video.id]);


  const { data: userReaction } = useDoc<{type: 'heart' | 'fire' | 'hot-face'}>(userReactionRef);
  const { data: reactions } = useCollection(reactionsCollectionRef);
  const { data: ratingsData } = useCollection<RatingType>(videoRatingsRef);
  const { data: userRating } = useDoc<RatingType>(userRatingRef);
  const { data: favorite } = useDoc(favoriteRef);

  const isFavorited = !!favorite;

  const averageRating = React.useMemo(() => {
    if (!ratingsData || ratingsData.length === 0) {
      return 0;
    }
    const total = ratingsData.reduce((acc, r) => acc + r.rating, 0);
    return total / ratingsData.length;
  }, [ratingsData]);

  React.useEffect(() => {
    if (userReaction) {
      likedInSession.current = true;
    } else {
      likedInSession.current = false;
    }
  }, [userReaction]);

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

  const handleInteraction = React.useCallback((type: 'favorite' | 'playlist' | 'reaction' | 'rating' | 'trash', value?: 'heart' | 'fire' | 'hot-face' | number) => {
    if (!user || !firestore) {
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
        
        if (value === 'heart' && !likedInSession.current) {
          likedInSession.current = true; // Mark as liked for this session
        }
        
        setShowReactions(false);
        return;
    }

    if (type === 'favorite') {
        const favRef = doc(firestore, `users/${user.uid}/favorites`, video.id);
        if (isFavorited) {
          deleteDocumentNonBlocking(favRef);
        } else {
          const favData = { videoId: video.id, userId: user.uid, createdAt: serverTimestamp() };
          setDocumentNonBlocking(favRef, favData, { merge: true });
        }
        return;
    }
    
    if (type === 'playlist') {
        // This is now handled by the AddToListDialog
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
    }

    if (type === 'trash') {
        if (!isAdmin) return;
        const videoRef = doc(firestore, 'videos', video.id);
        updateDocumentNonBlocking(videoRef, {
            status: 'trashed',
            trashedAt: serverTimestamp()
        });
    }

  }, [user, firestore, video.id, isFavorited, isAdmin]);

    const handleWatchNowClick = React.useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!firestore) return;

        const storageKey = `download_timestamp_${video.id}`;
        const now = Date.now();
        const lastClick = localStorage.getItem(storageKey);

        if (lastClick && (now - parseInt(lastClick)) < 120000) {
            // Less than 2 minutes have passed, do nothing special.
            // The browser will handle the `href` navigation.
            return;
        }

        // It's the first click or more than 2 minutes have passed.
        localStorage.setItem(storageKey, now.toString());

        const videoRef = doc(firestore, 'videos', video.id);
        try {
            await updateDoc(videoRef, {
                downloadCount: increment(1)
            });
        } catch (error) {
            console.error("Error incrementing download count:", error);
            // We don't toast here as it could be disruptive.
            // The link will still work.
        }
    }, [firestore, video.id]);


  const onSingleClick = React.useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const onDoubleClick = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart: HeartAnimation = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rotation: Math.random() * 40 - 20,
    };
    setHearts(currentHearts => [...currentHearts, newHeart]);
    if (!likedInSession.current) {
      handleInteraction('reaction', 'heart');
    }
    setTimeout(() => {
      setHearts(currentHearts => currentHearts.filter(h => h.id !== newHeart.id));
    }, 1500);
  }, [handleInteraction]);

  const onTripleClick = onDoubleClick; // Triple click also triggers a heart

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

  const handleHeartButtonClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (showReactions) {
          setShowReactions(false);
      } else { 
        if (userReaction) {
          if (userReactionRef) {
            deleteDocumentNonBlocking(userReactionRef);
          }
        } else {
          handleInteraction('reaction', 'heart');
        }
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
    return <Heart className="h-6 w-6" />;
  };

  return (
      <>
      <Card className="w-full max-w-2xl mx-auto overflow-hidden transition-all duration-300 ease-in-out">
         <CardHeader className="p-4">
            <Link href={`/video/${video.id}`} className="group outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
                <CardTitle className={cn(
                    "font-headline text-xl group-hover:underline",
                    video.accessLevel === 'pro' && "text-gold animate-shimmer-gold bg-gradient-to-r from-gold via-yellow-200 to-gold bg-[length:200%_100%] bg-clip-text text-transparent"
                )}>
                    {video.title}
                </CardTitle>
            </Link>
         </CardHeader>
        <div 
          className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          onClick={handleClicks}
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
                {isAdmin && (
                    <Button 
                        size="icon" 
                        variant="destructive"
                        className="absolute top-2 left-2 z-10 h-10 w-10 opacity-70 hover:opacity-100"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleInteraction('trash');
                        }}
                    >
                        <Trash2 />
                        <span className="sr-only">Move to Trash</span>
                    </Button>
                )}
                {hearts.map(heart => (
                  <div
                    key={heart.id}
                    className="pointer-events-none absolute"
                    style={{
                      left: heart.x,
                      top: heart.y,
                      transform: `rotate(${heart.rotation}deg)`,
                    }}
                  >
                    <Heart className="w-24 h-24 text-white fill-white animate-heart-pop" />
                  </div>
                ))}
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
                <Button 
                    variant="ghost" 
                    className={cn(
                        "rounded-none text-muted-foreground",
                        isFavorited && "bg-accent text-accent-foreground hover:bg-accent/90"
                    )}
                    onClick={() => handleInteraction('favorite')}
                >
                    <Bookmark className="h-5 w-5 mr-2" />
                    Favorite
                </Button>
                <Button asChild variant="ghost" className="rounded-none text-muted-foreground">
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" onClick={handleWatchNowClick}>
                        <Play className="h-5 w-5 mr-2" />
                        <span className="animate-shimmer bg-[linear-gradient(110deg,hsl(var(--foreground))_35%,hsl(var(--primary)),hsl(var(--foreground))_65%)] bg-[length:200%_100%] bg-clip-text text-transparent">
                          Watch now
                        </span>
                    </a>
                </Button>
                <AddToListDialog videoId={video.id}>
                    <Button variant="ghost" className="rounded-none text-muted-foreground w-full">
                        <ListPlus className="h-5 w-5 mr-2" />
                        Add to list
                    </Button>
                </AddToListDialog>
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
                        onClick={handleHeartButtonClick}
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
        animations={animations}
        averageRating={averageRating}
        userRating={userRating?.rating || 0}
        stats={stats}
        handleInteraction={handleInteraction}
      />
      </>
  );
}

    
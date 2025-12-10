
'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import Lottie from 'lottie-react';
import { useAuthContext } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface RatingProps {
  starAnimation: any;
  userRating: number;
  averageRating: number;
  onRate: (rating: number) => void;
  totalStars?: number;
}

export function Rating({
  starAnimation,
  userRating,
  averageRating,
  onRate,
  totalStars = 5,
}: RatingProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [isRating, setIsRating] = React.useState(false);
  const [hoverRating, setHoverRating] = React.useState(0);
  const ratingAreaRef = React.useRef<HTMLDivElement>(null);
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const lottieRef = React.useRef<any>(null);
  React.useEffect(() => {
    if (lottieRef.current) {
        lottieRef.current.stop();
    }
    const interval = setInterval(() => {
      if (lottieRef.current) {
        lottieRef.current.goToAndPlay(0, true);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [starAnimation]);

  const handleInteractionStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You must be logged in to rate a video.',
        variant: 'destructive',
      });
      return;
    }

    pressTimer.current = setTimeout(() => {
      e.preventDefault(); // Prevent text selection, etc.
      setIsRating(true);
    }, 300); // Long-press duration
  };

  const handleInteractionMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isRating || !ratingAreaRef.current) return;

    e.preventDefault();

    const rect = ratingAreaRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left; // x position within the element.
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newRating = Math.ceil(percentage * totalStars);
    setHoverRating(newRating);
  };

  const handleInteractionEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (isRating) {
      if (hoverRating > 0) {
        onRate(hoverRating);
      }
      setIsRating(false);
      setHoverRating(0);
    }
  };

  const ratingToShow = isRating ? hoverRating : userRating;

  return (
    <div
      ref={ratingAreaRef}
      onMouseDown={handleInteractionStart}
      onMouseMove={handleInteractionMove}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchMove={handleInteractionMove}
      onTouchEnd={handleInteractionEnd}
      className="flex items-center gap-2 cursor-pointer select-none"
      title="Rating"
    >
      <span className="font-medium text-sm">Rating</span>
      <div className="relative flex items-center">
        <div className="flex items-center gap-1">
          {starAnimation && (
             <Lottie
                lottieRef={lottieRef}
                animationData={starAnimation}
                loop={false}
                autoplay={false}
                className="h-5 w-5"
              />
          )}
          <span className="font-semibold text-foreground">
            {averageRating.toFixed(1)}
          </span>
        </div>
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center gap-1 bg-background/80 backdrop-blur-sm transition-opacity duration-300 rounded-lg',
            isRating ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {[...Array(totalStars)].map((_, index) => {
            const starValue = index + 1;
            return (
              <Star
                key={starValue}
                className={cn(
                  'h-24 w-24 transition-colors',
                  starValue <= ratingToShow
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-muted-foreground/30'
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

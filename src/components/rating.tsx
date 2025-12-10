
'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface RatingProps {
  currentRating: number;
  averageRating: number;
  onRating: (rating: number) => void;
  totalStars?: number;
}

export function Rating({
  currentRating,
  averageRating,
  onRating,
  totalStars = 5,
}: RatingProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleRatingClick = (rating: number) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'You must be logged in to rate a video.',
        variant: 'destructive',
      });
      return;
    }
    onRating(rating);
  };

  const displayRating = hoverRating > 0 ? hoverRating : currentRating;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHoverRating(0)}
    >
      <div className="flex items-center">
        {[...Array(totalStars)].map((_, index) => {
          const starValue = index + 1;
          return (
            <Star
              key={starValue}
              className={cn(
                'h-5 w-5 cursor-pointer transition-colors',
                starValue <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground/50'
              )}
              onMouseEnter={() => setHoverRating(starValue)}
              onClick={() => handleRatingClick(starValue)}
            />
          );
        })}
      </div>
      <span className="font-semibold text-foreground ml-2">
        {averageRating.toFixed(1)}
      </span>
    </div>
  );
}

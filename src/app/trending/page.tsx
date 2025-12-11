
'use client';

import React, { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { VideoCard } from '@/components/video-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame } from 'lucide-react';
import type { Video, Rating } from '@/lib/types';
import { WithId } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

type VideoWithScore = WithId<Video> & { trendingScore: number };
type Reaction = {
    createdAt: Timestamp;
};

// Helper function to calculate a weighted score for an interaction
const calculateScore = (timestamp: Timestamp): number => {
  const now = Date.now();
  const interactionDate = timestamp.toDate().getTime();
  const daysOld = (now - interactionDate) / (1000 * 60 * 60 * 24);

  // Apply a decay factor: newer interactions are worth more
  // An interaction from today gets full points, one from 30 days ago gets very few.
  const decayFactor = Math.exp(-daysOld / 10); // Adjust the denominator to change decay speed
  
  return decayFactor;
};

export default function TrendingPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [trendingVideos, setTrendingVideos] = useState<VideoWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingData = async () => {
      if (!firestore) return;
      setIsLoading(true);

      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // 1. Fetch videos from the last 30 days
        const videosQuery = query(
          collection(firestore, 'videos'),
          where('status', '==', 'published'),
          where('createdAt', '>=', thirtyDaysAgo)
        );
        const videoSnapshots = await getDocs(videosQuery);
        const videos = videoSnapshots.docs.map(doc => ({ ...doc.data() as Video, id: doc.id }));

        // 2. For each video, calculate its trending score
        const videosWithScores = await Promise.all(videos.map(async (video) => {
          let trendingScore = 0;

          // a. Fetch and score reactions
          const reactionsQuery = query(
            collection(firestore, `videos/${video.id}/reactions`),
            where('createdAt', '>=', thirtyDaysAgo)
          );
          const reactionsSnapshot = await getDocs(reactionsQuery);
          reactionsSnapshot.forEach(doc => {
            const reaction = doc.data() as Reaction;
            trendingScore += calculateScore(reaction.createdAt) * 1.5; // Reactions are weighted higher
          });

          // b. Fetch and score ratings
          const ratingsQuery = query(
            collection(firestore, `videos/${video.id}/ratings`),
             where('createdAt', '>=', thirtyDaysAgo)
          );
          const ratingsSnapshot = await getDocs(ratingsQuery);
          ratingsSnapshot.forEach(doc => {
             const rating = doc.data() as WithId<Rating>;
             // Weight score by the rating value itself
             trendingScore += calculateScore(rating.createdAt) * (rating.rating / 5); 
          });

          return { ...video, trendingScore };
        }));

        // 3. Sort videos by the calculated score
        const sortedVideos = videosWithScores.sort((a, b) => b.trendingScore - a.trendingScore);

        setTrendingVideos(sortedVideos);

      } catch (error) {
        console.error("Error fetching trending videos: ", error);
        toast({
          title: "Error",
          description: "Could not fetch trending videos.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingData();
  }, [firestore, toast]);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ));
    }

    if (trendingVideos.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12">
          <p>No trending videos right now. Check back soon!</p>
        </div>
      );
    }
    
    return trendingVideos.map((video, index) => (
      <VideoCard
        key={video.id}
        video={video}
        priority={index < 2}
      />
    ));
  };


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container max-w-2xl py-12">
          <div className="mb-8 flex items-center gap-4">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <Flame/> Trending
            </h1>
          </div>
          <div className="flex flex-col gap-8">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

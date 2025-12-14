
'use client';
import { Header } from '@/components/layout/header';
import { VideoCard } from '@/components/video-card';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Video } from '@/lib/types';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';

// Custom hook for infinite scroll
function useInfiniteScroll(callback: () => void, hasMore: boolean, isLoading: boolean) {
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, callback]);

  return lastElementRef;
}

// Function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
};

const VIDEOS_PER_PAGE = 5;

export default function Home() {
  const firestore = useFirestore();
  const [shuffledVideos, setShuffledVideos] = useState<Video[]>([]);
  const [visibleVideos, setVisibleVideos] = useState<Video[]>([]);
  const [page, setPage] = useState(1);

  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'videos'),
      where('status', '==', 'published')
    );
  }, [firestore]);

  const { data: videos, isLoading } = useCollection<Video>(videosQuery);
  
  useEffect(() => {
    if (videos && videos.length > 0) {
      const shuffled = shuffleArray([...videos]);
      setShuffledVideos(shuffled);
      setVisibleVideos(shuffled.slice(0, VIDEOS_PER_PAGE));
    }
  }, [videos]);

  const hasMore = visibleVideos.length < shuffledVideos.length;

  const loadMoreVideos = useCallback(() => {
    if (isLoading) return;
    const nextPage = page + 1;
    const newVideos = shuffledVideos.slice(0, nextPage * VIDEOS_PER_PAGE);
    setVisibleVideos(newVideos);
    setPage(nextPage);
  }, [isLoading, page, shuffledVideos]);
  
  const lastVideoRef = useInfiniteScroll(loadMoreVideos, hasMore, isLoading);


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          <div className="flex flex-col gap-8">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
            {visibleVideos.map((video, index) => (
               <div ref={index === visibleVideos.length - 1 ? lastVideoRef : null} key={video.id}>
                  <VideoCard 
                    video={video} 
                    priority={index < 2}
                  />
               </div>
            ))}

            {hasMore && !isLoading && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading more videos...</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

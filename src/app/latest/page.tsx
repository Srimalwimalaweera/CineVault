
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, DocumentData, QueryDocumentSnapshot, where } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { VideoCard } from '@/components/video-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Video } from '@/lib/types';
import { WithId } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 5;

// Custom hook for infinite scroll
function useInfiniteScroll(callback: () => void) {
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        callback();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [callback]);

  return lastElementRef;
}

export default function LatestPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [videos, setVideos] = useState<WithId<Video>[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchVideos = useCallback(async (initial = false) => {
    if (!firestore) return;
    if (initial) setIsLoading(true); else setIsLoadingMore(true);

    try {
      let q = query(
        collection(firestore, 'videos'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!initial && lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const documentSnapshots = await getDocs(q);

      const newVideos = documentSnapshots.docs.map(doc => ({ ...doc.data() as Video, id: doc.id }));
      const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];

      setVideos(prev => initial ? newVideos : [...prev, ...newVideos]);
      setLastVisible(lastDoc || null);
      setHasMore(documentSnapshots.docs.length === PAGE_SIZE);

    } catch (error) {
      console.error("Error fetching videos: ", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [firestore, lastVisible]);

  useEffect(() => {
    fetchVideos(true);
  }, []); // Only on initial mount

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchVideos(false);
    }
  }, [isLoadingMore, hasMore, fetchVideos]);

  const lastVideoRef = useInfiniteScroll(loadMore);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          <div className="mb-8 flex items-center gap-4">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Sparkles/> Latest Videos</h1>
          </div>
          <div className="flex flex-col gap-8">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
            {videos.map((video, index) => {
              if (videos.length === index + 1) {
                return (
                  <div ref={lastVideoRef} key={video.id}>
                    <VideoCard video={video} priority={index < 2} />
                  </div>
                );
              }
              return <VideoCard key={video.id} video={video} priority={index < 2} />;
            })}

            {isLoadingMore && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading more...</span>
              </div>
            )}
            
            {!isLoading && !hasMore && videos.length > 0 && (
              <div className="text-center text-muted-foreground py-4">
                You've reached the end!
              </div>
            )}

            {!isLoading && videos.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No videos found. Check back later!</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

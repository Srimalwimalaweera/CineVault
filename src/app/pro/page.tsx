
'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { VideoCard } from '@/components/video-card';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Video } from '@/lib/types';
import { Crown } from 'lucide-react';

export default function ProPage() {
  const firestore = useFirestore();

  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'videos'), 
        where('status', '==', 'published'),
        where('accessLevel', '==', 'pro'),
        orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: videos, isLoading } = useCollection<Video>(videosQuery);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
            <div className="mb-8 flex items-center gap-4">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Crown className="text-gold" /> Pro Videos
                </h1>
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
            {videos?.map((video, index) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                priority={index < 2}
              />
            ))}
            {!isLoading && videos?.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                    <p>No pro videos found. Check back later!</p>
                </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { VideoCard } from '@/components/video-card';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Video } from '@/lib/types';

export default function Home() {
  const firestore = useFirestore();

  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'videos'), orderBy('title'));
  }, [firestore]);

  const { data: videos, isLoading } = useCollection<Video>(videosQuery);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          <h1 className="mb-6 font-headline text-3xl font-bold tracking-tight md:text-4xl">
            Latest Videos
          </h1>
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
            {videos?.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

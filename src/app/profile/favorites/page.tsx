
'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ArrowLeft } from 'lucide-react';
import type { Video } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/video-card';

export default function FavoritesPage() {
  const { user, isUserLoading } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const favoritesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/favorites`);
  }, [firestore, user]);

  const { data: favorites, isLoading: isLoadingFavorites } = useCollection<{ videoId: string }>(favoritesQuery);

  const favoriteVideoIds = useMemo(() => {
    return favorites ? favorites.map(fav => fav.videoId) : [];
  }, [favorites]);

  const videosQuery = useMemoFirebase(() => {
    if (!firestore || favoriteVideoIds.length === 0) return null;
    // Firestore 'in' queries are limited to 30 items in a single query.
    // If you expect more, you would need to batch the queries.
    return query(
      collection(firestore, 'videos'),
      where('status', '==', 'published'),
      where(documentId(), 'in', favoriteVideoIds.slice(0, 30))
    );
  }, [firestore, favoriteVideoIds]);

  const { data: videos, isLoading: isLoadingVideos } = useCollection<Video>(videosQuery);
  
  const isLoading = isUserLoading || isLoadingFavorites || isLoadingVideos;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (videos && videos.length > 0) {
      return (
        <div className="flex flex-col gap-8">
          {videos.map((video, index) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              priority={index < 2}
            />
          ))}
        </div>
      );
    }

    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>No Favorites Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You haven't added any videos to your favorites yet.</p>
        </CardContent>
        <CardFooter>
          <Button asChild className='mx-auto'>
            <Link href="/">Browse Videos</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container max-w-2xl py-12">
          <div className="mb-8 flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/profile">
                <ArrowLeft />
                <span className="sr-only">Back to Profile</span>
              </Link>
            </Button>
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Heart/> My Favorites</h1>
          </div>
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}

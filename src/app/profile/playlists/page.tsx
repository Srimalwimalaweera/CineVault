
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListVideo, Film, ArrowLeft } from 'lucide-react';
import type { Playlist } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function PlaylistsPage() {
  const { user, isUserLoading } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const playlistsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/playlists`);
  }, [firestore, user]);

  const { data: playlists, isLoading } = useCollection<Playlist>(playlistsQuery);

  const MainContent = () => {
    if (isLoading || isUserLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    if (playlists && playlists.length > 0) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => (
            <Card key={playlist.id} className="flex flex-col transition-transform hover:scale-105 hover:shadow-lg">
              <CardHeader className="flex-1">
                <CardTitle className="flex items-center gap-2 font-headline">
                  <ListVideo />
                  {playlist.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Film className="h-4 w-4" />
                  {playlist.videoIds.length} video{playlist.videoIds.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>No Playlists Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">You haven't created any playlists yet.</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className='mx-auto'>
                    <Link href="/">Browse Videos</Link>
                </Button>
            </CardFooter>
        </Card>
    );
  };


  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container py-12">
            <div className="mb-8 flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/profile">
                        <ArrowLeft />
                        <span className="sr-only">Back to Profile</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold">My Playlists</h1>
            </div>
            <MainContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}

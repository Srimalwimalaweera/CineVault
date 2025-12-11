
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListVideo, Film, ArrowLeft } from 'lucide-react';
import type { Playlist, Video } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { VideoCard } from '@/components/video-card';

function PlaylistView({ playlist, onBack }: { playlist: Playlist, onBack: () => void }) {
  const firestore = useFirestore();

  const videosQuery = useMemoFirebase(() => {
    if (!firestore || playlist.videoIds.length === 0) return null;
    return query(
      collection(firestore, 'videos'),
      where(documentId(), 'in', playlist.videoIds)
    );
  }, [firestore, playlist.videoIds]);

  const { data: videos, isLoading } = useCollection<Video>(videosQuery);

  return (
    <div>
        <div className="mb-8 flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={onBack}>
                <ArrowLeft />
                <span className="sr-only">Back to Playlists</span>
            </Button>
            <div>
                <h1 className="font-headline text-3xl font-bold">{playlist.name}</h1>
                <p className="text-muted-foreground">{playlist.videoIds.length} video{playlist.videoIds.length !== 1 ? 's' : ''}</p>
            </div>
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
            {!isLoading && videos?.length === 0 && playlist.videoIds.length > 0 && (
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle>Videos Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The videos in this playlist could not be loaded.</p>
                    </CardContent>
                </Card>
            )}
             {!isLoading && playlist.videoIds.length === 0 && (
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle>Empty Playlist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Add some videos to get started.</p>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="mx-auto">
                            <Link href="/">Browse Videos</Link>
                        </Button>
                    </CardFooter>
                </Card>
             )}
        </div>
    </div>
  )
}


export default function PlaylistsPage() {
  const { user, isUserLoading } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<Playlist | null>(null);

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

  const PlaylistsGrid = () => {
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
            <Card 
              key={playlist.id} 
              className="flex flex-col transition-transform hover:scale-105 hover:shadow-lg cursor-pointer"
              onClick={() => setSelectedPlaylist(playlist)}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelectedPlaylist(playlist)}
            >
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
        <div className="container max-w-4xl py-12">
            {selectedPlaylist ? (
              <PlaylistView playlist={selectedPlaylist} onBack={() => setSelectedPlaylist(null)} />
            ) : (
              <>
                <div className="mb-8 flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/profile">
                            <ArrowLeft />
                            <span className="sr-only">Back to Profile</span>
                        </Link>
                    </Button>
                    <h1 className="font-headline text-3xl font-bold">My Playlists</h1>
                </div>
                <PlaylistsGrid />
              </>
            )}
        </div>
      </main>
    </div>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, ArrowLeft, Undo, AlertTriangle } from 'lucide-react';
import type { Video } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

function TrashedVideoCard({ video }: { video: Video }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleRestore = () => {
        if (!firestore) return;
        const videoRef = doc(firestore, 'videos', video.id);
        updateDocumentNonBlocking(videoRef, { status: 'published', trashedAt: null });
        toast({
            title: 'Video Restored',
            description: `"${video.title}" has been restored.`,
        });
    };

    const handleDeleteForever = () => {
        if (!firestore) return;
        const videoRef = doc(firestore, 'videos', video.id);
        deleteDocumentNonBlocking(videoRef);
        toast({
            title: 'Video Permanently Deleted',
            description: `"${video.title}" has been deleted forever.`,
            variant: 'destructive'
        });
    };

    const timeInTrash = video.trashedAt ? formatDistanceToNow(video.trashedAt.toDate(), { addSuffix: true }) : 'unknown';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{video.title}</CardTitle>
                 <p className="text-sm text-muted-foreground">
                    Trashed {timeInTrash}
                </p>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleRestore}>
                    <Undo className="mr-2 h-4 w-4" />
                    Restore
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Forever
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the video
                            <span className="font-semibold"> {video.title}</span> from the database.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteForever}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}

export default function TrashPage() {
  const { user, isUserLoading, isAdmin } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push('/profile');
    }
  }, [user, isUserLoading, isAdmin, router]);

  const trashedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'videos'),
        where('status', '==', 'trashed'),
        orderBy('trashedAt', 'desc')
    );
  }, [firestore]);

  const { data: trashedVideos, isLoading } = useCollection<Video>(trashedQuery);
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      );
    }
    
    if (trashedVideos && trashedVideos.length > 0) {
      return (
        <div className="flex flex-col gap-4">
          {trashedVideos.map((video) => (
            <TrashedVideoCard key={video.id} video={video} />
          ))}
        </div>
      );
    }

    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>The Trash is Empty</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Good job keeping things tidy!</p>
        </CardContent>
      </Card>
    );
  }

  if (isUserLoading || !isAdmin) {
    return (
         <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-muted/20 flex items-center justify-center">
                <div className="container max-w-md text-center">
                    <p>Loading...</p>
                </div>
            </main>
            <Footer />
        </div>
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
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Trash2/> Trashed Videos</h1>
          </div>
          <div className="mb-8 p-4 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Heads up!</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Videos in the trash will be automatically and permanently deleted after 30 days.
                    </p>
                </div>
            </div>
          </div>
          {renderContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
}

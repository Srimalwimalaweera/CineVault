'use client';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Star, ThumbsUp, Download, Eye, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import type { Video } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();

  const videoRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'videos', params.id);
  }, [firestore, params.id]);

  const { data: video, isLoading } = useDoc<Video>(videoRef);

  if (isLoading) {
    return (
       <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-12">
            <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
              <div className="md:col-span-1">
                <Skeleton className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg" />
              </div>
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Skeleton className="h-10 w-24 rounded-full" />
                  <Skeleton className="h-10 w-24 rounded-full" />
                  <Skeleton className="h-10 w-24 rounded-full" />
                  <Skeleton className="h-10 w-24 rounded-full" />
                </div>
                <Separator className="my-8" />
                 <div className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!video) {
    notFound();
  }
  
  const stats = [
    { icon: Star, value: video.ratings?.toFixed(1) || 'N/A', label: 'Rating', color: 'text-yellow-400 fill-yellow-400' },
    { icon: ThumbsUp, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.reactionCount || 0), label: 'Reactions' },
    { icon: Download, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.downloadCount || 0), label: 'Downloads' },
    { icon: Eye, value: Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.viewCount || 0), label: 'Views' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
            <div className="md:col-span-1">
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-lg">
                <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
              </div>
            </div>
            <div className="md:col-span-2">
              <h1 className="mb-4 font-headline text-4xl font-bold tracking-tight">{video.title}</h1>
              <p className="mb-6 text-lg text-muted-foreground">{video.description}</p>
              
              <div className="mb-6 flex flex-wrap items-center gap-4">
                {stats.map(stat => (
                   <Badge key={stat.label} variant="outline" className="flex items-center gap-2 py-2 px-3 text-base">
                    <stat.icon className={`h-5 w-5 ${stat.color || ''}`} />
                    <div>
                      <span className="font-bold">{stat.value}</span>
                      <span className="ml-1 text-muted-foreground">{stat.label}</span>
                    </div>
                  </Badge>
                ))}
              </div>

              <Separator className="my-8" />
              
              <div className="space-y-4">
                  <h2 className="font-headline text-2xl font-semibold">Video Link</h2>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                      <p className="break-all text-muted-foreground">{video.videoUrl}</p>
                      <Button asChild className="shrink-0">
                          <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Open Link
                          </a>
                      </Button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


'use client';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { VideoCard } from '@/components/video-card';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Video } from '@/lib/types';
import { Button } from "@/components/ui/button"; 

export default function Home() {
  const firestore = useFirestore();

  const videosQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'videos'), 
        where('status', '==', 'published'),
        orderBy('title')
    );
  }, [firestore]);

  const { data: videos, isLoading } = useCollection<Video>(videosQuery);

  const migrateData = async () => {
    if (!firestore) return;
    console.log("Starting migration...");
    
    try {
      const querySnapshot = await getDocs(collection(firestore, "videos"));
      
      const updates: Promise<void>[] = [];
      querySnapshot.forEach((videoDoc) => {
          const data = videoDoc.data();
          if (!data.status) {
              updates.push(updateDoc(doc(firestore, "videos", videoDoc.id), {
                  status: 'published',
                  trashedAt: null,
                  createdAt: data.createdAt || new Date()
              }));
              console.log(`Queueing update for video: ${videoDoc.id}`);
          }
      });
      await Promise.all(updates);
      console.log("Migration finished!");
      alert("Data migration complete!");
    } catch(e) {
      console.error("Migration failed: ", e);
      alert("Migration failed. Check the console for errors. You might need to be an admin.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          <Button onClick={migrateData} variant="secondary" className="mb-4">Fix Database Data</Button>
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
            {videos?.map((video, index) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                priority={index < 2}
              />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

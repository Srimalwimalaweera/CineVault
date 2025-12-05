import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { VideoCard } from '@/components/video-card';
import { videos } from '@/lib/data';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="mb-6 font-headline text-3xl font-bold tracking-tight md:text-4xl">
            Trending Videos
          </h1>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

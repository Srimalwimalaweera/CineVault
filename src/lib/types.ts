export type Video = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  thumbnailHint: string;
  stats: {
    rating: number;
    reactions: number;
    downloads: number;
    views: number;
  };
};

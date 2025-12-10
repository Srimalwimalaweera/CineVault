
export type Video = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  thumbnailHint?: string;
  ratings?: number;
  reactionCount?: number;
  downloadCount?: number;
  viewCount?: number;
};

export type Rating = {
    id: string;
    userId: string;
    videoId: string;
    rating: number;
    createdAt: any; // Typically a Firestore Timestamp
};

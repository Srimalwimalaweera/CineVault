
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
  createdAt: any; // Firestore Timestamp
  status?: 'published' | 'trashed';
  trashedAt?: any; // Firestore Timestamp
  accessLevel?: 'free' | 'pro';
};

export type Rating = {
    id: string;
    userId: string;
    videoId: string;
    rating: number;
    createdAt: any; // Typically a Firestore Timestamp
};

export type Playlist = {
    id: string;
    userId: string;
    name: string;
    videoIds: string[];
    createdAt: any; // Firestore Timestamp
};

    

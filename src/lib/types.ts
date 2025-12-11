
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

export type UserProfile = {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role: 'user' | 'admin';
    status: 'free' | 'pro';
    createdAt: any; // Firestore Timestamp
    proActivationDate?: any; // Firestore Timestamp
    rejectedPayments?: any[]; // Array of Timestamps
};

export type Payment = {
    id: string;
    userId: string;
    totalAmount: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: any; // Firestore Timestamp
    updatedAt?: any; // Firestore Timestamp
    cards: {
        provider: string;
        amount: number;
        pin: string;
    }[];
    user?: { // Denormalized user data for easy display
        displayName: string;
        email: string;
    }
}

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

    
    
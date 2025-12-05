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

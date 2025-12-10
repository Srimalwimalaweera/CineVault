
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ListPlus, Plus } from 'lucide-react';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  arrayUnion,
  writeBatch,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Playlist } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

interface AddToListDialogProps {
  videoId: string;
  children: React.ReactNode;
}

const WATCH_LATER_PLAYLIST_NAME = 'Watch Later';

export function AddToListDialog({ videoId, children }: AddToListDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [newPlaylistName, setNewPlaylistName] = React.useState('');
  const [selectedPlaylists, setSelectedPlaylists] = React.useState<
    Record<string, boolean>
  >({});
  const [isCreating, setIsCreating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const playlistsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/playlists`),
      where('name', '!=', WATCH_LATER_PLAYLIST_NAME)
    );
  }, [firestore, user]);

  const watchLaterQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/playlists`),
      where('name', '==', WATCH_LATER_PLAYLIST_NAME)
    );
  }, [firestore, user]);

  const { data: playlists, isLoading: isLoadingPlaylists } =
    useCollection<Playlist>(playlistsQuery);
  const { data: watchLaterList, isLoading: isLoadingWatchLater } =
    useCollection<Playlist>(watchLaterQuery);

  const isLoading = isLoadingPlaylists || isLoadingWatchLater;
  const watchLaterPlaylist = watchLaterList?.[0];

  React.useEffect(() => {
    if (open && !isLoading) {
      const initialSelection: Record<string, boolean> = {};
      if (watchLaterPlaylist?.videoIds.includes(videoId)) {
        initialSelection[watchLaterPlaylist.id] = true;
      }
      playlists?.forEach((p) => {
        if (p.videoIds.includes(videoId)) {
          initialSelection[p.id] = true;
        }
      });
      setSelectedPlaylists(initialSelection);
    }
  }, [open, playlists, watchLaterPlaylist, videoId, isLoading]);

  const handleCreatePlaylist = async () => {
    if (!firestore || !user || !newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const newPlaylistRef = await addDoc(
        collection(firestore, `users/${user.uid}/playlists`),
        {
          name: newPlaylistName,
          userId: user.uid,
          videoIds: [videoId], // Add current video to new playlist
          createdAt: serverTimestamp(),
        }
      );
      toast({
        title: 'Playlist Created',
        description: `"${newPlaylistName}" created and video added.`,
      });
      setSelectedPlaylists((prev) => ({ ...prev, [newPlaylistRef.id]: true }));
      setNewPlaylistName('');
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not create playlist.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!firestore || !user) return;
    setIsSaving(true);
    const batch = writeBatch(firestore);

    // Ensure Watch Later exists if selected
    let finalWatchLaterId = watchLaterPlaylist?.id;
    if (selectedPlaylists['watch-later-special'] && !watchLaterPlaylist) {
        const watchLaterRef = doc(collection(firestore, `users/${user.uid}/playlists`));
        batch.set(watchLaterRef, {
            name: WATCH_LATER_PLAYLIST_NAME,
            userId: user.uid,
            videoIds: [],
            createdAt: serverTimestamp(),
        });
        finalWatchLaterId = watchLaterRef.id;
    }

    const allPlaylists = [...(playlists || [])];
    if (watchLaterPlaylist) {
        allPlaylists.push(watchLaterPlaylist);
    }
    
    allPlaylists.forEach(p => {
        const playlistRef = doc(firestore, `users/${user.uid}/playlists`, p.id);
        const isSelected = selectedPlaylists[p.id];
        const alreadyIn = p.videoIds.includes(videoId);

        if (isSelected && !alreadyIn) {
            batch.update(playlistRef, { videoIds: arrayUnion(videoId) });
        } else if (!isSelected && alreadyIn) {
            batch.update(playlistRef, { videoIds: [videoId] });
        }
    });

    // Handle special case for newly created Watch Later
    if (finalWatchLaterId && finalWatchLaterId !== watchLaterPlaylist?.id && selectedPlaylists['watch-later-special']) {
        const newWatchLaterRef = doc(firestore, `users/${user.uid}/playlists`, finalWatchLaterId);
        batch.update(newWatchLaterRef, { videoIds: arrayUnion(videoId) });
    }

    try {
      await batch.commit();
      toast({
        title: 'Playlists Updated',
        description: 'Your changes have been saved.',
      });
      setOpen(false);
    } catch (error) {
      console.error('Error saving playlists:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your changes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onOpenDialog = (isOpen: boolean) => {
    if (!user) {
        if (isOpen) {
            toast({
                variant: 'destructive',
                title: 'Login Required',
                description: 'You need to be logged in to manage playlists.',
            });
        }
        setOpen(false);
    } else {
        setOpen(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenDialog}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to playlist</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {isLoading ? (
            <div className="space-y-3 pr-6">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <ScrollArea className="max-h-40 pr-6">
              <div className="space-y-3">
                 <div className="flex items-center space-x-3">
                    <Checkbox
                        id="watch-later-special"
                        checked={selectedPlaylists[watchLaterPlaylist?.id ?? 'watch-later-special']}
                        onCheckedChange={(checked) =>
                        setSelectedPlaylists((prev) => ({
                            ...prev,
                            [watchLaterPlaylist?.id ?? 'watch-later-special']: !!checked,
                        }))
                        }
                    />
                    <Label htmlFor="watch-later-special" className="font-medium">
                        {WATCH_LATER_PLAYLIST_NAME}
                    </Label>
                </div>
                {playlists?.map((p) => (
                  <div key={p.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={p.id}
                      checked={selectedPlaylists[p.id] || false}
                      onCheckedChange={(checked) =>
                        setSelectedPlaylists((prev) => ({
                          ...prev,
                          [p.id]: !!checked,
                        }))
                      }
                    />
                    <Label htmlFor={p.id}>{p.name}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="new-playlist">Create new playlist</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="new-playlist"
                placeholder="e.g., Sci-Fi Favorites"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                disabled={isCreating}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim() || isCreating}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    
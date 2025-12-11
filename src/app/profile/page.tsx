
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/hooks/use-auth';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, KeyRound, Save, Heart, ListVideo, Trash2 } from 'lucide-react';
import type { Playlist, Video } from '@/lib/types';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isUserLoading, logout, isAdmin } = useAuthContext();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    // Redirect if not logged in after loading has completed
    if (!isUserLoading && !user) {
      router.push('/');
    }
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user, isUserLoading, router]);

  const favoritesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/favorites`);
  }, [firestore, user]);

  const playlistsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/playlists`);
  }, [firestore, user]);

  const { data: favorites, isLoading: isLoadingFavorites } = useCollection<{videoId: string}>(favoritesQuery);
  const { data: playlists, isLoading: isLoadingPlaylists } = useCollection<Playlist>(playlistsQuery);

  const handleUpdateDisplayName = async () => {
    if (!user || !firestore || !displayName.trim()) {
      console.error('Display name cannot be empty.');
      return;
    }
    setIsSavingName(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName.trim() });
      // Update Firestore profile
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { displayName: displayName.trim() });
    } catch (error: any) {
      console.error('Error updating display name:', error);
    } finally {
      setIsSavingName(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(user.auth, user.email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-12">
            <div className="mx-auto max-w-4xl space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
              <div className="grid gap-8 md:grid-cols-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container py-12">
          <div className="mx-auto max-w-4xl space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <User /> Profile Settings
                </CardTitle>
                <CardDescription>Manage your display name and personal information.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email || ''} disabled className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                      />
                      <Button onClick={handleUpdateDisplayName} disabled={isSavingName}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSavingName ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <Heart /> My Favorites
                  </CardTitle>
                  <CardDescription>The videos you have loved.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFavorites ? (
                    <Skeleton className="h-10 w-1/2" />
                  ) : (
                    <p className="text-4xl font-bold">{favorites?.length || 0}</p>
                  )}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/profile/favorites">View Favorites</Link>
                    </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline">
                    <ListVideo /> My Playlists
                  </CardTitle>
                  <CardDescription>Your curated collections.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPlaylists ? (
                     <Skeleton className="h-10 w-1/2" />
                  ) : (
                    <p className="text-4xl font-bold">{playlists?.length || 0}</p>
                  )}
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/profile/playlists">View Playlists</Link>
                    </Button>
                </CardFooter>
              </Card>
            </div>
            
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                  <KeyRound /> Security
                </CardTitle>
                <CardDescription>Manage your account security settings.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Click the button to receive an email to reset your password.
                </p>
                <Button variant="destructive" onClick={handlePasswordReset}>
                  Send Password Reset Email
                </Button>
              </CardContent>
            </Card>

            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Trash2 /> Admin
                        </CardTitle>
                        <CardDescription>Manage application content.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/admin/trash">Manage Trash</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="text-center">
              <Button variant="ghost" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Video, Star, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import Lottie from 'lottie-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/hooks/use-auth';

const proFeatures = [
  {
    icon: Crown,
    title: 'Exclusive Content',
    description: 'Access a library of members-only videos and series.',
  },
  {
    icon: Zap,
    title: 'Ad-Free Experience',
    description: 'Enjoy uninterrupted viewing without any advertisements.',
  },
  {
    icon: Video,
    title: 'Early Access',
    description: 'Watch new releases and premieres before anyone else.',
  },
];


export default function ProPage() {
  const [crownAnimation, setCrownAnimation] = useState(null);
  const { user, isUserLoading } = useAuthContext();

  useEffect(() => {
    const fetchAnimation = async () => {
        try {
            const res = await fetch('https://lottie.host/b0405f6a-1155-4674-8ac7-2a446fac2a0d/r4O2p0DRIs.json');
            const animationData = await res.json();
            setCrownAnimation(animationData);
        } catch (error) {
            console.error("Failed to load crown animation", error);
        }
    };
    fetchAnimation();
  }, []);

  const renderContent = () => {
      if (isUserLoading) {
          return <Skeleton className='w-full h-48' />;
      }

      if (user?.status === 'pro') {
          return (
            <Card className="text-center bg-black/20 border-gold/50">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-gold font-headline">
                        <ShieldCheck /> You are a Pro Member!
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-white/80">
                        You already have access to all exclusive Pro features. Enjoy the experience!
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="mx-auto" variant="outline">
                        <Link href="/latest?filter=pro">Browse Pro Content</Link>
                    </Button>
                </CardFooter>
            </Card>
          )
      }

      return (
        <>
            <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
                Unlock XVault Pro
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/70">
                Upgrade your experience and get access to all premium features.
            </p>
            <div className='mt-12'>
                <Button size="lg" asChild className="w-full max-w-xs font-bold text-lg py-7 bg-gold text-black hover:bg-gold/90 animate-shimmer-gold bg-gradient-to-r from-gold via-yellow-100 to-gold bg-[length:200%_100%]">
                    <Link href="/activate-pro">
                        <BadgeCheck className="mr-2 h-6 w-6" />
                        Upgrade Now
                    </Link>
                </Button>
            </div>
        </>
      )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container max-w-2xl py-12 text-center">
            <div className="mb-8 inline-block rounded-full bg-gold/10 p-3 border border-gold/30">
              {crownAnimation ? (
                <Lottie animationData={crownAnimation} loop={true} className="h-16 w-16" />
              ) : (
                <Skeleton className="h-16 w-16 rounded-full" />
              )}
          </div>
          {renderContent()}

           <div className="mt-12 text-left">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {proFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <feature.icon className="h-6 w-6 text-gold" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold leading-6 text-white">{feature.title}</h3>
                    <p className="mt-1 text-base leading-6 text-white/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

    
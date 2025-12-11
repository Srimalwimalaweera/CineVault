
'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Video, Star, BadgeCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

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
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container max-w-2xl py-12 text-center">
            <div className="mb-8 inline-block rounded-full bg-gold/10 p-4 border border-gold/30">
              <Crown className="h-12 w-12 text-gold animate-shimmer-gold bg-gradient-to-r from-gold via-yellow-200 to-gold bg-[length:200%_100%] bg-clip-text text-transparent" />
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
            Unlock XVault Pro
          </h1>
          <p className="mt-6 text-lg leading-8 text-white/70">
            Upgrade your experience and get access to all premium features.
          </p>

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
          
          <div className='mt-12'>
            <Button size="lg" asChild className="w-full max-w-xs font-bold text-lg py-7 bg-gold text-black hover:bg-gold/90 animate-shimmer-gold bg-gradient-to-r from-gold via-yellow-100 to-gold bg-[length:200%_100%]">
                <Link href="/sample">
                    <BadgeCheck className="mr-2 h-6 w-6" />
                    Upgrade Now
                </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

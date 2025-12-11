
'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';

export default function TrendingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container max-w-2xl py-12">
          <div className="mb-8 flex items-center gap-4">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <Flame/> Trending
            </h1>
          </div>
           <Card className="text-center">
            <CardHeader>
                <CardTitle>Coming Soon!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The trending page is under construction. Check back later to see what's hot!</p>
            </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}

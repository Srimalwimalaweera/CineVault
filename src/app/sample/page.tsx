
'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SamplePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container max-w-2xl py-12">
            <div className="mb-8 flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/pro">
                        <ArrowLeft />
                        <span className="sr-only">Back to Pro Page</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <CreditCard/> Secure Payment
                </h1>
            </div>
           <Card className="text-center">
            <CardHeader>
                <CardTitle>Payment Page</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The payment processing details will appear here. This page is currently under construction.</p>
            </CardContent>
           </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

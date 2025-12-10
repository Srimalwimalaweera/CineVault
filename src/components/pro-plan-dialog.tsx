
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Zap, Video, Star, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProPlanDialogProps {
  children: React.ReactNode;
}

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
  {
    icon: Star,
    title: 'High-Quality Streaming',
    description: 'Stream all content in stunning 4K resolution.',
  },
];

export function ProPlanDialog({ children }: ProPlanDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900 to-black text-white border-gold/30">
        <DialogHeader className="items-center text-center">
          <div className="rounded-full bg-gold/10 p-3 border border-gold/30 w-fit">
              <Crown className="h-8 w-8 text-gold animate-shimmer-gold bg-gradient-to-r from-gold via-yellow-200 to-gold bg-[length:200%_100%] bg-clip-text text-transparent" />
          </div>
          <DialogTitle className="font-headline text-2xl mt-2">Unlock XVault Pro</DialogTitle>
          <DialogDescription className="text-white/70">
            Upgrade your experience and get access to all premium features.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {proFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <feature.icon className="h-5 w-5 text-gold flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-white/60">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
           <Button asChild className="w-full font-bold text-lg py-6 bg-gold text-black hover:bg-gold/90 animate-shimmer-gold bg-gradient-to-r from-gold via-yellow-100 to-gold bg-[length:200%_100%]">
                <Link href="/pro">
                    <BadgeCheck className="mr-2 h-5 w-5" />
                    Explore Pro Videos
                </Link>
          </Button>
          <Button variant="outline" className="w-full border-gold/50 text-white hover:bg-gold/10 hover:text-white" onClick={() => setOpen(false)}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

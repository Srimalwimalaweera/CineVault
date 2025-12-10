
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, PlusSquare, Sparkles, User, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminUploadDialog } from '../admin/upload-dialog';
import { useAuthContext } from '@/hooks/use-auth';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/trending', icon: Flame, label: 'Trending' },
  { href: '/latest', icon: Sparkles, label: 'Latest' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/pro', icon: Crown, label: 'Pro' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthContext();
  const isLoggedIn = !!user;

  // The central button is now the admin upload, so we render nav items around it.
  const centralIndexForNav = Math.floor(navItems.length / 2);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className="container flex h-16 items-center justify-around">
        {navItems.slice(0, centralIndexForNav).map((item) => {
           const isActive = pathname === item.href;
           const isPro = item.href === '/pro';
           return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                  isActive && !isPro && 'text-primary',
                  isActive && isPro && 'animate-shimmer-gold-nav bg-gradient-to-r from-gold via-white to-gold bg-[length:200%_100%] bg-clip-text text-transparent'
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && isPro && "text-gold")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
           )
        })}

        {isAdmin && (
          <div className="-mt-6">
            <AdminUploadDialog />
          </div>
        )}

        {navItems.slice(centralIndexForNav).map((item) => {
           const isActive = pathname === item.href;
           const isPro = item.href === '/pro';
           return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                  isActive && !isPro && 'text-primary',
                  isActive && isPro && 'animate-shimmer-gold-nav bg-gradient-to-r from-gold via-white to-gold bg-[length:200%_100%] bg-clip-text text-transparent'
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && isPro && "text-gold")} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
           )
        })}
      </nav>
    </div>
  );
}

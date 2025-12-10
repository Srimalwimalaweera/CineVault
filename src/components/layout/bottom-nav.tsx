
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, Sparkles, User, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminUploadDialog } from '../admin/upload-dialog';
import { useAuthContext } from '@/hooks/use-auth';
import { ProPlanDialog } from '@/components/pro-plan-dialog';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/trending', icon: Flame, label: 'Trending' },
  { href: '/latest', icon: Sparkles, label: 'Latest' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAdmin } = useAuthContext();
  const isLoggedIn = !!user;

  const centralIndexForNav = Math.floor(navItems.length / 2);
  const isProPage = pathname === '/pro';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className="container flex h-16 items-center justify-around">
        {navItems.slice(0, centralIndexForNav).map((item) => {
           const isActive = pathname === item.href;
           return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                  isActive && 'text-primary'
                )}
              >
                <item.icon className="h-6 w-6" />
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
           return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                  isActive && 'text-primary'
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
           )
        })}
        
        <Link
          href="/pro"
          className={cn(
            'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary cursor-pointer',
            isProPage && 'animate-shimmer-gold-nav bg-gradient-to-r from-gold via-white to-gold bg-[length:200%_100%] bg-clip-text text-transparent'
          )}
        >
          <Crown className={cn("h-6 w-6", isProPage && "text-gold")} />
          <span className="text-xs font-medium">Pro</span>
        </Link>
      </nav>
    </div>
  );
}

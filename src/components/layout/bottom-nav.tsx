'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Flame, PlusSquare, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminUploadDialog } from '../admin/upload-dialog';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/trending', icon: Flame, label: 'Trending' },
  { href: '/latest', icon: Sparkles, label: 'Latest' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className="container flex h-16 items-center justify-around">
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
              pathname === item.href ? 'text-primary' : ''
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}

        <div className="-mt-6">
          <AdminUploadDialog />
        </div>

        {navItems.slice(2).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
              pathname === item.href ? 'text-primary' : ''
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

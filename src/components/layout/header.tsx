'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { AdminUploadDialog } from '@/components/admin/upload-dialog';
import { useAuthContext } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';

const XVaultIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <style>
      {`
        @keyframes gradient-flow {
          0% { stop-color: hsl(var(--primary)); }
          50% { stop-color: hsl(var(--destructive)); }
          100% { stop-color: hsl(var(--primary)); }
        }
        @keyframes gradient-flow-accent {
          0% { stop-color: hsl(var(--accent)); }
          50% { stop-color: hsl(var(--primary)); }
          100% { stop-color: hsl(var(--accent)); }
        }
        #grad-stop-1 {
          animation: gradient-flow 4s ease-in-out infinite;
        }
        #grad-stop-2 {
          animation: gradient-flow-accent 4s ease-in-out infinite;
        }
      `}
    </style>
    <defs>
      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop id="grad-stop-1" offset="0%" />
        <stop id="grad-stop-2" offset="100%" />
      </linearGradient>
    </defs>
    <path d="M6.5 17.5L17.5 6.5" stroke="url(#iconGradient)" strokeWidth="3"/>
    <path d="M6.5 6.5L17.5 17.5" stroke="url(#iconGradient)" strokeWidth="3"/>
  </svg>
);


export function Header() {
  const { user, isUserLoading, logout, isAdmin } = useAuthContext();
  const isLoggedIn = !!user;

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <XVaultIcon className="h-8 w-8" />
            <span className="font-headline text-xl font-bold sm:inline-block">
              XVault
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          {isAdmin && (
            <div className="hidden md:block">
              <AdminUploadDialog />
            </div>
          )}
          {isUserLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        user.photoURL ||
                        `https://i.pravatar.cc/150?u=${user.uid}`
                      }
                      alt={user.email || 'user'}
                    />
                    <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      My Account
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthDialog />
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import * as React from 'react';

export function Footer() {
  const [year, setYear] = React.useState(new Date().getFullYear());
  
  // This is a client component due to usage of `useState`
  // We can avoid hydration errors by setting the year on mount
  React.useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t bg-background/50">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        © {year} XVault. All Rights Reserved.
      </div>
    </footer>
  );
}

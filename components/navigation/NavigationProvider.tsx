'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface NavigationContextValue {
  isNavigating: boolean;
  pendingHref: string | null;
  startNavigation: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

function resolveHref(href: string, pathname: string): string {
  if (href.startsWith('?')) return `${pathname}${href}`;
  return href.split('#')[0] ?? href;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const routeKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setIsNavigating(false);
    setPendingHref(null);
  }, [routeKey]);

  const startNavigation = useCallback((href: string) => {
    setIsNavigating(true);
    setPendingHref(href);
  }, []);

  return (
    <NavigationContext.Provider value={{ isNavigating, pendingHref, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}

export function useLinkPending(href: string): boolean {
  const { pendingHref } = useNavigation();
  const pathname = usePathname();
  if (!pendingHref) return false;
  const resolved = resolveHref(href, pathname);
  return pendingHref === resolved;
}

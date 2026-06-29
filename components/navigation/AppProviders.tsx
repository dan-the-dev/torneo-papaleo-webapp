'use client';

import { Suspense } from 'react';
import { NavigationProvider } from './NavigationProvider';
import { NavigationProgress } from './NavigationProgress';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavigationProvider>
        <NavigationProgress />
        {children}
      </NavigationProvider>
    </Suspense>
  );
}

'use client';

import { useNavigation } from './NavigationProvider';

export function NavigationProgress() {
  const { isNavigating } = useNavigation();

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-[#e87425]/20 pointer-events-none"
      role="progressbar"
      aria-label="Caricamento pagina"
    >
      <div className="h-full w-1/3 bg-[#e87425] animate-navigation-progress" />
    </div>
  );
}

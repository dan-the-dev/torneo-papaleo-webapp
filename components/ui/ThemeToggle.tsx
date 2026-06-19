'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains('light'));
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? 'Attiva tema scuro' : 'Attiva tema chiaro'}
      className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors leading-none"
      suppressHydrationWarning
    >
      {isLight ? '☀️' : '🌙'}
    </button>
  );
}

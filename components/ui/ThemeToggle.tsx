'use client';

import { useEffect, useState } from 'react';

function MoonIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  );
}

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
      title="Cambia tema"
      role="switch"
      aria-checked={isLight}
      suppressHydrationWarning
      className="relative inline-flex h-7 w-14 shrink-0 rounded-full bg-[var(--border)] transition-colors"
    >
      {/* Moon icon — left */}
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none z-10">
        <MoonIcon />
      </span>
      {/* Sun icon — right */}
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none z-10">
        <SunIcon />
      </span>
      {/* Sliding circle */}
      <span
        suppressHydrationWarning
        className={`absolute top-1 h-5 w-5 rounded-full bg-[#e87425] shadow-sm transition-transform duration-200 ${
          isLight ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

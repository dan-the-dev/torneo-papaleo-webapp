'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LoadingLink } from '@/components/navigation/LoadingLink';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/gironi', label: 'Classifica' },
  { href: '/tabellone', label: 'Tabellone' },
  { href: '/marcatori', label: 'Marcatori' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/regolamento', label: 'Regolamento' },
];

function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function NavLinks({
  pathname,
  onLinkClick,
}: {
  pathname: string;
  onLinkClick?: () => void;
}) {
  return (
    <nav className="flex-1 px-3 py-2">
      {navLinks.map((l) => (
        <LoadingLink
          key={l.href}
          href={l.href}
          {...(onLinkClick ? { onClick: onLinkClick } : {})}
          showSpinner
          className={`flex items-center px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
            isActive(l.href, pathname)
              ? 'bg-[#e87425] text-white'
              : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
          }`}
        >
          {l.label}
        </LoadingLink>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  function close() {
    setIsOpen(false);
  }

  return (
    <>
      {/* ─── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-[var(--background)] border-r border-[var(--border)] z-40">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <LoadingLink href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Ardor Bollate" className="h-10 w-auto" />
          </LoadingLink>
          <ThemeToggle />
        </div>
        <NavLinks pathname={pathname} />
        <div className="px-5 py-4 border-t border-[var(--border)] space-y-1">
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Torneo Andrea Papaleo 2026
          </p>
          <LoadingLink
            href="/privacy"
            className={`text-xs transition-colors ${
              pathname === '/privacy'
                ? 'text-[#e87425] font-medium'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            }`}
          >
            Privacy
          </LoadingLink>
        </div>
      </aside>

      {/* ─── Mobile top bar ──────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-4 h-14">
        <LoadingLink href="/" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Ardor Bollate" className="h-8 w-auto" />
        </LoadingLink>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
          onClick={() => setIsOpen(true)}
          aria-label="Apri menu"
          className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="19" y2="6" />
            <line x1="3" y1="11" x2="19" y2="11" />
            <line x1="3" y1="16" x2="19" y2="16" />
          </svg>
        </button>
        </div>
      </header>

      {/* ─── Mobile drawer + backdrop ────────────────────────── */}
      {isOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/60"
            onClick={close}
          />
          <aside className="md:hidden flex flex-col fixed left-0 top-0 h-full w-[220px] z-50 bg-[var(--background)] border-r border-[var(--border)]">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <LoadingLink href="/" onClick={close}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Ardor Bollate" className="h-8 w-auto" />
              </LoadingLink>
              <button
                onClick={close}
                aria-label="Chiudi menu"
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="4" x2="14" y2="14" />
                  <line x1="14" y1="4" x2="4" y2="14" />
                </svg>
              </button>
            </div>
            <NavLinks pathname={pathname} onLinkClick={close} />
            <div className="px-5 py-4 border-t border-[var(--border)] space-y-1">
              <p className="text-xs text-[var(--muted)]">Torneo Andrea Papaleo 2026</p>
              <LoadingLink
                href="/privacy"
                onClick={close}
                className={`text-xs transition-colors ${
                  pathname === '/privacy'
                    ? 'text-[#e87425] font-medium'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                Privacy
              </LoadingLink>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { LoadingLink } from '@/components/navigation/LoadingLink';
import { LogoutButton } from './LogoutButton';

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/partite', label: 'Partite' },
  { href: '/admin/tabellone', label: 'Tabellone' },
];

function isActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function AdminHeader({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const pathname = usePathname();

  return (
    <header className="bg-[var(--card)] border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-3 py-3">
          <LoadingLink href="/admin" className="flex items-center gap-2.5 flex-shrink-0">
            <Logo className="h-8 w-auto" />
            <span className="text-sm font-bold text-white hidden sm:block">Admin</span>
          </LoadingLink>
          <nav className="flex-1 flex items-center gap-0.5">
            {adminLinks.map((l) => (
              <LoadingLink
                key={l.href}
                href={l.href}
                showSpinner
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isActive(l.href, pathname)
                    ? 'text-white bg-white/10'
                    : 'text-[var(--muted)] hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
              </LoadingLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LogoutButton action={logoutAction} />
          </div>
        </div>
      </div>
    </header>
  );
}

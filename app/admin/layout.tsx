import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { logoutAction } from './actions';

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/partite', label: 'Partite' },
  { href: '/admin/tabellone', label: 'Tabellone' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-dark flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="bg-[var(--card)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            <Link href="/admin" className="flex items-center gap-2.5 flex-shrink-0">
              <Logo className="h-8 w-auto" />
              <span className="text-sm font-bold text-white hidden sm:block">Admin</span>
            </Link>
            <nav className="flex-1 flex items-center gap-0.5">
              {adminLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 text-sm text-[var(--muted)] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-xs text-[var(--muted)] hover:text-white transition-colors"
                >
                  Esci
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
